// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";


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

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});


const db = getFirestore(app);

export { auth, db };
