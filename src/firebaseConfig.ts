// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqR7KOYfzrMjE_jnffTALPsJeYRRYjs4Y",
  authDomain: "katha-app-db.firebaseapp.com",
  projectId: "katha-app-db",
  storageBucket: "katha-app-db.firebasestorage.app",
  messagingSenderId: "707210404448",
  appId: "1:707210404448:web:3450fdc7699f0ba5fc5905"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
