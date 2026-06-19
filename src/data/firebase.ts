import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Public Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBabGjiY_mtr4mXM_XVwki5F7pSFQsybgc",
  authDomain: "modern-ceiling-m3jwj.firebaseapp.com",
  projectId: "modern-ceiling-m3jwj",
  storageBucket: "modern-ceiling-m3jwj.firebasestorage.app",
  messagingSenderId: "185579305464",
  appId: "1:185579305464:web:f79fbc2f5c922cabd1fe0d"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID provisioned
export const db = getFirestore(app, "ai-studio-6da9fc03-31ec-4b97-ac86-0f464a0a065e");
