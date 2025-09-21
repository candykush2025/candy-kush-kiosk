// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArHqBGN9IO3xdVozIkCEXaoygtC2qkuwU",
  authDomain: "candy-kush.firebaseapp.com",
  projectId: "candy-kush",
  storageBucket: "candy-kush.firebasestorage.app",
  messagingSenderId: "728690751973",
  appId: "1:728690751973:web:69fda734bdf22bccfe970c",
  measurementId: "G-4JZJ6PGWP5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };

// Export the app instance
export default app;
