import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { key } = await req.json();
        if (!key) return NextResponse.json({ valid: false, error: "Missing key" }, { status: 400 });

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
        
        // Simple test call to verify key
        await model.generateContent("test");
        
        return NextResponse.json({ valid: true });
    } catch (error: any) {
        console.error("Gemini Verification Error:", error);
        return NextResponse.json({ valid: false, error: error.message || "Invalid API Key" }, { status: 401 });
    }
}
