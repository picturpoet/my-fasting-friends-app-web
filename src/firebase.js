import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCb1l7FBf_BT261Lvgb3KFnWnqiPe-Ja-w",
  authDomain: "my-fasting-friends-app.firebaseapp.com",
  projectId: "my-fasting-friends-app",
  storageBucket: "my-fasting-friends-app.appspot.com",
  messagingSenderId: "689494798872",
  appId: "1:689494798872:web:523579dcd670dfccf0c96d",
  measurementId: "G-VL8X6ST5XY"
};

// Enable Firebase debugging
if (process.env.NODE_ENV === 'development' || true) {
  window.localStorage.setItem('debug', 'firebase:*');
  console.log('Firebase debugging enabled');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Check for development mode and enable emulators
if (process.env.NODE_ENV === 'development') {
  // Use emulators for auth and firestore
  connectAuthEmulator(auth, "http://localhost:9099"); // Specify the Auth Emulator URL
  connectFirestoreEmulator(db, "localhost", 8080); // Specify the Firestore Emulator URL
  auth.settings.appVerificationDisabledForTesting = true;
  console.log("Emulators connected and app verification disabled for testing");
}

export { auth, db };
