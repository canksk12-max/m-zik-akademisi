import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Mode provider configuration
export type FirebaseProvider = 'aistudio' | 'custom';

// AI Studio managed database (Fully provisioned, works instantly out-of-the-box!)
const aiStudioConfig = {
  apiKey: "AIzaSyBabGjiY_mtr4mXM_XVwki5F7pSFQsybgc",
  authDomain: "modern-ceiling-m3jwj.firebaseapp.com",
  projectId: "modern-ceiling-m3jwj",
  storageBucket: "modern-ceiling-m3jwj.firebasestorage.app",
  messagingSenderId: "185579305464",
  appId: "1:185579305464:web:f79fbc2f5c922cabd1fe0d"
};

// User's custom database project (requires manual initialization in Firebase console)
const customConfig = {
  apiKey: "AIzaSyD7HYss3ucFB9IXippQ_5x0KNWgs5WsjwE",
  authDomain: "muzik-akademisi-f7627.firebaseapp.com",
  projectId: "muzik-akademisi-f7627",
  storageBucket: "muzik-akademisi-f7627.firebasestorage.app",
  messagingSenderId: "201017735153",
  appId: "1:201017735153:web:a329a5784f1a7fe5307650"
};

let activeApp: FirebaseApp;
const provider = (localStorage.getItem('firebase_db_provider') as FirebaseProvider) || 'aistudio';

const existingApps = getApps();

if (provider === 'custom') {
  const existingCustom = existingApps.find(app => app.name === 'custom');
  if (existingCustom) {
    activeApp = existingCustom;
  } else {
    activeApp = initializeApp(customConfig, 'custom');
  }
} else {
  const existingDefault = existingApps.find(app => app.name === '[DEFAULT]');
  if (existingDefault) {
    activeApp = existingDefault;
  } else {
    activeApp = initializeApp(aiStudioConfig);
  }
}

// Export the active database
export const db = provider === 'custom' 
  ? getFirestore(activeApp) 
  : getFirestore(activeApp, "ai-studio-6da9fc03-31ec-4b97-ac86-0f464a0a065e");

// Helper to switch providers easily
export function getFirebaseProvider(): FirebaseProvider {
  return provider;
}

export function setFirebaseProvider(newProvider: FirebaseProvider) {
  localStorage.setItem('firebase_db_provider', newProvider);
}

