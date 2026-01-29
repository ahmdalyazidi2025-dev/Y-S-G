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
        const errors = [];

        for (let i = 0; i < validKeys.length; i++) {
            const keyObj = validKeys[i];
            const apiKey = keyObj.key.trim();
            const keyLabel = `Key #${i + 1} (...${apiKey.slice(-4)})`;

            try {
                // A. Dynamic Model Discovery per key
                const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
                const listResponse = await fetch(listUrl, { method: "GET" });
                let chosenModel = "gemini-1.5-flash"; // Default

                if (listResponse.ok) {
                    const data = await listResponse.json();
                    const models = data.models || [];

                    // Priority: 
                    // 1. Stable 1.5 Flash (Free & Fast)
                    // 2. Any 1.5 Flash variant
                    // 3. Any Flash variant (e.g. 2.0-flash)
                    // 4. Any 1.5 Pro
                    // 5. Any Gemini model (Fallback safety net)

                    const flash15 = models.find((m: any) => m.name.includes("gemini-1.5-flash"));
                    const anyFlash = models.find((m: any) => m.name.includes("flash"));
                    const pro15 = models.find((m: any) => m.name.includes("gemini-1.5-pro"));
                    const anyGemini = models.find((m: any) => m.name.includes("gemini"));

                    if (flash15) chosenModel = flash15.name;
                    else if (anyFlash) chosenModel = anyFlash.name;
                    else if (pro15) chosenModel = pro15.name;
                    else if (anyGemini) chosenModel = anyGemini.name;

                    chosenModel = chosenModel.replace(/^models\//, "");
                } else {
                    const err = await listResponse.json().catch(() => ({}));
                    errors.push(`${keyLabel} [ModelList]: ${listResponse.status} - ${err.error?.message || "Error"}`);
                    continue; // If we can't list models, key is likely bad
                }

                // FORCE 'gemini-1.5-flash' if the selection logic failed but we still want to try 
                // (e.g. if list was empty but call succeeded?)
                // Actually, if we found nothing, chosenModel is already "gemini-1.5-flash" (default).

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${apiKey}`;

                // B. Native Fetch to Google API
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.warn(`${keyLabel} failed:`, errData);

                    const status = response.status;
                    const msg = errData.error?.message || "Unknown";

                    errors.push(`${keyLabel} [Generate][Model:${chosenModel}]: ${status} - ${msg}`);
                    continue; // Try next key
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

                return NextResponse.json({ text });

            } catch (error: any) {
                console.error("Key Attempt Error:", error);
                errors.push(`${keyLabel} [Exception]: ${error.message}`);
                continue;
            }
        }

        // If loop finishes without return, all keys failed
        console.error("All keys failed:", errors);
        return NextResponse.json({
            error: "فشل الاتصال بجميع المفاتيح",
            details: errors.join(" | ")
        }, { status: 429 }); // Using 429 to show the specific error details in UI


    } catch (error: any) {
        console.error("Chat Route Error:", error);
        return NextResponse.json({
            error: "خطأ داخلي",
            details: error.message || "Unknown Error"
        }, { status: 500 });
    }
}
