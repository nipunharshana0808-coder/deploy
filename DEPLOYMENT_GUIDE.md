# Complete Deployment Guide

## Welcome! 🚀

This guide provides step-by-step instructions to deploy **Oncology Patient Data Manager** to:
- ✅ **GitHub** - Version control and collaboration
- ✅ **Vercel** - Serverless hosting (React frontend + Express backend)
- ✅ **Firebase** - Authentication and Firestore database
- ✅ **Google Drive** - Patient file storage

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ GitHub account
- ✅ Google account (for Firebase, Drive, OAuth)
- ✅ Vercel account (free tier works)

## Quickstart (5 Steps)

### 1. GitHub Setup (15 minutes)
→ Follow: [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)

**What you'll do:**
- Create GitHub repository
- Configure `.gitignore`
- Push code to GitHub

**Outcome**: Your code is version controlled and ready to deploy

### 2. Firebase Setup (20 minutes)
→ Follow: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

**What you'll do:**
- Create Firebase project
- Enable Firestore database
- Create authentication
- Generate service account credentials

**Outcome**: Secure user authentication and patient data storage

### 3. Google Drive Setup (15 minutes)
→ Follow: [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)

**What you'll do:**
- Create Google Cloud project
- Enable Drive API
- Generate OAuth credentials
- Get refresh token

**Outcome**: Secure file storage with patient folder management

### 4. Environment Variables Setup (5 minutes)

Copy template and fill in credentials:

```bash
cp .env.example .env
```

Edit `.env` with values from steps 2-3:

```env
# Firebase (from Firebase Setup)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_JSON=...

# Google Drive (from Google Drive Setup)
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_REFRESH_TOKEN=...

# Gemini (optional for AI extraction)
GEMINI_API_KEY_PRIMARY=...
```

**⚠️ IMPORTANT**: Never commit `.env` to GitHub!

### 5. Vercel Deployment (10 minutes)
→ Follow: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

**What you'll do:**
- Connect GitHub to Vercel
- Add environment variables to Vercel
- Deploy automatically

**Outcome**: Your app is live at `yourname.vercel.app`

---

## Detailed Setup Guides

Each service has its own dedicated guide:

