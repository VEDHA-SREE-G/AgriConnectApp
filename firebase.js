// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0mvAaGlZl9_-TPHLe_Cgkofhlvj64rdc",
  authDomain: "agriconnect-3c327.firebaseapp.com",
  projectId: "agriconnect-3c327",
  storageBucket: "agriconnect-3c327.appspot.com",
  messagingSenderId: "522663366346",
  appId: "1:522663366346:web:812340ea9450a74150ae33",
  measurementId: "G-DB1CY1X8JP",
};

// ✅ Prevent multiple initialization (important for Netlify)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
