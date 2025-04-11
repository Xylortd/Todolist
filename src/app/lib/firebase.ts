import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: "AIzaSyCgIBe7UpQBVyUW4YAspyEASVZIHZlDeco",
  authDomain: "to-do-list-1f19a.firebaseapp.com",
  projectId: "to-do-list-1f19a",
  storageBucket: "to-do-list-1f19a.firebasestorage.app",
  messagingSenderId: "846457817709",
  appId: "1:846457817709:web:e24d5e821c84d20cef4d64",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
