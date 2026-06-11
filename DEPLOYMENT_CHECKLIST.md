# Deployment Checklist

## Pre-Deployment (Before You Start)

- [ ] Node.js 18+ installed (`node --version`)
- [ ] GitHub account created
- [ ] Google account ready (for Firebase & Drive)
- [ ] ~90 minutes of time available
- [ ] Administrator access to any existing cloud accounts

---

## Phase 1: GitHub Setup (15 min)

**Guide**: [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)

- [ ] GitHub repository created
- [ ] Repository cloned locally
- [ ] `.gitignore` configured
- [ ] Initial commit pushed to main branch
- [ ] Repository link noted: `https://github.com/YOUR_USERNAME/oncology-patient-data-manager`

---

## Phase 2: Firebase Setup (20 min)

**Guide**: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Firebase Project Creation
- [ ] Firebase project created: `oncology-patient-data-manager`
- [ ] Web app registered in Firebase
- [ ] Firebase config copied (6 values)

### Authentication
- [ ] Google Sign-In enabled
- [ ] Authorized domains configured:
  - [ ] `localhost`
  - [ ] `*.vercel.app`
  - [ ] Custom domain (if applicable)

### Firestore Database
- [ ] Firestore database created (production mode)
- [ ] Security rules published (see guide)
- [ ] Collections created (optional):
  - [ ] `users`
  - [ ] `patients`
  - [ ] `files`

### Service Account
- [ ] Service account created
- [ ] Private key JSON downloaded (saved safely)
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` extracted and ready

### Environment Variables Collected
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON)
- [ ] `FIREBASE_WEB_PROJECT_ID`

---

## Phase 3: Google Drive Setup (15 min)

**Guide**: [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)

### Google Cloud Project
- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] OAuth 2.0 credentials created (Web application)
- [ ] OAuth consent screen configured

### Authorization Setup
- [ ] Authorized JavaScript origins added:
  - [ ] `http://localhost:5173`
  - [ ] `http://localhost:3000`
  - [ ] `https://yourapp.vercel.app`
  - [ ] Custom domain (if applicable)

- [ ] Authorized redirect URIs added:
  - [ ] `http://localhost:5173/auth/callback`
  - [ ] `http://localhost:3000/auth/callback`
  - [ ] `https://yourapp.vercel.app/auth/callback`

### Drive Setup
- [ ] Google Drive root folder created: `Oncology_Patients_Vault`
- [ ] Refresh token generated (via OAuth Playground)
- [ ] Folder ID extracted from Drive URL

### Environment Variables Collected
- [ ] `GOOGLE_DRIVE_CLIENT_ID`
- [ ] `GOOGLE_DRIVE_CLIENT_SECRET`
- [ ] `GOOGLE_DRIVE_REFRESH_TOKEN`
- [ ] `DRIVE_FOLDER_ID`
- [ ] `VITE_DRIVE_ROOT_FOLDER_ID`

---

## Phase 4: Local Environment Setup (5 min)

- [ ] `.env` file created: `cp .env.example .env`
- [ ] All 13+ environment variables added to `.env`:
  - [ ] 6 Firebase browser variables (`VITE_FIREBASE_*`)
  - [ ] 2 Firebase backend variables
  - [ ] 5 Google Drive variables
  - [ ] Optional: Gemini API keys

- [ ] `.env` file is in `.gitignore` (never committed)
- [ ] Local dev tested: `npm run dev`
  - [ ] Frontend loads at http://localhost:5173
  - [ ] Backend server running at http://localhost:3000
  - [ ] Login with Google works
  - [ ] Can see profile name after login
  - [ ] File upload creates Drive folder

---

## Phase 5: Vercel Deployment (10 min)

**Guide**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

### Vercel Account
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project imported: `oncology-patient-data-manager`

### Environment Variables in Vercel
- [ ] All 13+ variables added to Vercel project settings:
  - [ ] Development environment (optional)
  - [ ] Preview environment (optional)
  - [ ] Production environment (required)

