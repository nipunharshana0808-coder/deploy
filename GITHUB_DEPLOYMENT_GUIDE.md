# GitHub Deployment Guide

## Overview
This project is a **React 19 + TypeScript** frontend with **Express.js** backend, using **Firebase/Firestore** and **Google Drive API**.

## Prerequisites
- Node.js 18+ installed
- GitHub account
- Firebase project (optional, for cloud setup)
- Google Drive API credentials (for file storage)

## Step 1: Initialize GitHub Repository

```bash
# Navigate to your project directory
cd oncology-patient-data-manager

# Initialize git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
dist/
.vite/

# Environment variables
.env
.env.local
.env.vercel.example
.env.clean
.env.ene.new
.ene.new

# Build outputs
*.js
*.cjs
*.map
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
EOF

# Stage and commit
git add .
git commit -m "Initial commit: Oncology Patient Data Manager"
```

## Step 2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. **Repository name**: `oncology-patient-data-manager`
3. **Description**: `Professional Oncology Patient Data Management & AI Extraction System`
4. **Visibility**: Public or Private (your choice)
5. **Skip** "Initialize this repository with" options
6. Click **Create repository**

## Step 3: Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/oncology-patient-data-manager.git

# Rename branch to main if needed
git branch -M main

# Push code
git push -u origin main
```

## Step 4: Add Collaborators (Optional)

1. Go to Repository Settings → Collaborators
2. Add team members and assign appropriate roles

## Important: Don't Commit Secrets

**Never commit the following to GitHub:**
- `.env` files with API keys
- Firebase service account JSON
- Google Drive credentials
- Any sensitive authentication tokens

Store these in:
- `.gitignore` (already set up)
- Vercel Environment Secrets (see VERCEL_SETUP.md)
- GitHub Secrets (if using GitHub Actions)

## GitHub Actions Setup (Optional CI/CD)

Create `.github/workflows/test.yml`:

```yaml
name: Lint & Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run build
```

## Local Development After Cloning

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/oncology-patient-data-manager.git
cd oncology-patient-data-manager

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your Firebase & Google Drive credentials to .env

# Start development server
npm run dev
```

The app will run on:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Project Structure

```
.
├── src/                          # React frontend
│   ├── components/              # UI components
│   ├── lib/                     # Firebase, auth, drive utilities
│   ├── utils/                   # Helper functions
│   ├── App.tsx                  # Main app
│   └── main.tsx                 # Entry point
├── server.ts                    # Express.js backend
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite build config
├── tailwind.config.js           # Tailwind CSS
├── vercel.json                  # Vercel deployment
└── README.md                    # Project documentation
```

## Next Steps

1. **Firebase Setup** → See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. **Vercel Deployment** → See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
3. **Google Drive Integration** → See [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)

---

**Questions?** Check the main [README.md](./README.md) for additional information.
