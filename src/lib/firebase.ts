import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCS9sl7j-uIrxB_w6MwkRsN7fFDnGhZxE0",
    authDomain: "y-s-g-7c463.firebaseapp.com",
    projectId: "y-s-g-7c463",
    storageBucket: "y-s-g-7c463.firebasestorage.app",
    messagingSenderId: "163311897960",
    appId: "1:163311897960:web:cb8132ef61620e42fedadd",
    measurementId: "G-Y3JE7SCNGM"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Secondary App for Admin to create users without logging out
const getSecondaryAuth = () => {
    const secondaryAppName = "secondaryApp";
    let secondaryApp;
    try {
        secondaryApp = getApp(secondaryAppName);
    } catch {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }
    return getAuth(secondaryApp);
};

// Analytics is only supported in browser
export const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

// Messaging (Notification) - client side only
export const messaging = typeof window !== "undefined" ? isMessagingSupported().then(yes => yes ? getMessaging(app) : null) : null;

export { app, db, auth, getSecondaryAuth };
