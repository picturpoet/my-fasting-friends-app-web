import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };