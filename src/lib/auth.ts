import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, getFirebaseStatus } from './firebase';
import firebaseConfig from './firebaseConfig';

function assertReady() {
  const status = getFirebaseStatus();
  if (!status.initialized) {
    throw new Error(status.error || 'Firebase is not initialized. Check VITE_FIREBASE_* environment variables.');
  }
}

// Cache the access token in memory.
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  assertReady();

  if (import.meta.env.DEV) {
    console.debug('Firebase auth initialized with project:', firebaseConfig.projectId, 'authDomain:', firebaseConfig.authDomain);
  }

  return onAuthStateChanged(auth!, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  assertReady();

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth!, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) {
      throw new Error('Google credential missing after sign-in.');
    }

    cachedAccessToken = credential.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const firebaseCredential = GoogleAuthProvider.credentialFromError(error);
    console.error('Google sign-in error:', {
      code: error?.code,
      message: error?.message,
      name: error?.name,
      customData: error?.customData,
      email: error?.email,
      credential: firebaseCredential,
      stack: error?.stack,
    });
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const emailPasswordSignIn = async (email: string, password: string): Promise<User> => {
  assertReady();
  const result = await signInWithEmailAndPassword(auth!, email, password);
  return result.user;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  assertReady();
  await auth!.signOut();
  cachedAccessToken = null;
};

export type FirebaseUserProfile = {
  name?: string;
  role?: "admin" | "user";
  email?: string;
};

export const getFirebaseUserProfile = async (uid: string): Promise<FirebaseUserProfile | null> => {
  assertReady();
  try {
    const profileDoc = await getDoc(doc(db!, 'users', uid));
    if (!profileDoc.exists()) return null;
    return profileDoc.data() as FirebaseUserProfile;
  } catch (err) {
    console.error('Error loading user profile from Firestore:', err);
    return null;
  }
};
