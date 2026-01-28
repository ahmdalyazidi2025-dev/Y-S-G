import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 1. Fetch Keys from settings/global (unified settings)
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);

        let apiKeys: { key: string, status: "valid" | "invalid" | "unchecked" }[] = [];

        if (docSnap.exists()) {
            const data = docSnap.data();
            apiKeys = data.aiApiKeys || [];
        }

        const validKeys = apiKeys.filter(k => k.key && k.status !== "invalid");

        if (validKeys.length === 0) {
            return NextResponse.json({
                error: "المفاتيح غير موجودة أو غير صالحة",
                details: "يرجى إضافة مفاتيح AI في إعدادات المتجر."
            }, { status: 401 });
        }

        // Use the first valid key (rotation can be added if needed, but for simplicity we use the first)
        const apiKey = validKeys[0].key.trim();

        // 2. Prepare Gemini Payload
        const contents = messages
            .filter((m: any) => m.role !== "system")
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
            const errData = await response.json().catch(() => ({}));

            // Log for server-side debugging
            console.error("Gemini API Error Detail:", JSON.stringify(errData, null, 2));

            // Create a detailed message for the client
            let detailedMessage = `Gemini API Error: ${response.status}`;
            if (errData.error) {
                // Example: [INVALID_ARGUMENT] API key not valid...
                const status = errData.error.status || errData.error.code || "UNKNOWN";
                const msg = errData.error.message || "No message";
                detailedMessage += ` [${status}]: ${msg}`;
            }

            if (response.status === 400) {
                detailedMessage = "خطأ في الطلب (Bad Request): " + (errData.error?.message || "تأكد من صحة البيانات المرسلة");
            } else if (response.status === 401 || response.status === 403) {
                return NextResponse.json({
                    error: "المفتاح غير صالح أو محظور",
                    details: "يرجى التأكد من صحة API Key في الإعدادات. قد يكون انتهت صلاحيته أو غير مفعل."
                }, { status: 401 });
            } else if (response.status === 429) {
                detailedMessage = "تم تجاوز حد الاستخدام (Quota Exceeded). يرجى الانتظار قليلاً أو ترقية الخطة.";
            }

            throw new Error(detailedMessage);
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
