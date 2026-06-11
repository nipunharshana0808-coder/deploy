# Oncology Patient Data Manager - Production Ready

> **Professional Oncology Patient Data Storage & AI Extraction System**

## 🎯 Overview

A **secure, scalable, cloud-based system** for managing oncology patient records with:

✅ **Secure Authentication** - Firebase Google OAuth  
✅ **Patient Management** - Create, search, edit, delete patient profiles  
✅ **Document Storage** - Upload files to Google Drive with folder management  
✅ **AI Extraction** - Automatic data extraction from clinical documents using Gemini  
✅ **Data Persistence** - Firestore database for patient records and file metadata  
✅ **Role-Based Access** - Admin and user roles for data governance  
✅ **Privacy Compliant** - PDPA compliant architecture  
✅ **Fully Responsive** - Mobile, tablet, desktop support  

---

## 🚀 Quick Deploy (90 minutes)

### Option 1: Deployment Guides (Recommended for First-Time Setup)

Follow our step-by-step guides:

1. **[GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)** - Version control & collaboration (15 min)
2. **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Authentication & database (20 min)
3. **[GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)** - File storage & API (15 min)
4. **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** - Live deployment (10 min)
5. **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Verify everything works (15 min)

### Option 2: Automated Deployment (Vercel Button)

Coming soon - One-click Vercel deployment template

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Firebase & Google credentials to .env

# Start dev server
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000

# Run type checking
npm run lint

# Build for production
npm run build
```

---

## 📋 Architecture

### Tech Stack

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS for styling
- Vite for fast builds
- Motion for animations
- Lucide for icons

**Backend:**
- Node.js + Express.js
- Serverless functions (Vercel)
- TypeScript for type safety

**Database & Services:**
- Firebase Authentication (Google OAuth)
- Firestore (NoSQL database)
- Google Drive API (file storage)
- Google Gemini API (AI extraction)

**Deployment:**
- Vercel (frontend + backend)
- Firebase Hosting (optional)
- GitHub (version control)

### System Diagram

```
┌─────────────────┐
│  User Browser   │ 
│  (React App)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌──────────────────────┐
│  Vercel (Deploy)     │
│ ┌──────────────────┐ │
│ │ Frontend (SPA)   │ │
│ └────────┬─────────┘ │
│          │ API       │
│ ┌────────▼─────────┐ │
│ │ Backend (Express)│ │
│ └────────┬─────────┘ │
└──────────┼────────────┘
           │
    ┌──────┴──────────────┐
    │                     │
    ▼                     ▼
┌─────────────┐    ┌──────────────┐
│ Firebase    │    │ Google Drive │
│ - Auth      │    │ - Files      │
│ - Firestore │    │ - Folders    │
└─────────────┘    └──────────────┘
```

---

## 📦 Project Structure

```
.
├── src/                                 # React Frontend (TypeScript)
│   ├── components/                     # Reusable UI components
│   │   ├── LoginScreen.tsx            # Google OAuth login
│   │   ├── HomeView.tsx               # Dashboard & recent patients
│   │   ├── AddPatientView.tsx          # Patient form + AI extraction
│   │   ├── SearchRecordsView.tsx       # Search & filter patients
│   │   ├── PatientDetailsModal.tsx     # View/edit patient details
│   │   ├── TrashView.tsx               # Deleted records management
│   │   ├── SettingsView.tsx            # App settings & database wipe
│   │   └── ...                         # Other UI components
│   ├── lib/                            # Core utilities
│   │   ├── firebase.ts                # Firebase initialization
│   │   ├── firebaseConfig.ts          # Firebase config from env
│   │   ├── auth.ts                    # Authentication helpers
│   │   ├── drive.ts                   # Google Drive client
│   │   └── useInputValidation.ts      # Form validation
│   ├── utils/                         # Helper functions
│   │   └── normalizeCase.ts           # Text normalization
│   ├── App.tsx                        # Main app router
│   ├── main.tsx                       # Entry point
│   └── types.ts                       # TypeScript interfaces
├── server.ts                          # Express.js backend API
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript configuration
├── vite.config.ts                     # Vite build configuration
├── tailwind.config.js                 # Tailwind CSS theming
├── vercel.json                        # Vercel deployment config
├── .env.example                       # Environment variables template
├── README.md                          # This file
├── DEPLOYMENT_GUIDE.md               # Comprehensive setup guide
├── DEPLOYMENT_CHECKLIST.md           # Verification checklist
├── GITHUB_DEPLOYMENT_GUIDE.md        # GitHub setup
├── FIREBASE_SETUP.md                 # Firebase & Firestore setup
├── GOOGLE_DRIVE_SETUP.md             # Google Drive & OAuth setup
└── VERCEL_DEPLOYMENT_GUIDE.md        # Vercel deployment

```

---

## 🔑 Environment Variables

### Required

```env
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Firebase Backend Access
FIREBASE_SERVICE_ACCOUNT_JSON=
FIREBASE_WEB_PROJECT_ID=

