import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYdAFNO7QKy90dx1i1AesSr0KQILN8Fcw",
  authDomain: "nourishai-27d26.firebaseapp.com",
  projectId: "nourishai-27d26",
  storageBucket: "nourishai-27d26.firebasestorage.app",
  messagingSenderId: "1084558914620",
  appId: "1:1084558914620:web:6e268913b0a748927e7f39"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();