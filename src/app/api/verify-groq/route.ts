import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { key } = await req.json();
        if (!key) return NextResponse.json({ valid: false, error: "Missing key" }, { status: 400 });

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: "test" }],
                max_tokens: 5
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Invalid API Key");
        }

        return NextResponse.json({ valid: true });
    } catch (error: any) {
        console.error("Groq Verification Error:", error);
        return NextResponse.json({ valid: false, error: error.message || "Invalid API Key" }, { status: 401 });
    }
}
