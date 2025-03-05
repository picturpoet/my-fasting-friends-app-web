// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getDatabase } from 'firebase/database';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCb1l7FBf_BT261Lvgb3KFnWnqiPe-Ja-w",
  authDomain: "my-fasting-friends-app.firebaseapp.com",
  projectId: "my-fasting-friends-app",
  storageBucket: "my-fasting-friends-app.firebasestorage.app",
  messagingSenderId: "689494798872",
  appId: "1:689494798872:web:523579dcd670dfccf0c96d",
  measurementId: "G-VL8X6ST5XY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

window.recaptchaVerifier = new RecaptchaVerifier('sign-in-button', {
  'size': 'invisible',
  'callback': (response) => {
    // reCAPTCHA solved, allow signInWithPhoneNumber.
  }
}, auth);

export { auth, db, RecaptchaVerifier, signInWithPhoneNumber };


