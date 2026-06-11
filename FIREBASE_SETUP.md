# Firebase & Firestore Setup Guide

## Overview
This project uses:
- **Firebase Authentication** for user login
- **Firestore** for patient records, files metadata, and user profiles
- **Firebase Service Account** for backend API access

## Step 1: Create Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com)
2. Click **Get Started** → **Create a project**
3. **Project Name**: `oncology-patient-data-manager`
4. Accept terms, click **Continue**
5. **Enable Google Analytics**: ✓ (optional)
6. Click **Create project**

Wait for project to initialize (~2-3 minutes).

## Step 2: Create Web App

1. Click **Web** icon (</> symbol)
2. **App nickname**: `web` (or your choice)
3. Click **Register app**
4. Copy your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

5. Click **Copy** (or note these values)

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started** → **Sign-in method**
3. Enable **Google** provider:
   - Click **Google**
   - **Status**: ON
   - **Project support email**: ✓ (auto-filled)
   - Click **Save**
4. Add authorized domains:
   - Go to **Settings** → **Authorized domains**
   - Add: `localhost`
   - Add: `yourapp.vercel.app` (if deployed)
   - Add: `yourdomain.com` (if using custom domain)

## Step 4: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. **Start in production mode** (we'll set security rules)
4. **Location**: Select closest to your users
5. Click **Create**

## Step 5: Set Firestore Security Rules

In Firestore Console, go to **Rules** tab and replace with:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - only user can read their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId && 
                      (request.resource.data.keys().hasAll(['name', 'role']));
    }

    // Patients collection - authenticated users can read/write
    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }

    // Files collection - authenticated users can read/write
    match /files/{fileId} {
      allow read, write: if request.auth != null;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

## Step 6: Create Service Account

1. Go to **Project Settings** (gear icon top-left)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download JSON file (keep it SECURE!)
5. Copy contents and set as `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env`

**⚠️ SECURITY WARNING**: Never commit this JSON to GitHub. Use Vercel Environment Variables.

## Step 7: Initialize Firestore Collections

Create the following collections (optional - backend auto-creates):

### Users Collection
Collection: `users`
Documents: Auto-created per user UID

```json
{
  "name": "Dr. John Smith",
  "role": "admin",
  "email": "john@clinic.com"
}
```

### Patients Collection
Collection: `patients`

```json
{
  "id": "pat_abc123",
  "auto_id": "PT-001",
  "first_name": "John",
  "last_name": "Doe",
  "oncology": "Breast",
  "status": "active",
  "driveFolderId": "folder_id_from_google_drive",
  "isDeleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Files Collection
Collection: `files`

```json
{
  "id": "file_xyz789",
  "patientId": "pat_abc123",
  "name": "Lab Report.pdf",
  "mimeType": "application/pdf",
  "driveFileId": "drive_file_id",
  "driveFolderId": "drive_folder_id",
  "extracted": true,
  "uploadDate": "2024-01-15",
  "webViewLink": "https://drive.google.com/file/d/..."
}
```

## Step 8: Add Environment Variables

Update your `.env` file:

```env
# Firebase Client Config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...

# Firebase Admin (Backend)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
FIREBASE_WEB_PROJECT_ID=your-project-id
```

## Step 9: Test Authentication

1. Run: `npm run dev`
2. Open http://localhost:5173
3. Click **Login** → **Sign in with Google**
4. You should be redirected to Google OAuth
5. After signing in, you'll see your profile

## Troubleshooting

### "Missing or Insufficient Permissions"
**Cause**: User doesn't have Firestore read/write access

**Fix**:
1. Check Firestore Rules (Step 5)
2. Ensure `request.auth != null` allows authenticated users
3. Verify user is logged in

### Firebase Config Not Found
**Cause**: Environment variables not set

**Fix**:
1. Copy values from Firebase Console → Project Settings
2. Add to `.env` exactly as shown in Step 8
3. Restart dev server

### "The caller does not have permission to access this resource"
**Cause**: Service account permissions or quota

**Fix**:
1. In Firebase Console, go to **IAM & Admin**
2. Find service account (ending in `@iam.gserviceaccount.com`)
3. Give role: **Editor** (for development)
4. Wait 30 seconds for changes to propagate

### Google OAuth Redirect URI Error
**Cause**: Domain not in authorized domains

**Fix**:
1. Go to Authentication → Settings → Authorized domains
2. Add your domain or `localhost`
3. Wait 10 minutes for changes

## Firestore Backup (Important!)

1. Go to **Firestore Database** → **Backups**
2. Click **Create backup**
3. Name it (e.g., `daily-backup`)
4. Click **Create**

Enable automatic daily backups:
1. **Backups** tab → **Create scheduled backup**
2. **Retention**: 7-30 days
3. **Schedule**: Daily
4. **Location**: Same as database
5. Click **Create**

## Accessing Firestore Data in Console

1. Go to **Firestore Database**
2. Click **Data** tab
3. Browse collections and documents
4. Click any document to view/edit contents
5. ⚠️ Edits here bypass rules - use carefully

## Monitoring & Analytics

1. Go to **Usage** tab to see:
   - Read/Write operations
   - Data storage size
   - Network bandwidth

2. Set up quotas if needed (to avoid billing surprises)

## Next Steps

1. **Google Drive Integration** → See [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)
2. **Vercel Deployment** → See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
3. **GitHub Setup** → See [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)

---

**For help**: Check Firebase docs at [firebase.google.com/docs](https://firebase.google.com/docs)
