const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dependency on dotenv
function loadEnv() {
    const envPath = path.join(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            // Remove quotes if present
            process.env[key] = value.replace(/^"(.*)"$/, '$1');
        }
    });
}

loadEnv();

const saString = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saString) {
    console.error("FIREBASE_SERVICE_ACCOUNT is missing");
    process.exit(1);
}

const serviceAccount = JSON.parse(saString);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testWrites() {
    try {
        console.log("Testing write to password_requests...");
        const passRef = await db.collection("password_requests").add({
            phone: "0500000000",
            customerName: "Test User",
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isTest: true
        });
        console.log("Success! Created password request:", passRef.id);

        console.log("Testing write to joinRequests...");
        const joinRef = await db.collection("joinRequests").add({
            name: "Test Joiner",
            phone: "0511111111",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isTest: true
        });
        console.log("Success! Created join request:", joinRef.id);

        // Cleanup
        await passRef.delete();
        await joinRef.delete();
        console.log("Cleanup successful.");
        
        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

testWrites();
