const admin = require('firebase-admin');

const serviceAccount = {
    "type": "service_account",
    "project_id": "y-s-g-7c463",
    "private_key_id": "de5410939a349c7cc89dec5d740193025da3bc1f",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVIYdLQW5n6YZZ\ntDJ1qiEov7s1+maSewgGJCVURKp3Im1jwbalwmlaYvQswxlRaQLv8Q2Hz70IniyK\nU9PVNR+HE3IayzEsm9D5L918I7L/vPYxiGk36afPkVyix+nP49Z6dj/GQvZLwQoE\noxwVUlr01HnZsbpvQkKjgjjWJK9qESuZQ10xllsLzlq1VrHmJhRSwxfR1exvoRNH\nBg4aHe9nqvATNBFKm328truxtwr2eYb25/rOAVqrjPJgI4ivRDDRRw4d5s+ZodP4\nX3tZ7PifiyDMbgYqyxYOgrS6QS5ny0eoYs0cJKZSOvyx954zPa01YnOVQy4MsTVK\nKs9a4WwZAgMBAAECggEACxbS4SSjA9NTzxJH/1UGI2aBbTwtbtDpsJccHZuygl8X\nUbXMJOj9/grQwUz34eNcuKMCRRcXEu4W624T4x+f17F4cgIxOWzUhUibJai+WR3J\n8fcS4Wq99Vfu+dW8ubk1KTtCk3RbuAKP3MCnVwkpTByLh/r+NCh+it8dSbAQM+yf\nIrPTBesf2Tz8kvs+ZUJijzb1f+EbAW6eOlg+qI0lQ8Y8GDft7MgGZWgB0znKKbQx\n/cEctwAqwyOSwvUVehBpzdativtoLEh2IM05lskW2KJdy6fiJ/HBG1na8IGVlrf4\nTN1eXJHjadHz/QZ1DZzgOq1hU/QKvhfxVj8lrK7+gQKBgQD+ZYeHF2RXfd0j5TXW\nI3Jz3RHU8qPfZbXxMkW8vyh1rY77RWxIMmDD26g8fMwJBPvXgWi6yO6AvECzFrx5\nuqm6TlGZ+ZsIw8jmzZc4IO7/IpzEreYAXyGQG7ojblwZHKZjbEWojjMla/cILRYq\nKuDa0FUkPmPQTBqhOFeaPw1/mQKBgQDWeWquUmqQS3vwzC6IEbxW/+zC/e5oGmqj\nR8bgmNOvsaT4dTn0wRt9ke8IM/r10atawhhVHfrHcW0oIgI1QuWuJvRWIKPKr/+6\niWYGPcYxSlBZSJHj98t9xqQ/GTxJSgN4zdLk821tXTIqyCvzc0RP3voIo7tmQ2Ty\n7ss6JskggQKBgBIzj3PR76L25WiZELYGiTzS92CmD6V/MHpWX3j2sF1jEpTVzb6I\npDW/NJVHVI3cpmwv3R9oGvBpB7QIj2miOlyTF/GNU1NYNrqUwRoJ+S+V+WN1Eby7\nEbqu0S2RytMdIqaAa6d4rR4jUGRsXWac9MOTHlRehmOz3j/kuRfXJQ8ZAoGAKljW\n44yKVetRkX3/QgaedV8a1HVm+U8d9xdZAUerpGki9ZvP0a+/Sc/irm/1AUxg1Q61\n1ziQJ4kR0HbGkNWgm/49CDRxoreVerNeXaUc2OafbsGRbL2khDUQgRTufloKzXN2\nTJZz6MAaA7B6XRtJRav1GneZrNtptz3HCrhVxgECgYEAirmSQf5vK6kfOnRls0CJ\n3iz+NSJHmZ0bQkCITUjOIGQaufxfHjDl8nGdeua2ZRVz0jklcfJTmXkx26Rkl7FA\nDOyziqiuBRqaAzv8XmeEhslvkBsIsgzWVjbuj0eBKbDGwjA0twG+q4vHh6+MQ9Rs\nvk8kKD2Iv0/Jcw5jyYdOy4g=\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@y-s-g-7c463.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function inspect() {
    try {
        console.log("Fetching categories...");
        const catSnap = await db.collection("categories").get();
        const categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Found ${categories.length} categories:`);
        categories.forEach(c => console.log(` - ID: ${c.id}, nameAr: "${c.nameAr}", nameEn: "${c.nameEn}"`));

        console.log("\nFetching products...");
        const prodSnap = await db.collection("products").get();
        const products = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Found ${products.length} products total.`);

        // Count products by their stored "category" field
        const categoryCounts = {};
        products.forEach(p => {
            const cat = p.category || "undefined";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        console.log("\nProduct counts by stored 'category' field value:");
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            console.log(` - "${cat}": ${count} products`);
        });

        console.log("\nListing 10 sample products:");
        products.slice(0, 10).forEach(p => {
            console.log(` - Name: "${p.name}", Barcode: "${p.barcode}", Category: "${p.category}"`);
        });

    } catch (e) {
        console.error("Error inspecting database:", e);
    }
}

inspect();
