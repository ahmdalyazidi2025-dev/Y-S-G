import admin from 'firebase-admin'

function initializeAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        const saString = process.env.FIREBASE_SERVICE_ACCOUNT
        if (!saString) {
            console.warn("FIREBASE_SERVICE_ACCOUNT is missing from environment variables");
            
            // During Vercel build, or if running in GCP environment with managed identities
            // we can try default initialization.
            if (process.env.npm_lifecycle_event === 'build' || process.env.VERCEL || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                console.info("Initializing Firebase Admin with default credentials.");
                return admin.initializeApp();
            }
            
            throw new Error("Missing FIREBASE_SERVICE_ACCOUNT. Please check your .env.local file.");
        }

        const serviceAccount = JSON.parse(saString.trim());
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });
        
        console.log("Firebase Admin initialized successfully with service account.");
        return app;
    } catch (error: any) {
        console.error("Failed to initialize Firebase Admin:", error.message);
        
        // Final fallback to prevent immediate crash if possible, or throw descriptive error
        if (admin.apps.length > 0) return admin.app();
        
        if (error.message.includes("Unable to detect a Project Id")) {
            throw new Error(
                "Firebase Project ID could not be detected. Ensure FIREBASE_SERVICE_ACCOUNT is valid " +
                "or specify project_id in the service account JSON."
            );
        }
        throw error;
    }
}

// Initialize the app
const app = initializeAdmin();

export const adminDb = admin.firestore(app)
export const adminMessaging = admin.messaging(app)
export const adminAuth = admin.auth(app)
