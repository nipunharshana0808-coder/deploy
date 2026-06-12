# Vercel Deployment Guide

## Overview
Deploy your Oncology Patient Data Manager to Vercel with serverless Express backend and React frontend.

## Prerequisites
- GitHub repository already set up (see GITHUB_DEPLOYMENT_GUIDE.md)
- Vercel account ([vercel.com](https://vercel.com))
- Environment variables ready (see Environment Variables section)

## Step 1: Create Vercel Account & Connect GitHub

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → Choose **GitHub**
3. Authorize Vercel to access your GitHub account
4. Click **Continue**

## Step 2: Import Your GitHub Repository

1. In Vercel dashboard, click **New Project**
2. Find `oncology-patient-data-manager` repository
3. Click **Import**
4. **Project Name**: `oncology-patient-data-manager` (or your choice)
5. **Framework Preset**: **Vite** (auto-detected)
6. Click **Deploy**

## Step 3: Configure Environment Variables

While deployment is in progress, set up environment variables:

1. Go to project **Settings** → **Environment Variables**
2. Add all variables from `.env.example`:

### Firebase Client Variables (REQUIRED)
```
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

### Firebase Admin Service Account (REQUIRED for backend)
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
FIREBASE_WEB_PROJECT_ID=<same-as-VITE_FIREBASE_PROJECT_ID>
```

### Google Drive Configuration (REQUIRED for file storage)
```
DRIVE_FOLDER_ID=<your-drive-root-folder-id>
GOOGLE_DRIVE_CLIENT_ID=<your-client-id>
GOOGLE_DRIVE_CLIENT_SECRET=<your-client-secret>
GOOGLE_DRIVE_REFRESH_TOKEN=<your-refresh-token>
VITE_DRIVE_ROOT_FOLDER_ID=<same-as-DRIVE_FOLDER_ID>
```

### Gemini API Keys (OPTIONAL for AI extraction)
```
GEMINI_API_KEY_PRIMARY=<your-gemini-key>
GEMINI_MODEL_PRIMARY=gemini-2.5-flash
GEMINI_API_KEY_SECONDARY=<backup-key-optional>
GEMINI_MODEL_SECONDARY=gemini-2.5-flash
```

## Step 4: Verify Configuration

After adding all environment variables:

1. Click **Save**
2. Deployment should complete
3. Click **Visit** to open your deployed app

## Step 5: Setup Automatic Deployments

By default, Vercel automatically deploys on every push to `main`.

**To modify:**
1. Go to **Settings** → **Git**
2. Under **Deploy on Push**, select your branch
3. Customize as needed

## Important Notes

### Development vs Production URLs
- **Development**: Created automatically for each push to non-main branches
- **Production**: Uses custom domain or `*.vercel.app` subdomain

### Custom Domain (Optional)
1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your custom domain
4. Follow DNS configuration instructions

### Environment Variables Best Practices
- ✅ Use **System Environment Variables** for deployment-only secrets
- ✅ Use **Preview Environment** for staging
- ❌ Never commit `.env` files to GitHub
- ❌ Never expose API keys in client-side code (use `VITE_` prefix for safe client vars)

## Troubleshooting

### Build Fails with "Command 'node' not found"
**Solution**: Vercel automatically includes Node.js. If error persists:
1. Check **Settings** → **Build & Development Settings**
2. Verify **Build Command**: `npm run build`
3. Verify **Output Directory**: `dist`

### Firebase Authentication Error in Production
**Ensure:**
1. Firebase project allows requests from `*.vercel.app`
2. In Firebase Console → Authentication → Settings:
   - Add authorized domains: `yourdomain.vercel.app`
   - Add custom domain if using one

### Google Drive API Fails
**Check:**
1. Refresh token is still valid (expires after 6 months of inactivity)
2. Regenerate if needed: See GOOGLE_DRIVE_SETUP.md
3. Client ID/Secret match your OAuth app

## Monitoring & Logs

1. Go to **Deployments** tab to see all versions
2. Click any deployment → **View Logs** for build output
3. For runtime errors, check **Analytics** → **Web Vitals**

## Rollback to Previous Version

If deployment breaks:
1. Click **Deployments**
2. Find the last working version
3. Click **•••** → **Promote to Production**

## CI/CD Pipeline

Vercel automatically:
1. Builds on every push to main/specified branch
2. Runs TypeScript linting
3. Bundles frontend (Vite) and backend (esbuild)
4. Deploys to edge network

## Budget & Pricing

Vercel's Free tier includes:
- Unlimited deployments
- Automatic HTTPS
- 100GB bandwidth/month
- Serverless functions
- No credit card required

## Next Steps

1. **Firebase Setup** → See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. **Google Drive Integration** → See [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)
3. **GitHub Setup** → See [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)

---

**For help**: Check Vercel docs at [vercel.com/docs](https://vercel.com/docs)