| Service | Duration | Guide |
|---------|----------|-------|
| **GitHub** | 15 min | [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md) |
| **Firebase** | 20 min | [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) |
| **Google Drive** | 15 min | [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) |
| **Vercel** | 10 min | [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
│  React 19 Frontend (TypeScript + Tailwind CSS)              │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Vercel (Serverless)                        │
│                                                              │
│  ┌────────────────┐         ┌──────────────────────────┐   │
│  │  Vite SPA      │ API     │  Express.js Backend      │   │
│  │  (Frontend)    ├────────►│  (Node.js)               │   │
│  └────────────────┘         └──────────────────────────┘   │
│                                      │                       │
└──────────────────┬───────────────────┼───────────────────────┘
                   │                   │
                   ▼                   ▼
        ┌──────────────────┐  ┌────────────────────┐
        │   Firebase       │  │  Google Drive API  │
        │  - Auth          │  │  - File Storage    │
        │  - Firestore     │  │  - Folder Mgmt     │
        │    (Database)    │  │                    │
        └──────────────────┘  └────────────────────┘
```

## Workflow

### For Development
```bash
# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/oncology-patient-data-manager.git
cd oncology-patient-data-manager

# 2. Install dependencies
npm install

# 3. Set up .env with local credentials
cp .env.example .env
# Edit .env with your values

# 4. Start dev server
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### For Production (Vercel)
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Vercel auto-deploys and runs:
npm run build      # Build frontend + backend
npm run start      # Start server

# 3. Live at: https://yourapp.vercel.app
```

## Key Files

```
.
├── src/                          # React Frontend
│   ├── components/              # UI Components
│   ├── lib/                     # Utilities (Firebase, Drive, Auth)
│   ├── utils/                   # Helpers
│   └── App.tsx                  # Main app
├── server.ts                    # Express API Server
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript Config
├── vite.config.ts              # Vite Build Config
├── vercel.json                  # Vercel Settings
├── tailwind.config.js           # Tailwind CSS
├── .env.example                 # Env Template
├── GITHUB_DEPLOYMENT_GUIDE.md   # GitHub Setup
├── FIREBASE_SETUP.md            # Firebase Setup
├── GOOGLE_DRIVE_SETUP.md        # Google Drive Setup
└── VERCEL_DEPLOYMENT_GUIDE.md   # Vercel Setup
```

## Environment Variables Checklist

### Required for Backend API

```
✅ FIREBASE_SERVICE_ACCOUNT_JSON
✅ FIREBASE_WEB_PROJECT_ID
✅ DRIVE_FOLDER_ID
✅ GOOGLE_DRIVE_CLIENT_ID
✅ GOOGLE_DRIVE_CLIENT_SECRET
✅ GOOGLE_DRIVE_REFRESH_TOKEN
```

### Required for Frontend (Browser)

```
✅ VITE_FIREBASE_API_KEY
✅ VITE_FIREBASE_AUTH_DOMAIN
✅ VITE_FIREBASE_PROJECT_ID
✅ VITE_FIREBASE_STORAGE_BUCKET
✅ VITE_FIREBASE_MESSAGING_SENDER_ID
✅ VITE_FIREBASE_APP_ID
✅ VITE_DRIVE_ROOT_FOLDER_ID
```

### Optional for AI Extraction

```
⭕ GEMINI_API_KEY_PRIMARY
⭕ GEMINI_MODEL_PRIMARY (default: gemini-2.5-flash)
⭕ GEMINI_API_KEY_SECONDARY
⭕ GEMINI_MODEL_SECONDARY
```

## Troubleshooting

### "Build failed: Command not found"
**Solution**: 
- Ensure Node.js 18+ installed: `node --version`
- Vercel includes Node.js automatically

### "Firebase authentication error in production"
**Solution**: 
1. Firebase Console → Authentication → Settings
2. Add authorized domains: `*.vercel.app` and your custom domain
3. Wait 10 minutes

### "Google Drive API not working"
**Solution**:
1. Check refresh token hasn't expired (6 months of inactivity)
2. Verify `GOOGLE_DRIVE_FOLDER_ID` is correct
3. Check service account has access to the root folder

### "Firestore permission denied"
**Solution**:
1. Check Firestore Rules (see FIREBASE_SETUP.md)
2. Ensure `request.auth != null` for authenticated users
3. Verify user is logged in

## Support & Resources

### Documentation
- 📚 [Firebase Docs](https://firebase.google.com/docs)
- 🚗 [Vercel Docs](https://vercel.com/docs)
- 🚀 [Google Drive API](https://developers.google.com/drive)
- ⚛️ [React Docs](https://react.dev)

### Quick Links
- 🔗 [Firebase Console](https://console.firebase.google.com)
- 🔗 [Vercel Dashboard](https://vercel.com/dashboard)
- 🔗 [Google Cloud Console](https://console.cloud.google.com)
- 🔗 [Google Drive](https://drive.google.com)

### Security Checklist

Before going live:

- [ ] All API keys are in environment variables (not committed)
- [ ] Firebase security rules are configured (Firestore, Auth)
- [ ] Google Drive OAuth scope is `https://www.googleapis.com/auth/drive`
- [ ] Authorized domains include all your deployed URLs
- [ ] SSL/HTTPS enabled (Vercel does this automatically)
- [ ] Backup strategy configured (Firebase backup enabled)
- [ ] Monitoring set up (Vercel analytics, Firebase usage)

## Next Steps

1. ✅ Start with [GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)
2. ✅ Then [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
3. ✅ Then [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)
4. ✅ Finally [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

## Estimated Total Time: ~90 minutes

| Step | Time |
|------|------|
| GitHub | 15 min |
| Firebase | 20 min |
| Google Drive | 15 min |
| Environment Setup | 5 min |
| Vercel | 10 min |
| Testing | 15 min |
| **Total** | **~90 min** |

---

## Questions?

Check the detailed guide for each service. They have comprehensive troubleshooting sections!

**Ready to launch?** → [Start with GitHub](./GITHUB_DEPLOYMENT_GUIDE.md)
