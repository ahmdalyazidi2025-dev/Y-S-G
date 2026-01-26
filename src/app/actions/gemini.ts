"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

export async function verifyGeminiKey(apiKey: string) {
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Simple generation test
        await model.generateContent("Test connection")

        return { success: true }
    } catch (error: any) {
        console.error("Server-Side Gemini Verification Error:", error)

        let errorMessage = "فشل التحقق من المفتاح"
        const msg = error.toString().toLowerCase()

        if (msg.includes("api_key") || msg.includes("400") || msg.includes("403")) {
            errorMessage = "المفتاح غير صحيح (API Key Invalid)"
        } else if (msg.includes("fetch") || msg.includes("network")) {
            try {
                // Test basic connectivity
                await fetch("https://www.google.com", { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5000) });
                errorMessage = "سيرفرك متصل بالإنترنت، لكنه محظور من الوصول لـ Gemini API specifically.";
            } catch (netErr) {
                errorMessage = "سيرفرك (جهازك) غير متصل بالإنترنت أو يواجه مشاكل DNS حادة.";
            }
        } else if (msg.includes("quota")) {
            errorMessage = "تم تجاوز حد الاستخدام (Quota Exceeded)"
        }

        return { success: false, error: errorMessage }
    }
}

export async function generateGeminiResponse(
    apiKey: string,
    promptParts: any[]
) {
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const result = await model.generateContent(promptParts)
        const responseText = result.response.text()

        return { success: true, text: responseText }
    } catch (error: any) {
        console.error("Server-Side Gemini Generation Error:", error)
        return { success: false, error: "حدث خطأ أثناء الاتصال بالمساعد الذكي" }
    }
}
