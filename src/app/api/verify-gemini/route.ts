import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { key } = await req.json();
        if (!key) return NextResponse.json({ valid: false, error: "Missing key" }, { status: 400 });

        const genAI = new GoogleGenerativeAI(key);
        let model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        try {
            await model.generateContent("test");
        } catch (e: any) {
            console.log("Gemini 1.5-Flash failed, trying Gemini-Pro:", e.message);
            model = genAI.getGenerativeModel({ model: "gemini-pro" });
            await model.generateContent("test");
        }
        
        return NextResponse.json({ valid: true });
    } catch (error: any) {
        console.error("Gemini Verification Error:", error);
        return NextResponse.json({ valid: false, error: error.message || "Invalid API Key" }, { status: 401 });
    }
}
