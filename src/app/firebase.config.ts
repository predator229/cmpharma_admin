// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6u1frj9ekdTW5SB5qAds_wSs1GzRyyRg",
  authDomain: "cmpharmaadmin.firebaseapp.com",
  projectId: "cmpharmaadmin",
  storageBucket: "cmpharmaadmin.firebasestorage.app",
  messagingSenderId: "603772641855",
  appId: "1:603772641855:web:f6586a84c63e655b85ce8a",
  measurementId: "G-MN0S4Q7EW4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
