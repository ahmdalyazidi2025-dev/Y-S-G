require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

console.log("Starting test...");

if (!admin.apps.length) {
    try {
        const saString = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (!saString) {
            console.error("FIREBASE_SERVICE_ACCOUNT is missing");
            process.exit(1);
        }
        const serviceAccount = JSON.parse(saString);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin initialized successfully");
    } catch (error) {
        console.error("Failed to initialize Firebase Admin:", error);
        process.exit(1);
    }
}

const adminDb = admin.firestore();

async function test() {
    try {
        const res = await adminDb.collection("password_requests").add({
            customerId: "test",
            customerName: "test",
            phone: "0555555555",
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("Added doc with ID: ", res.id);
    } catch (e) {
        console.error("Error writing:", e);
    }
}

test();
