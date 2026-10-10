import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const getStoredConfig = (): FirebaseConfig | null => {
  if (typeof localStorage === 'undefined') return null;
  const stored = localStorage.getItem('mosa_firebase_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      return (import.meta as any).env[key] || '';
    }
  } catch {}
  try {
    const gProcess = (globalThis as any)?.process;
    if (gProcess && gProcess.env) {
      return gProcess.env[key] || '';
    }
  } catch {}
  return '';
};

export const defaultEnvConfig: FirebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
};

export const isFirebaseConfigured = (): boolean => {
  const cfg = getStoredConfig() || defaultEnvConfig;
  return Boolean(cfg.apiKey && cfg.projectId && cfg.apiKey !== 'YOUR_API_KEY');
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  const activeConfig = getStoredConfig() || defaultEnvConfig;
  if (activeConfig.apiKey && activeConfig.projectId && activeConfig.apiKey !== 'YOUR_API_KEY') {
    app = !getApps().length ? initializeApp(activeConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.warn('Firebase initialization skipped or failed:', error);
}

export { app, auth, db };
