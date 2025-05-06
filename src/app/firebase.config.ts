import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyA6u1frj9ekdTW5SB5qAds_wSs1GzRyyRg",
  authDomain: "cmpharmaadmin.firebaseapp.com",
  projectId: "cmpharmaadmin",
  storageBucket: "cmpharmaadmin.firebasestorage.app",
  messagingSenderId: "603772641855",
  appId: "1:603772641855:web:f6586a84c63e655b85ce8a",
  measurementId: "G-MN0S4Q7EW4"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
