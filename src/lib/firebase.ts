import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebaseConfig';

let initError: string | null = null;

const { apiKey, authDomain, projectId, appId } = firebaseConfig;
if (!apiKey || !authDomain || !projectId || !appId) {
  initError = 'Firebase configuration is incomplete. Check VITE_FIREBASE_* environment variables.';
}

const app = apiKey && authDomain ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;

export function getFirebaseStatus() {
  return { initialized: !!app, error: initError };
}
