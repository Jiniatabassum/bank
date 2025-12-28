import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD7sT_zCeB-6ZLfGf9ljJJ_WvwZTmbUFWo",
  authDomain: "abaya-bank.firebaseapp.com",
  projectId: "abaya-bank",
  storageBucket: "abaya-bank.firebasestorage.app",
  messagingSenderId: "1077419919500",
  appId: "1:1077419919500:web:7cb2ce78b38c48f18753a9",
  measurementId: "G-G1C4CP0XWD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;
