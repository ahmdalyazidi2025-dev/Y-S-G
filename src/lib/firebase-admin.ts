import admin from 'firebase-admin'

if (!admin.apps.length) {
    try {
        const saString = process.env.FIREBASE_SERVICE_ACCOUNT
        if (!saString) {
            console.warn("FIREBASE_SERVICE_ACCOUNT is missing");
            // During Vercel build, env vars might be missing. We shouldn't crash the build.
            // But we must initialize an empty app to satisfy `admin.firestore()` calls that are immediately exported.
            if (process.env.npm_lifecycle_event === 'build' || process.env.VERCEL) {
                console.warn("Initializing mock Firebase Admin for Vercel build phase.");
                admin.initializeApp();
            }
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
export const adminAuth = admin.auth()
