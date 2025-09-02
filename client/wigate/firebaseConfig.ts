// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWgi51wj8OR1bKz7erS7YvdOM4LYjw6zI",
  authDomain: "wificv.firebaseapp.com",
  projectId: "wificv",
  storageBucket: "wificv.firebasestorage.app",
  messagingSenderId: "886729516337",
  appId: "1:886729516337:web:be4981da04cbb4b159bc10",
  measurementId: "G-HXE1GLYGVP"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
