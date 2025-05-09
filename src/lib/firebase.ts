// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDqNF7Vw0eEnOgUIJB0DNJR5uA6I2Ty2hI",
  authDomain: "taxxy-core.firebaseapp.com",
  projectId: "taxxy-core",
  storageBucket: "taxxy-core.appspot.com", // ✅ fixed typo: should be .app**spot**.com
  messagingSenderId: "785321154326",
  appId: "1:785321154326:web:6721fe53496d7a7ba46237",
};

// ✅ Initialize Firebase once
const app = initializeApp(firebaseConfig);

// ✅ Export Firebase services to use elsewhere
export const auth = getAuth(app);
export const db = getFirestore(app);
