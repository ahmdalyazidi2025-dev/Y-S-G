import { NextResponse } from "next/server";
import { db } from "@/lib/firebase"; // Using standard SDK, works server-side if rules allow or config is valid
import { doc, getDoc } from "firebase/firestore";

// Helper to call Gemini REST API directly
async function callGeminiRest(apiKey: string, messages: any[]) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Map OpenAI-style messages to Gemini format
    const contents = messages.map(m => {
        const parts = [];
        if (typeof m.content === 'string') {
            parts.push({ text: m.content });
        } else if (Array.isArray(m.content)) {
            // Handle array content (text + image)
            m.content.forEach((c: any) => {
                if (c.type === 'text') parts.push({ text: c.text });
                if (c.type === 'image_url') {
                    // Extract base64 from data URL
                    const base64Data = c.image_url.url.split(',')[1];
                    const mimeType = c.image_url.url.split(';')[0].split(':')[1] || 'image/jpeg';
                    parts.push({ inlineData: { mimeType, data: base64Data } });
                }
            });
        }
        return {
            role: m.role === "assistant" ? "model" : "user",
            parts
        };
    });

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
        cache: "no-store"
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, storeId = "store" } = body; // Default to 'store' doc in settings

        if (!messages) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        // 1. Fetch Settings from Firebase (Server-Side)
        // This runs on the Node.js server, so it's secure from the client browser.
        // Note: 'db' usage here depends on Firebase rules allowing public read OR env vars setup.
        // Assuming rules allow read for settings.
        // 1. Fetch Settings from Firebase (Server-Side)
        // STRATEGY: Try 'ai_config' document first (per user request), then fallback to 'store'
        let keysToCheck: { key: string, status: string }[] = [];

        // Check specific 'ai_config' doc first
        const aiConfigRef = doc(db, "settings", "ai_config");
        const aiConfigSnap = await getDoc(aiConfigRef);

        if (aiConfigSnap.exists()) {
            const aiData = aiConfigSnap.data();
            if (aiData.gemini_api_key) {
                keysToCheck.push({ key: aiData.gemini_api_key, status: "valid" });
            }
        }

        // If no keys found in ai_config, check store settings
        if (keysToCheck.length === 0) {
            const settingsRef = doc(db, "settings", storeId);
            const settingsSnap = await getDoc(settingsRef);

            if (settingsSnap.exists()) {
                const settings = settingsSnap.data();
                // Use Multi-Key Array if available
                if (settings.aiApiKeys && Array.isArray(settings.aiApiKeys)) {
                    keysToCheck.push(...settings.aiApiKeys);
                }
                // Fallback to legacy single key
                else if (settings.googleGeminiApiKey) {
                    keysToCheck.push({ key: settings.googleGeminiApiKey, status: "valid" });
                }
            }
        }

        // 3. Final Fallback: Environment Variable (For manual local setup)
        if (keysToCheck.length === 0 && process.env.GEMINI_API_KEY) {
            keysToCheck.push({ key: process.env.GEMINI_API_KEY, status: "valid" });
        }

        const validKeys = keysToCheck.filter((k: any) => k.key && k.status !== "invalid");

        if (validKeys.length === 0) {
            return NextResponse.json({
                error: "لم يتم العثور على مفتاح API",
                details: "يرجى إضافة المفتاح في الإعدادات أو في ملف .env باسم GEMINI_API_KEY"
            }, { status: 500 });
        }

        // 2. Multi-Key Rotation Implementation
        let lastError = "";
        for (const keyObj of validKeys) {
            try {
                // Call Google/OpenRouter
                const text = await callGeminiRest(keyObj.key.trim(), messages);
                return NextResponse.json({ text });
            } catch (e: any) {
                console.warn("Key failed in Proxy:", e.message);
                lastError = e.message;
                // Continue to next key
            }
        }

        return NextResponse.json({
            error: "All keys failed",
            details: lastError
        }, { status: 503 });

    } catch (error: any) {
        console.error("Chat Proxy Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error",
            details: "Please check your API Key in Admin Settings."
        }, { status: 500 });
    }
}
