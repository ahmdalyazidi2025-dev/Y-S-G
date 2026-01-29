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

        // Use the first valid key
        const apiKey = validKeys[0].key.trim();

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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        // 4. Native Fetch to Google API
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Gemini API Error:", JSON.stringify(errData, null, 2));

            if (response.status === 400) {
                return NextResponse.json({ error: "خطأ في الطلب", details: errData.error?.message }, { status: 400 });
            } else if (response.status === 401 || response.status === 403) {
                return NextResponse.json({
                    error: "المفتاح غير صالح",
                    details: "المفتاح المسجل في الإعدادات مرفوض من Google. يرجى تحديثه."
                }, { status: 401 });
            } else if (response.status === 429) {
                return NextResponse.json({
                    error: "ضغط مرتفع",
                    details: "تم تجاوز حد الاستخدام المجاني. يرجى المحاولة لاحقاً."
                }, { status: 429 });
            }

            throw new Error(errData.error?.message || `Error ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("Chat Route Error:", error);
        return NextResponse.json({
            error: "خطأ داخلي",
            details: error.message || "Unknown Error"
        }, { status: 500 });
    }
}
