import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Konfigurasi dari Firebase Console kamu
const firebaseConfig = {
  apiKey: "AIzaSyD4D-XiTDSwLqZeqA44tvn1Bxo-EjwVkqQ",
  authDomain: "travelbookingweb.firebaseapp.com",
  projectId: "travelbookingweb",
  storageBucket: "travelbookingweb.firebasestorage.app",
  messagingSenderId: "36320814847",
  appId: "1:36320814847:web:bbd94bd1471cf7a2ba4eca",
  measurementId: "G-0HEDE55XV1"
};

// Cek apakah Firebase sudah jalan, kalau belum baru inisialisasi (Singleton Pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export agar bisa dipakai di file lain
export const auth = getAuth(app);
export const db = getFirestore(app);