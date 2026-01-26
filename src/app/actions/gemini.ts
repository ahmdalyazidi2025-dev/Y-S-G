"use server"

// List of models to try in order of preference
const GEMINI_MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro"
]

export async function verifyGeminiKey(apiKey: string) {
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    // 1. Try standard generation verify
    const result = await callGeminiAPI(apiKey, ["Test connection"], true)
    if (result.success) return { success: true }

    // 2. Deep Diagnostic: List Available Models
    let diagnosticMsg = ""
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        const listResponse = await fetch(listUrl, { method: "GET", cache: "no-store" })

        if (listResponse.ok) {
            const data = await listResponse.json()
            const availableModels = (data.models || [])
                .map((m: any) => m.name.replace("models/", ""))
                .filter((n: string) => n.includes("gemini"))

            if (availableModels.length > 0) {
                diagnosticMsg = ` ✅ الاتصال ناجح ولكن الموديل غير مدعوم. الموديلات المتاحة لك هي: ${availableModels.join(", ")}`
            } else {
                diagnosticMsg = " ⚠️ الاتصال ناجح ولكن لا توجد موديلات متاحة لهذا المفتاح."
            }
        } else {
            // If listing fails, check internet
            try {
                await fetch("https://www.google.com", { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(3000) });
                diagnosticMsg = " ❌ السيرفر متصل بالنت، ولكن جوجل ترفض الطلب (403/404)."
            } catch {
                diagnosticMsg = " ❌ السيرفر غير متصل بالإنترنت (Network Blocked)."
            }
        }
    } catch (e: any) {
        diagnosticMsg = ` ❌ خطأ في فحص الموديلات: ${e.message}`
    }

    // Return the detailed error
    return {
        success: false,
        error: `فشل التفعيل. ${result.error?.split(':')[1] || result.error || ""}. ${diagnosticMsg}`
    }
}

export async function generateGeminiResponse(apiKey: string, promptParts: any[]) {
    return callGeminiAPI(apiKey, promptParts)
}

export async function analyzeImageAction(apiKey: string, imageBase64: string, customPrompt?: string, referenceImageUrl?: string) {
    let systemInstruction = `You are an expert automotive parts specialist. Analyze this image. If it is a CAR, identify Make, Model, Year. If it is a PART, identify Name and Part Number. If NEITHER, return "UNKNOWN".`;
    if (customPrompt) systemInstruction += `\n\n${customPrompt}`;

    const prompt = `${systemInstruction}
    Format your response as a valid JSON:
    { "type": "car"|"part"|"unknown", "title": "...", "description": "...", "searchQuery": "..." }
    Do not use Markdown.`;

    const parts: any[] = [prompt, imageBase64]

    if (referenceImageUrl) {
        try {
            const response = await fetch(referenceImageUrl);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const base64Reference = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = blob.type || "image/jpeg"
            parts.push(`data:${mimeType};base64,${base64Reference}`)
            parts[0] += `\n\nReference Image Provided.`;
        } catch (refError) {
            console.warn("Ref image failed", refError)
        }
    }

    const result = await callGeminiAPI(apiKey, parts)

    if (result.success && result.text) {
        try {
            const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (e) {
            return { type: "unknown", description: "Parse Error" }
        }
    }
    return { type: "unknown", description: "Connection failed" }
}

export async function extractBarcodeAction(apiKey: string, imageBase64: string) {
    const prompt = `Extract barcode/part number from image. Return JSON: { "found": boolean, "code": string }. No Markdown.`;
    const result = await callGeminiAPI(apiKey, [prompt, imageBase64])

    if (result.success && result.text) {
        try {
            const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch { return { found: false, code: "" } }
    }
    return { found: false, code: "" }
}

async function callGeminiAPI(apiKey: string, promptParts: any[], isVerification = false) {
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    // Prepare payload
    const payloadParts = promptParts.map((part: any) => {
        if (typeof part === 'string') {
            if (part.startsWith('data:')) {
                const split = part.split(',')
                const mimeType = split[0].match(/:(.*?);/)?.[1]
                const base64Data = split[1]
                if (mimeType && base64Data) return { inlineData: { mimeType, data: base64Data } }
            }
            return { text: part }
        } else if (part.inlineData) return { inlineData: part.inlineData }
        return { text: String(part) }
    })

    let lastError: any = null;

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: payloadParts }] }),
                cache: "no-store"
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error?.message || `HTTP ${response.status}`)
            }

            const data = await response.json()
            if (isVerification && data.candidates) return { success: true, text: "Verified" }

            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
            return { success: true, text: responseText }

        } catch (error: any) {
            console.warn(`Model ${model} failed:`, error.message)
            lastError = error.message
            if (error.message.toLowerCase().includes("api key")) break; // Don't retry auth errors
        }
    }

    return { success: false, error: lastError || "All models failed" }
}
