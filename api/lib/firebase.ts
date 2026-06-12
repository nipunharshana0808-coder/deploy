import crypto from "crypto";

const firebaseProjectId = process.env.FIREBASE_WEB_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const firebaseServiceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let firebaseServiceAccount: any = null;

function parseServiceAccount(raw: string) {
  if (!raw || raw === "{") return null;
  try {
    return JSON.parse(raw.replace(/\n/g, "\\n").replace(/\\n/g, "\n"));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

if (firebaseServiceAccountRaw) {
  firebaseServiceAccount = parseServiceAccount(firebaseServiceAccountRaw);
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function getGoogleAccessToken(scope: string) {
  if (!firebaseServiceAccount?.client_email || !firebaseServiceAccount?.private_key) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required for Firestore server access.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: firebaseServiceAccount.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const unsigned = `${header}.${claim}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(firebaseServiceAccount.private_key);
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Google auth failed: ${await response.text()}`);
  return (await response.json()).access_token as string;
}

function encodeFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "object") {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encodeFirestoreValue(v)])) } };
  }
  return { stringValue: String(value) };
}

function decodeFirestoreValue(value: any): any {
  if (!value) return "";
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ("mapValue" in value) {
    return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decodeFirestoreValue(v)]));
  }
  return "";
}

async function firestoreFetch(pathname: string, init: RequestInit = {}) {
  if (!firebaseProjectId) throw new Error("FIREBASE_WEB_PROJECT_ID or VITE_FIREBASE_PROJECT_ID is required.");
  const token = await getGoogleAccessToken("https://www.googleapis.com/auth/datastore");
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${pathname}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok && response.status !== 404) throw new Error(await response.text());
  return response;
}

function firestoreDocToObject(doc: any) {
  const id = doc.name.split("/").pop();
  const data = Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, decodeFirestoreValue(v)]));
  return { ...data, id };
}

export async function getFirestoreDoc(collection: string, id: string): Promise<Record<string, any> | null> {
  const response = await firestoreFetch(`${collection}/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return firestoreDocToObject(data);
}

export async function listCollection(collection: string): Promise<Record<string, any>[]> {
  const response = await firestoreFetch(collection);
  if (response.status === 404) return [];
  const data = await response.json();
  return (data.documents || []).map(firestoreDocToObject);
}

export async function saveDocument(collection: string, id: string, data: Record<string, any>) {
  const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encodeFirestoreValue(v)]));
  await firestoreFetch(`${collection}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
  return { ...data, id };
}

export async function deleteDocument(collection: string, id: string) {
  await firestoreFetch(`${collection}/${id}`, { method: "DELETE" });
}