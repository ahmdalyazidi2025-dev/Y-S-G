import admin from 'firebase-admin'

if (!admin.apps.length) {
    try {
        const saString = process.env.FIREBASE_SERVICE_ACCOUNT
        if (!saString) {
            console.warn("FIREBASE_SERVICE_ACCOUNT is missing");
        } else {
            const serviceAccount = JSON.parse(saString);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin initialized successfully");
        }
    } catch (error) {
        console.error("Failed to initialize Firebase Admin:", error);
    }
}

export const adminDb = admin.firestore()
export const adminMessaging = admin.messaging()
