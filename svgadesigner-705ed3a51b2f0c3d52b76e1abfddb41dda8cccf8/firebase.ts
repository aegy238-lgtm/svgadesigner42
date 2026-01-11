
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDoc, 
  query, 
  where 
} from "firebase/firestore";
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

// تفعيل Force Long Polling لحل مشاكل الاتصال بالخادم (Backend connection issues)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

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

export { doc, setDoc, getDocs, onSnapshot, updateDoc, deleteDoc, addDoc, getDoc, query, where };
