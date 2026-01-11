
import { initializeApp } from "firebase/app";
// Import query and where from firebase/firestore
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, updateDoc, deleteDoc, addDoc, getDoc, query, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvBuElRvz4BHEmlGCXLCJsZ1V4iULcMpo",
  authDomain: "molly-starr.firebaseapp.com",
  projectId: "molly-starr",
  storageBucket: "molly-starr.firebasestorage.app",
  messagingSenderId: "22332089138",
  appId: "1:22332089138:web:d54d2572dd0a888baa2d2b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const collections = {
  products: collection(db, "products"),
  orders: collection(db, "orders"),
  settings: collection(db, "settings"),
  banners: collection(db, "banners"),
  users: collection(db, "users"),
  categories: collection(db, "categories")
};

// Export query and where functions to fix compilation errors in components
export { doc, setDoc, getDocs, onSnapshot, updateDoc, deleteDoc, addDoc, getDoc, query, where };
