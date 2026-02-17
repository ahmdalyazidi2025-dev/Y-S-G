
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Hardcoded config from .env.local to avoid dotenv dependency
const firebaseConfig = {
    apiKey: "AIzaSy...", // Will fill from .env.local read
    authDomain: "ahmdalyazidi2025-dev.firebaseapp.com",
    projectId: "ahmdalyazidi2025-dev",
    storageBucket: "ahmdalyazidi2025-dev.appspot.com",
    messagingSenderId: "140366606540",
    appId: "1:140366606540:web:1a2b3c4d5e6f7a8b9c0d"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixSettings() {
    console.log("Forcing settings update...");
    try {
        const settingsRef = doc(db, "settings", "global");
        await setDoc(settingsRef, {
            enableBarcodeScanner: false,
            enableAIChat: true,
            requireCustomerInfoOnCheckout: true
        }, { merge: true });

        console.log("SUCCESS: Settings updated. EnableBarcodeScanner is FALSE.");
        process.exit(0);
    } catch (e) {
        console.error("FAILED to update settings:", e);
        process.exit(1);
    }
}

fixSettings();
