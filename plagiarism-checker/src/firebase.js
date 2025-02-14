import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBIlA7zIB3jkP66kXxC2hzZHVnOvX4xmak",
  authDomain: "seo-plagairism-checker.firebaseapp.com",
  projectId: "seo-plagairism-checker",
  storageBucket: "seo-plagairism-checker.appspot.com",
  messagingSenderId: "966226587019",
  appId: "1:966226587019:web:90093ec9915dbd144c538e",
  measurementId: "G-3R7L0MMHFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
