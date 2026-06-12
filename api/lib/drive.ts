import { getGoogleAccessToken, listCollection, deleteDocument, saveDocument } from "./firebase.js";

export async function getDriveAccessToken() {
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (refreshToken && clientId && clientSecret) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!response.ok) throw new Error(`Drive OAuth refresh failed: ${await response.text()}`);
    return (await response.json()).access_token as string;
  }

  return getGoogleAccessToken("https://www.googleapis.com/auth/drive");
}

const driveFolderId = process.env.DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.VITE_DRIVE_ROOT_FOLDER_ID;

export async function ensureDriveFolder(patient: any) {
  if (patient.driveFolderId) return patient.driveFolderId;
  if (!driveFolderId) throw new Error("DRIVE_FOLDER_ID or GOOGLE_DRIVE_FOLDER_ID is required.");

  const token = await getDriveAccessToken();
  const patientName = [patient.last_name, patient.first_name, patient.initials].filter(Boolean).join("_") || patient.id;
  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: patientName.replace(/[^\w .-]/g, "_"),
      mimeType: "application/vnd.google-apps.folder",
      parents: [driveFolderId],
    }),
  });
  if (!response.ok) throw new Error(`Drive folder create failed: ${await response.text()}`);

  const folderId = (await response.json()).id;
  if (patient.id) {
    try {
      await saveDocument("patients", patient.id, { ...patient, driveFolderId: folderId, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.warn(`Could not persist driveFolderId for patient ${patient.id}:`, error);
    }
  }
  return folderId;
}

export async function uploadToDrive(payload: any, folderId: string) {
  const token = await getDriveAccessToken();
  const base64 = String(payload.contentBase64 || "").replace(/^data:.*?;base64,/, "");
  const metadata = {
    name: payload.name,
    mimeType: payload.mimeType || "application/octet-stream",
    parents: [folderId],
  };
  const boundary = `oncodb_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${metadata.mimeType}\r\n\r\n`),
    Buffer.from(base64, "base64"),
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType,size", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) throw new Error(`Drive upload failed: ${await response.text()}`);
  return response.json();
}

export async function deleteDriveFile(fileId: string) {
  const token = await getDriveAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true&supportsTeamDrives=true`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (response.status === 204 || response.status === 404) {
    console.log(`Successfully deleted Drive file: ${fileId}`);
    return;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete Drive file ${fileId}: ${response.status} ${errorText}`);
  }
}

export async function recursivelyDeleteDriveFolder(folderId: string, maxRetries = 3) {
  const token = await getDriveAccessToken();
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const verifyResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?supportsAllDrives=true&supportsTeamDrives=true&fields=id,name,mimeType`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verifyResponse.status === 404) {
        console.log(`Folder ${folderId} already deleted or doesn't exist`);
        return;
      }

      if (!verifyResponse.ok) {
        throw new Error(`Could not verify folder ${folderId}: ${verifyResponse.status}`);
      }

      const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&pageSize=100&supportsAllDrives=true&supportsTeamDrives=true&fields=files(id,mimeType,name)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!listResponse.ok) {
        console.warn(`Could not list contents of folder ${folderId}: ${listResponse.status}`);
        throw new Error(`Failed to list folder ${folderId}`);
      }

      const listData = await listResponse.json();
      const children = listData.files || [];

      console.log(`Folder ${folderId} has ${children.length} non-trashed children to delete`);

      for (const child of children) {
        try {
          if (child.mimeType === "application/vnd.google-apps.folder") {
            console.log(`  Recursing into subfolder: ${child.name} (${child.id})`);
            await recursivelyDeleteDriveFolder(child.id, maxRetries);
          } else {
            console.log(`  Deleting file: ${child.name} (${child.id})`);
            await deleteDriveFile(child.id);
          }
        } catch (e) {
          console.error(`  Failed to delete child ${child.id}:`, e);
        }
      }

      console.log(`Deleting folder: ${folderId}`);
      await deleteDriveFile(folderId);

      console.log(`Successfully deleted folder ${folderId}`);
      return;

    } catch (e) {
      retryCount++;
      console.error(`Error deleting folder ${folderId} (attempt ${retryCount}/${maxRetries}):`, e);

      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
      } else {
        console.error(`Final failure deleting folder ${folderId} after ${maxRetries} attempts`);
        throw e;
      }
    }
  }
}

export async function wipePatientAssets(patient: any) {
  const files = (await listCollection("files")).filter((file: any) => file.patientId === patient.id);
  for (const file of files) {
    if (file.driveFileId) {
      try {
        await deleteDriveFile(file.driveFileId);
      } catch (e) {
        console.error(`Failed to delete Drive file ${file.driveFileId} for patient ${patient.id}:`, e);
      }
    }
    await deleteDocument("files", file.id);
  }

  if (patient.driveFolderId) {
    try {
      await deleteDriveFile(patient.driveFolderId);
    } catch (e) {
      console.error(`Failed to delete Drive folder for patient ${patient.id}:`, e);
    }
  }
}