# Google Drive Configuration
DRIVE_FOLDER_ID=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
VITE_DRIVE_ROOT_FOLDER_ID=
```

### Optional (for AI Extraction)

```env
GEMINI_API_KEY_PRIMARY=
GEMINI_MODEL_PRIMARY=gemini-2.5-flash
GEMINI_API_KEY_SECONDARY=
GEMINI_MODEL_SECONDARY=gemini-2.5-flash
```

See [.env.example](./.env.example) for full template.

---

## 🛠 Build & Deployment

### Development
```bash
npm run dev    # Start dev server with hot reload
```

### Production Build
```bash
npm run build  # Build frontend + backend for production
npm run start  # Run production build locally
```

### Type Checking
```bash
npm run lint   # Run TypeScript compiler
```

### Deploy to Vercel
```bash
# Push to GitHub
git push origin main

# Vercel automatically:
# 1. Pulls latest code
# 2. Installs dependencies
# 3. Runs build
# 4. Deploys to edge network
# 5. Updates production URL
```

---

## 📚 Key Features

### User Authentication
- ✅ Google OAuth 2.0 login
- ✅ Automatic user profile creation
- ✅ Admin role inference from email
- ✅ Secure session management

### Patient Management
- ✅ Create new patient records
- ✅ Search by name, ID, hospital
- ✅ Filter by oncology type, status
- ✅ Edit patient information
- ✅ View complete medical history
- ✅ Soft delete (move to trash)
- ✅ Restore from trash
- ✅ Permanent delete with asset cleanup

### Document Management
- ✅ Drag-and-drop file uploads
- ✅ Automatic patient folder creation on Drive
- ✅ File size & type validation
- ✅ Download files from Drive
- ✅ View file metadata
- ✅ Track extraction status

### AI-Powered Extraction
- ✅ Automatic clinical data extraction from PDFs/images
- ✅ Extracts: demographics, diagnosis, labs, imaging, IHC, biopsy data
- ✅ Auto-populate form fields from extracted data
- ✅ Visual highlighting of AI-extracted fields
- ✅ Fallback to manual upload if extraction fails
- ✅ Gemini API with primary/secondary key fallback

### Data Visualization
- ✅ Patient dashboard with key metrics
- ✅ Blood test trends
- ✅ Tumor marker monitoring
- ✅ Treatment timeline
- ✅ Imaging findings summary

### Security & Privacy
- ✅ Role-based access control (admin/user)
- ✅ Firestore security rules enforce permissions
- ✅ All data encrypted in transit (HTTPS)
- ✅ All files encrypted in Google Drive
- ✅ No API keys exposed to browser
- ✅ Service account for backend API access

### Database Management
- ✅ Full database wipe (with Drive cleanup)
- ✅ Trash management for soft deletes
- ✅ Permanent purge with asset deletion
- ✅ Automatic backup to Google Drive
- ✅ 30-day version history

---

## 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Tablet optimization
- ✅ Desktop full experience
- ✅ Dark mode support
- ✅ Accessibility features

---

## 🔐 Security Features

### Authentication
- OAuth 2.0 (no password storage)
- Firebase session tokens
- Automatic session refresh

### Data Protection
- Firestore security rules (field-level)
- Google Drive encryption
- HTTPS everywhere
- CORS protection

### Access Control
- Admin role for database management
- User role for patient data
- Field-level security rules
- API key isolation

### Compliance
- PDPA compliant architecture
- Data minimization principles
- User consent tracking
- Audit logging ready

---

## 🧪 Testing

### Run Type Checking
```bash
npm run lint
```

### Manual Testing Checklist
See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete testing guide

---

## 🚨 Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Firebase Auth Error
1. Check authorized domains in Firebase Console
2. Add current domain to authorized list
3. Wait 10 minutes for changes to propagate

### Google Drive Upload Fails
1. Verify refresh token hasn't expired
2. Check folder ID is correct
3. Regenerate refresh token if needed

### TypeScript Errors
```bash
npm run lint  # Show all type errors
```

See individual setup guides for detailed troubleshooting.

---

## 📖 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete setup overview
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step verification
- **[GITHUB_DEPLOYMENT_GUIDE.md](./GITHUB_DEPLOYMENT_GUIDE.md)** - GitHub setup
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase & Firestore
- **[GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)** - Google Drive API
- **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** - Vercel deployment

---

## 🤝 Support

### Getting Help
1. Check relevant setup guide for your issue
2. Review troubleshooting section
3. Check service-specific documentation:
   - Firebase: https://firebase.google.com/docs
   - Vercel: https://vercel.com/docs
   - Google Drive: https://developers.google.com/drive

---

## 📄 License

This project is for educational purposes. See LICENSE file for details.

---

## ⚖️ Legal & Compliance

**IMPORTANT**: This application must comply with:
- ✅ HIPAA (if US-based)
- ✅ GDPR (if EU users)
- ✅ PDPA (if Sri Lanka)
- ✅ Local healthcare regulations
- ✅ Data protection laws in your jurisdiction

**Responsibility**: Users are solely responsible for:
- Obtaining patient consent
- Maintaining data privacy
- Complying with regulations
- Regular security audits
- Backup & disaster recovery

---

## 🎉 Ready to Deploy?

Start with: **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
