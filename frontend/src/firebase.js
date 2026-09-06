import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseAuthEnabled = Object.values(firebaseConfig).every(Boolean);

const app = isFirebaseAuthEnabled ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

export async function signInWithUrbanAI(email, password) {
  if (!isFirebaseAuthEnabled || !auth) {
    throw new Error('Firebase authentication is not configured yet.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential;
}

export async function signOutUrbanAI() {
  if (!isFirebaseAuthEnabled || !auth) {
    return;
  }

  await signOut(auth);
}

export default app;
