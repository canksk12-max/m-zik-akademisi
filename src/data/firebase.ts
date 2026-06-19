import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Public Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7HYss3ucFB9IXippQ_5x0KNWgs5WsjwE",
  authDomain: "muzik-akademisi-f7627.firebaseapp.com",
  projectId: "muzik-akademisi-f7627",
  storageBucket: "muzik-akademisi-f7627.firebasestorage.app",
  messagingSenderId: "201017735153",
  appId: "1:201017735153:web:a329a5784f1a7fe5307650",
  measurementId: "G-FTZZKKVGR8"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the default database instance
export const db = getFirestore(app);

