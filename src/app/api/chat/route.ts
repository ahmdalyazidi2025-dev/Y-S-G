import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. Fetch Keys using Admin SDK (Bypasses Client Security Rules)
        const docRef = adminDb.collection("settings").doc("global");
        const docSnap = await docRef.get();

        let apiKeys: { key: string, status: "valid" | "invalid" | "unchecked" }[] = [];

        if (docSnap.exists) {
            const data = docSnap.data();
            apiKeys = data?.aiApiKeys || [];
        }

        // 2. Validate Keys
        const validKeys = apiKeys.filter(k => k.key && k.status !== "invalid");

        if (validKeys.length === 0) {
            return NextResponse.json({
                error: "المفاتيح غير موجودة",
                details: "يرجى من المسؤول إضافة مفتاح Google Gemini API في الإعدادات."
            }, { status: 401 });
        }

        // 3. Prepare Gemini Payload
        const contents = messages
            .filter((m: any) => m.role !== "system")
            .map((m: any) => ({
                role: m.role === "assistant" || m.role === "ai" ? "model" : "user",
                parts: [{ text: m.content }]
            }));

        const payload = {
            contents: contents,
            system_instruction: {
                parts: [{ text: "أنت مساعد ذكي لمتجر YSG GROUP لقطع الغيار. معلوماتك مستمدة من قاعدة بيانات المتجر. جاوب باختصار ودقة." }]
            }
        };

        // 3. Loop through keys until one works (Rotation Logic)
        let lastError = null;

        for (const keyObj of validKeys) {
            const apiKey = keyObj.key.trim();

            try {
                // A. Dynamic Model Discovery per key
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const listResponse = await fetch(listUrl, { method: "GET" });
                let chosenModel = "gemini-1.5-flash"; // Default

                if (listResponse.ok) {
                    const data = await listResponse.json();
                    const models = data.models || [];

                    const flashLatest = models.find((m: any) => m.name.includes("gemini-1.5-flash-latest"));
                    const flash = models.find((m: any) => m.name.includes("gemini-1.5-flash"));
                    const pro = models.find((m: any) => m.name.includes("gemini-pro"));

                    if (flashLatest) chosenModel = flashLatest.name;
                    else if (flash) chosenModel = flash.name;
                    else if (pro) chosenModel = pro.name;

                    chosenModel = chosenModel.replace(/^models\//, "");
                }

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;

                // B. Native Fetch to Google API
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.warn(`Key ends with ...${apiKey.slice(-4)} failed:`, errData);

                    if (response.status === 429) {
                        // Quota limit, try next key
                        lastError = { status: 429, message: "تم تجاوز حد الاستخدام (Quota Exceeded)" };
                        continue;
                    }

                    if (response.status === 401 || response.status === 403) {
                        lastError = { status: 401, message: "المفتاح غير صالح أو محظور" };
                        continue;
                    }

                    // For other errors, might be payload related, so maybe don't retry? 
                    // But for safety let's try next key if available, worst case all fail.
                    lastError = { status: response.status, message: errData.error?.message || "Error" };
                    continue;
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

                return NextResponse.json({ text });

            } catch (error: any) {
                console.error("Key Attempt Error:", error);
                lastError = { status: 500, message: error.message };
                continue;
            }
        }

        // If loop finishes without return, all keys failed
        return NextResponse.json({
            error: lastError?.status === 429 ? "ضغط مرتفع" : "خطأ في الاتصال",
            details: lastError?.message || "فشلت جميع المفاتيح المتوفرة. يرجى المحاولة لاحقاً."
        }, { status: lastError?.status || 500 });

    } catch (error: any) {
        console.error("Chat Route Error:", error);
        return NextResponse.json({
            error: "خطأ داخلي",
            details: error.message || "Unknown Error"
        }, { status: 500 });
    }
}
