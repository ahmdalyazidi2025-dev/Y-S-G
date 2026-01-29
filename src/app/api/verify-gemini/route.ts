
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ success: false, error: "المفتاح مفقود" }, { status: 400 });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Test" }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Gemini Verification Error:", errorData);

            return NextResponse.json({
                success: false,
                error: errorData.error?.message || "المفتاح غير صالح أو انتهت صلاحيته"
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Valid Key" });

    } catch (error: any) {
        console.error("Internal Verification Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
