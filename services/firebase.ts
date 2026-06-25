import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBUBiiySGzt_vlp92KwSIyMEDF7NcwQ0Lw",
  authDomain: "quien-va-cantar.firebaseapp.com",
  projectId: "quien-va-cantar",
  storageBucket: "quien-va-cantar.firebasestorage.app",
  messagingSenderId: "371859983518",
  appId: "1:371859983518:web:33f353fa52320254debf8f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
