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

        // Models to try in order of priority
        // We prioritize 1.5-flash as it is the most stable/cost-effective
        const TARGET_MODEL = "gemini-1.5-flash"; // Or switch to "gemini-2.0-flash-exp" if needed

        for (let i = 0; i < validKeys.length; i++) {
            const keyObj = validKeys[i];
            const apiKey = keyObj.key.trim();
            const keyLabel = `Key #${i + 1} (...${apiKey.slice(-4)})`;

            try {
                // Modified Logic: Skip "List Models" to save Quota & Latency.
                // Directly attempt generation with the target model.

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${TARGET_MODEL}:generateContent?key=${apiKey}`;

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

                    // Handle specific error codes if needed
                    if (status === 429 || status === 503) {
                        errors.push(`${keyLabel} [Quota/Overload]: ${msg}`);
                    } else {
                        errors.push(`${keyLabel} [Error]: ${status} - ${msg}`);
                    }
                    continue; // Try next key
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

                if (!text) {
                    errors.push(`${keyLabel} [Empty Response]`);
                    continue;
                }

                return NextResponse.json({ text });

            } catch (error: any) {
                console.error("Key Attempt Error:", error);
                errors.push(`${keyLabel} [Exception]: ${error.message}`);
                continue;
            }
        }

        // If loop finishes without return, all keys failed
        console.error("All keys failed:", errors);

        let finalError = errors.join(" | ");
        const isQuota = errors.some(e => e.includes("429") || e.includes("RESOURCE_EXHAUSTED") || e.includes("Quota"));

        if (isQuota) {
            finalError += "\n\n💡 نصيحة هامة: الخطأ (Quota) يعني أن 'المشروع' في جوجل انتهى رصيده. إنشاء مفتاح جديد في نفس المشروع لن يحل المشكلة. يجب إنشاء 'مشروع جديد' (New Project) في حساب جوجل واستخراج مفتاح منه.";
        }

        return NextResponse.json({
            error: "فشل الاتصال بجميع المفاتيح",
            details: finalError
        }, { status: 429 });


    } catch (error: any) {
        console.error("Chat Route Error:", error);
        return NextResponse.json({
            error: "خطأ داخلي",
            details: error.message || "Unknown Error"
        }, { status: 500 });
    }
}