- [ ] Firebase browser variables added:
  - [ ] `VITE_FIREBASE_API_KEY`
  - [ ] `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] `VITE_FIREBASE_PROJECT_ID`
  - [ ] `VITE_FIREBASE_STORAGE_BUCKET`
  - [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `VITE_FIREBASE_APP_ID`

- [ ] Firebase backend variables added:
  - [ ] `FIREBASE_SERVICE_ACCOUNT_JSON`
  - [ ] `FIREBASE_WEB_PROJECT_ID`

- [ ] Google Drive variables added:
  - [ ] `GOOGLE_DRIVE_CLIENT_ID`
  - [ ] `GOOGLE_DRIVE_CLIENT_SECRET`
  - [ ] `GOOGLE_DRIVE_REFRESH_TOKEN`
  - [ ] `DRIVE_FOLDER_ID`
  - [ ] `VITE_DRIVE_ROOT_FOLDER_ID`

- [ ] Optional Gemini variables added (if using AI extraction)

### Firebase Configuration
- [ ] Authorized domains updated:
  - [ ] Added: `your-vercel-domain.vercel.app`
  - [ ] Added: Custom domain (if applicable)

### Deployment
- [ ] Initial deployment triggered (automatic on push to main)
- [ ] Build completed successfully
- [ ] No build errors in Vercel logs
- [ ] Deployment live at `https://your-vercel-domain.vercel.app`

---

## Phase 6: Post-Deployment Testing (15 min)

### Access & Login
- [ ] Can access app at Vercel URL
- [ ] Google OAuth redirects correctly
- [ ] Can log in with Google account
- [ ] User profile displays with correct name

### Core Features
- [ ] Can add new patient record
- [ ] Can view patient list
- [ ] Can search/filter patients
- [ ] Can upload file to patient
- [ ] File creates folder in Google Drive
- [ ] File appears in patient's Drive folder

### Security
- [ ] Cannot access app without login
- [ ] Cannot modify other users' data (if multi-user)
- [ ] Cannot access API directly without authentication
- [ ] API keys not visible in browser (check Network tab)

### Performance
- [ ] App loads in under 3 seconds
- [ ] File uploads complete within timeout
- [ ] No browser console errors
- [ ] No Vercel build warnings

---

## Phase 7: Optional Enhancements

### Custom Domain (Optional)
- [ ] Domain purchased
- [ ] Domain connected to Vercel
- [ ] HTTPS certificate auto-installed
- [ ] Domain added to Firebase authorized domains
- [ ] Google Drive OAuth updated with custom domain

### Monitoring & Analytics
- [ ] Vercel Analytics enabled
- [ ] Firebase usage dashboard reviewed
- [ ] Google Drive API quota checked
- [ ] Backup strategy configured (daily backups)

### GitHub Actions (Optional)
- [ ] `.github/workflows/test.yml` created
- [ ] Automatic linting on push configured
- [ ] Automatic build validation enabled

---

## Production Readiness Checklist

Before marking as "Production Ready":

- [ ] All tests pass: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No hardcoded secrets in code
- [ ] Error messages don't expose system details
- [ ] Rate limiting configured (if needed)
- [ ] CORS properly configured
- [ ] HTTPS enforced on all endpoints
- [ ] User data encrypted in transit & at rest
- [ ] Backup/disaster recovery plan documented
- [ ] Monitoring & alerting configured
- [ ] Team access provisioned (if multi-user)
- [ ] Data retention policy defined
- [ ] Privacy policy available
- [ ] Terms of service available

---

## Useful Links to Save

**During Setup:**
- [ ] GitHub Repo: `https://github.com/YOUR_USERNAME/oncology-patient-data-manager`
- [ ] Vercel Dashboard: `https://vercel.com/dashboard`
- [ ] Firebase Console: `https://console.firebase.google.com`
- [ ] Google Cloud Console: `https://console.cloud.google.com`
- [ ] Google Drive Root: `https://drive.google.com/drive/folders/YOUR_FOLDER_ID`

**Live App:**
- [ ] Production URL: `https://your-vercel-domain.vercel.app`
- [ ] Custom Domain (if applicable): `https://yourdomain.com`

---

## Troubleshooting Quick Reference

| Problem | Solution | Guide |
|---------|----------|-------|
| Build fails | Check Node version, verify env vars | [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) |
| Firebase auth fails | Add domain to authorized list | [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) |
| Drive upload fails | Check refresh token, verify folder ID | [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) |
| API 404 errors | Check endpoint paths in code | server.ts |
| Missing environment variables | Verify Vercel settings match .env | [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) |

---

## Final Steps

1. ✅ Complete all checkboxes above
2. ✅ Test production deployment thoroughly
3. ✅ Document any custom configurations
4. ✅ Create a runbook for team members
5. ✅ Schedule regular backups
6. ✅ Set up monitoring alerts
7. ✅ Plan for maintenance windows

---

**Status**: Ready to Deploy! 🚀

**Date Started**: ___________
**Date Completed**: ___________
**Deployed By**: ___________
