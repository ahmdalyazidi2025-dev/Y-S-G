import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. Fetch Key from settings/ai_config
        const docRef = doc(db, "settings", "ai_config");
        const docSnap = await getDoc(docRef);

        let apiKey = "";

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Try common field names just in case, but prioritize gemini_api_key
            apiKey = data.gemini_api_key || data.api_key || "";
        }

        if (!apiKey) {
            // Fallback error message as per requirements or generic 401
            return NextResponse.json({ error: "المفتاح غير موجود في الإعدادات" }, { status: 401 });
        }

        // 2. Prepare Gemini Payload
        // Convert messages to Gemini format
        const contents = messages
            .filter((m: any) => m.role !== "system") // Filter out system messages from standard flow if any, as we send instruction separately
            .map((m: any) => ({
                role: m.role === "assistant" || m.role === "ai" ? "model" : "user",
                parts: [{ text: m.content }]
            }));

        const payload = {
            contents: contents,
            system_instruction: {
                parts: [{ text: "أنت مساعد ذكي لمتجر YSG GROUP لقطع الغيار. معلوماتك مستمدة من قاعدة بيانات المتجر" }]
            }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        // 3. Native Fetch
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 400 || response.status === 401 || response.status === 403) {
                return NextResponse.json({ error: "المفتاح الموجود في قاعدة البيانات غير صالح" }, { status: 401 });
            }
            const errData = await response.json().catch(() => ({}));
            console.error("Gemini API Error:", errData);
            throw new Error(errData.error?.message || `Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("Chat Route Error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
