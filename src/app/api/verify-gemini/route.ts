
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "المفتاح مفقود" }, { status: 400 });
        }

        // Strategy: List available models to verify key permissions and find the correct model name
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listResponse = await fetch(listUrl, { method: "GET" });

        if (!listResponse.ok) {
            const errorData = await listResponse.json().catch(() => ({}));
            console.error("Gemini List Models Error:", errorData);

            const status = errorData.error?.status || listResponse.status;
            const message = errorData.error?.message || "Unknown Error";

            if (status === 'PERMISSION_DENIED' || status === 403) {
                return NextResponse.json({
                    success: false,
                    error: "صلاحيات مرفوضة (403). تأكد من تفعيل خدمة 'Generative Language API' في Google Cloud Console لهذا المفتاح."
                }, { status: 400 });
            }
            if (status === 'INVALID_ARGUMENT' || status === 400) {
                return NextResponse.json({
                    success: false,
                    error: "المفتاح غير صحيح (Invalid Key)."
                }, { status: 400 });
            }

            return NextResponse.json({
                success: false,
                error: `خطأ من جوجل (${status}): ${message}`
            }, { status: 400 });
        }

        const data = await listResponse.json();
        const models = data.models || [];

        // Look for any Flash model
        const flashModel = models.find((m: any) => m.name.includes("gemini-1.5-flash"));
        const proModel = models.find((m: any) => m.name.includes("gemini-pro"));
        const anyGemini = models.find((m: any) => m.name.includes("gemini"));

        const validModel = flashModel?.name || proModel?.name || anyGemini?.name;

        if (!validModel) {
            return NextResponse.json({
                success: false,
                error: "المفتاح صحيح، ولكن لا يوجد أي موديل Gemini متاح لهذا الحساب."
            }, { status: 400 });
        }

        // Clean model name (remove 'models/' prefix if present for cleaner usage later if needed)
        // ensure we return just the ID if possible, but the API usually expects 'models/gemini-...' or just 'gemini-...'
        // simpler to keep full name from list response 'models/gemini-1.5-flash-001'

        return NextResponse.json({ success: true, message: `Valid! Found: ${validModel}`, model: validModel });

    } catch (error: any) {
        console.error("Internal Verification Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
