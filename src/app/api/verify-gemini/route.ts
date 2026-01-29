
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "المفتاح مفقود" }, { status: 400 });
        }

        const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
        let validModel = "";

        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Test" }] }] })
            });

            if (response.ok) {
                validModel = model;
                break;
            }
        }

        if (!validModel) {
            // If all failed, return the error
            return NextResponse.json({
                success: false,
                error: "لم يتم العثور على أي نموذج مدعوم (Gemini Flash/Pro). تأكد من صحة المفتاح."
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Valid Key", model: validModel });

    } catch (error: any) {
        console.error("Internal Verification Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
