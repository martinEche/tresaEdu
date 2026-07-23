// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQV_2w1qjI2jMgC7fHw13tAtt3MBBPNMA",
  authDomain: "fibase-santa.firebaseapp.com",
  projectId: "fibase-santa",
  storageBucket: "fibase-santa.firebasestorage.app",
  messagingSenderId: "88282191860",
  appId: "1:88282191860:web:70f79fb71add5dec79cba1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 👉 ESTO ES LO QUE FALTABA
export const db = getDatabase(app);