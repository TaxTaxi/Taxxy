// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
 apiKey: "AIzaSyDqNF7Vw0eEnOgUIJB0DNJR5uA6I2Ty2hI",
  authDomain: "taxxy-core.firebaseapp.com",
  projectId: "taxxy-core",
  storageBucket: "taxxy-core.firebasestorage.app",
  messagingSenderId: "785321154326",
  appId: "1:785321154326:web:6721fe53496d7a7ba46237"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
