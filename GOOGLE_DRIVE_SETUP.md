# Google Drive Integration Setup Guide

## Overview
This project stores patient files and folders in Google Drive using:
- **Google Drive API** for file uploads/downloads
- **OAuth 2.0** authentication for secure access
- **Firestore** to track file metadata

## Step 1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a Project** → **NEW PROJECT**
3. **Project name**: `oncology-patient-data-manager`
4. Click **Create**
5. Wait for project initialization

## Step 2: Enable Google Drive API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search: `Google Drive API`
3. Click on **Google Drive API**
4. Click **ENABLE**
5. Wait for API to be enabled

## Step 3: Create OAuth Credentials

### Option A: For Development (Recommended)

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. You'll be prompted to create a consent screen first:

#### Create OAuth Consent Screen
1. Click **Configure Consent Screen**
2. **User Type**: Choose **External** (for testing)
3. Click **Create**

**Fill in required fields:**
- **App name**: `Oncology Patient Data Manager`
- **User support email**: Your email
- **App logo**: (optional)
- **Application homepage link**: `http://localhost:5173`
- **Application privacy policy link**: (optional)
- **Developer contact**: Your email

Click **SAVE AND CONTINUE**

**Scopes:**
- Click **ADD OR REMOVE SCOPES**
- Search for: `drive` 
- Select **Google Drive API** (see.../auth/drive)
- Click **UPDATE**
- Click **SAVE AND CONTINUE**

**Test Users:**
- Click **ADD USERS**
- Add your Google account email
- Click **SAVE AND CONTINUE**

Click **BACK TO DASHBOARD**

#### Create OAuth 2.0 Credentials
1. Go back to **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. **Application type**: **Web application**
4. **Name**: `Oncology Patient Manager - Web`

**Authorized JavaScript origins:**
```
http://localhost:5173
http://localhost:3000
https://yourapp.vercel.app
https://yourdomain.com
```

**Authorized redirect URIs:**
```
http://localhost:5173/auth/callback
http://localhost:3000/auth/callback
https://yourapp.vercel.app/auth/callback
https://yourdomain.com/auth/callback
```

5. Click **CREATE**
6. Copy **Client ID** and **Client Secret**

## Step 4: Get Refresh Token

1. Go to [Google OAuth Playground](https://developers.google.com/oauthplayground)
2. Click Settings (gear icon) → **Use your own OAuth credentials**
3. Enter:
   - **OAuth Client ID**: (from Step 3)
   - **OAuth Client Secret**: (from Step 3)
4. Click **Close**

5. In left panel, search for **Google Drive API v3**
6. Select `/auth/drive` scope
7. Click **Authorize APIs**
8. Select your account
9. Grant permissions
10. Click **Exchange authorization code for tokens**
11. Copy the **Refresh Token**

⚠️ **Keep this token SECURE!** It grants access to your Google Drive.

## Step 5: Create Drive Root Folder

1. Go to [drive.google.com](https://drive.google.com)
2. Click **+ New** → **Folder**
3. Name it: `Oncology_Patients_Vault`
4. Right-click → **Share**
5. Click **Link** → **Restricted** (only you)
6. Right-click folder → **Copy link**

Extract folder ID from URL:
```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
```

## Step 6: Set Environment Variables

Update `.env` with your Google Drive credentials:

```env
# Google Drive Root Folder ID
DRIVE_FOLDER_ID=your_folder_id_here
VITE_DRIVE_ROOT_FOLDER_ID=your_folder_id_here

# Google OAuth Credentials
GOOGLE_DRIVE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token

# (Optional: For Google Service Account instead of OAuth)
# GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**For Vercel deployment**, add these as Environment Variables in Vercel dashboard.

## Step 7: Test File Upload

1. Run: `npm run dev`
2. Login with your Google account
3. Go to **Add Patient**
4. Add a test patient
5. In **AI Extraction Point**, drag/drop or select a file
6. Check [drive.google.com](https://drive.google.com) → Patient's folder created with uploaded file

## File Structure on Google Drive

After first upload, your Drive will have:

```
Oncology_Patients_Vault/
├── Doe_John_J/           (patient folder)
│   ├── lab_report.pdf
│   ├── imaging.jpg
│   └── biopsy_results.xlsx
├── Smith_Jane_S/
│   └── treatment_plan.pdf
└── ...
```

Patient folder names follow pattern: `LastName_FirstName_Initials`

## Troubleshooting

### "Access Denied" or "Invalid Grant"
**Cause**: Refresh token expired or invalid

**Fix**:
1. Regenerate refresh token (Step 4)
2. Update `GOOGLE_DRIVE_REFRESH_TOKEN` in environment
3. Test with new token

### "The user has not granted the app access to Drive"
**Cause**: OAuth scope not requested

**Fix**:
1. Re-create OAuth credentials with `/auth/drive` scope
2. Update `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`
3. Request new refresh token

### File Uploads Slow
**Cause**: Large files or network latency

**Solutions**:
- Compress files before upload
- Split large files into chunks
- Use Google Drive Desktop app for sync

### Folder Already Exists Error
**Cause**: Patient already has a Drive folder

**Fix**: This is normal - system reuses existing folders for the same patient

### Missing Files in Dashboard
**Cause**: Firestore metadata not synced with actual Drive files

**Fix**:
1. Check Firestore `files` collection
2. Verify `driveFileId` and `driveFolderId` are set
3. Check Google Drive folder exists

## Advanced: Service Account (Optional)

For server-side uploads without user interaction:

1. In Google Cloud Console → **Service Accounts**
2. Click **CREATE SERVICE ACCOUNT**
3. **Service account name**: `oncology-api`
4. Click **CREATE AND CONTINUE**
5. **Grant role**: **Editor** (for Drive access)
6. Click **CONTINUE**
7. Click **CREATE KEY** → **JSON**
8. Download JSON file
9. Share Drive folder with service account email:
   - Copy `client_email` from JSON
   - Go to Drive folder → **Share**
   - Add service account email
10. Set environment variable:

```env
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## Quota & Limits

Google Drive API limits:
- **Free tier**: 1,000,000 queries/day
- **File upload**: 5TB/file maximum
- **Rate limit**: 1,000 requests/second (per user)

Monitor usage:
1. Google Cloud Console → **APIs & Services** → **Credentials**
2. Click **Google Drive API**
3. Check **Usage** tab

## Billing

Free tier covers most development/small production use. Enable billing for:
- Production scaling
- 24/7 support
- Custom quotas

1. Google Cloud Console → **Billing**
2. Click **Link Billing Account**
3. Create or select billing account

## Data Privacy & Security

1. **Encryption**: All files encrypted in transit (HTTPS) and at rest (Google Drive)
2. **Access Control**: Only authenticated users can upload/download
3. **Audit Logs**: Monitor access via [drive.google.com/drive/my-drive](https://drive.google.com/drive/my-drive)
4. **Backup**: Google Drive keeps 30-day version history

## Next Steps

1. **Firebase Setup** → See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. **Vercel Deployment** → See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
3. **GitHub Setup** → See [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)

---

**For help**: Check Google Drive API docs at [developers.google.com/drive](https://developers.google.com/drive)
