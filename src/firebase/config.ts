import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA0SK98uurQIVqBUpWvVrjZqXEF0Rc4tWU",
  authDomain: "commutee-api.firebaseapp.com",
  databaseURL: "https://commutee-api-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "commutee-api",
  storageBucket: "commutee-api.firebasestorage.app",
  messagingSenderId: "61041647437",
  appId: "1:61041647437:web:bf9ff4b95d652b3f1a6104",
  measurementId: "G-J8VBVESZR5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
