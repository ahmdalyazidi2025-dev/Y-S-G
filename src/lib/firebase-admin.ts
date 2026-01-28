import admin from 'firebase-admin'

if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined

    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        })
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT not found in environment variables. Server-side notifications will fail.")
    }
}

export const adminDb = admin.firestore()
export const adminMessaging = admin.messaging()
