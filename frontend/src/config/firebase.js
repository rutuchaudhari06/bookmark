// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZAI7VWGpvslYwdei5yZNWREhbHCw0M_g",
  authDomain: "flash-card-project-db697.firebaseapp.com",
  projectId: "flash-card-project-db697",
  storageBucket: "flash-card-project-db697.firebasestorage.app",
  messagingSenderId: "340058425036",
  appId: "1:340058425036:web:7bb68b4ec26b4f104c6469",
  measurementId: "G-SBGNSHRETF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db= getFirestore(app);
export const googleProvider = new GoogleAuthProvider() 