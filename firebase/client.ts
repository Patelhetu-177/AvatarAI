
import { initializeApp, getApp, getApps } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXaU-4rdnecxpQytfI4o-4ZqLaCWbB55I",
  authDomain: "avatarai-c9459.firebaseapp.com",
  projectId: "avatarai-c9459",
  storageBucket: "avatarai-c9459.firebasestorage.app",
  messagingSenderId: "715576381223",
  appId: "1:715576381223:web:06a8f1935ad7a93f4a6302",
  measurementId: "G-7BN8XDPZWY"
};


const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);