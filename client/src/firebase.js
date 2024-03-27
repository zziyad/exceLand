// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "excelland-71348.firebaseapp.com",
  projectId: "excelland-71348",
  storageBucket: "excelland-71348.appspot.com",
  messagingSenderId: "197631826668",
  appId: "1:197631826668:web:3c8dcf5fb5c9c42a2ee3c9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
