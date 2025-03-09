import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyD6Mw4Ugdj8bWA1Uz8LECt3sUt3m3Kfgsw",
  authDomain: "gofundz-5b149.firebaseapp.com",
  databaseURL: "https://gofundz-5b149-default-rtdb.firebaseio.com",
  projectId: "gofundz-5b149",
  storageBucket: "gofundz-5b149.firebasestorage.app",
  messagingSenderId: "228985745417",
  appId: "1:228985745417:web:e1d9f455196fd1684948d8",
  measurementId: "G-K9GV667K53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

