import admin from 'firebase-admin'

function initializeAdmin() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        let serviceAccount: any = null;
        let useEnvVars = false;

        const saString = process.env.FIREBASE_SERVICE_ACCOUNT;
        
        if (saString) {
            try {
                // Handle Vercel/Next.js escaped newlines in env variables
                const cleanString = saString.trim().replace(/\\n/g, '\n');
                serviceAccount = JSON.parse(cleanString);
            } catch (parseError: any) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. Error:", parseError.message);
                // We don't throw immediately so we can fall back to the individual env vars below
            }
        }

        // Alternative: Use individual environment variables if JSON is missing or invalid
        if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            console.log("Using individual FIREBASE_* environment variables for Admin initialization.");
            serviceAccount = {
                project_id: process.env.FIREBASE_PROJECT_ID,
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                // Handle escaped newlines in the private key as well
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
            };
            useEnvVars = true;
        }

        if (!serviceAccount) {
            console.warn("FIREBASE_SERVICE_ACCOUNT or individual FIREBASE_* variables are missing or invalid.");
            
            // During Vercel build, or if running in GCP environment with managed identities
            // we can try default initialization.
            if (process.env.npm_lifecycle_event === 'build' || process.env.VERCEL || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                console.info("Initializing Firebase Admin with default credentials.");
                return admin.initializeApp();
            }
            
            throw new Error("Missing valid FIREBASE_SERVICE_ACCOUNT or individual FIREBASE_* variables. Please check your .env.local file.");
        }

        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
            databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });
        
        console.log(`Firebase Admin initialized successfully using ${useEnvVars ? 'individual env vars' : 'service account JSON'}.`);
        return app;
    } catch (error: any) {
        console.error("Failed to initialize Firebase Admin:", error.message);
        
        // Final fallback to prevent immediate crash if possible, or throw descriptive error
        if (admin.apps.length > 0) return admin.app();
        
        if (error.message.includes("Unable to detect a Project Id") || error.message.includes("projectId is required")) {
            throw new Error(
                "Firebase Project ID could not be detected. Ensure your Firebase credentials in .env.local are set correctly."
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
