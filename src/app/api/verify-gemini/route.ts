import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { key } = await req.json();
        if (!key) return NextResponse.json({ valid: false, error: "Missing key" }, { status: 400 });

        const genAI = new GoogleGenerativeAI(key);
        
        // Let's try the common models first
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        let lastError = "";

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent("test");
                return NextResponse.json({ valid: true, workingModel: modelName });
            } catch (e: any) {
                lastError = e.message;
                console.log(`Model ${modelName} failed:`, e.message);
            }
        }

        // If all failed, let's try to list ANY model that might work
        try {
            console.log("All common models failed, fetching list and trying anything available...");
            // List models functionality might require specific SDK methods or REST
            // We'll trust the error for now or try one more legacy name
            const legacyModel = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            await legacyModel.generateContent("test");
            return NextResponse.json({ valid: true, workingModel: "gemini-1.0-pro" });
        } catch (e: any) {
            return NextResponse.json({ 
                valid: false, 
                error: `لم نجد أي موديل متاح لهذا المفتاح في حسابك. آخر خطأ: ${lastError}` 
            }, { status: 401 });
        }
        
        return NextResponse.json({ valid: true });
    } catch (error: any) {
        console.error("Gemini Verification Error:", error);
        return NextResponse.json({ valid: false, error: error.message || "Invalid API Key" }, { status: 401 });
    }
}
