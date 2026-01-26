"use server"

// List of models to try in order of preference
const GEMINI_MODELS = [
    "gemini-1.5-flash-001", // Stable Flash (Preferred)
    "gemini-1.5-flash",     // Generic Flash
    "gemini-1.5-pro",       // Pro
    "gemini-pro",           // Legacy Pro
    "gemini-pro-vision"     // Legacy Vision (Good for images)
]

export async function verifyGeminiKey(apiKey: string) {
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    // Try to verify using the robust callGeminiAPI helper
    // This allows verification to succeed if *any* model works
    const result = await callGeminiAPI(apiKey, ["Test connection"], true)

    if (result.success) {
        return { success: true }
    }

    // If all models failed, return diagnostic info
    let errorMessage = "فشل التحقق من المفتاح"
    const msg = (result.error || "").toString().toLowerCase()

    if (msg.includes("api_key") || msg.includes("key invalid") || msg.includes("400") || msg.includes("403")) {
        errorMessage = "المفتاح غير صحيح (API Key Invalid)"
    } else if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
        try {
            await fetch("https://www.google.com", { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5000) });
            errorMessage = "السيرفر متصل بالإنترنت، لكن API جوجل محظور برمجياً أو عبر الجدار الناري.";
        } catch (netErr) {
            errorMessage = "السيرفر غير متصل بالإنترنت نهائياً (No Internet/DNS).";
        }
    } else {
        errorMessage = `خطأ غير معروف: ${result.error}`
    }

    return { success: false, error: errorMessage }
}

export async function generateGeminiResponse(apiKey: string, promptParts: any[]) {
    return callGeminiAPI(apiKey, promptParts)
}

export async function analyzeImageAction(
    apiKey: string,
    imageBase64: string,
    customPrompt?: string,
    referenceImageUrl?: string
) {
    // 1. Prepare Prompt
    let systemInstruction = `
    You are an expert automotive parts specialist. Analyze this image.
    
    If it is a CAR:
    - Identify the Make, Model, and Approximate Year.
    
    If it is a CAR PART:
    - Identify the Part Name (e.g., Oil Filter, Brake Pad).
    - If visible, extract the Part Number.
    
    If it is NEITHER or unclear:
    - Return "UNKNOWN".
    `;

    if (customPrompt) {
        systemInstruction += `\n\nIMPORTANT CUSTOM INSTRUCTION: ${customPrompt}\n`;
    }

    const prompt = `${systemInstruction}

    Format your response as a valid JSON object with these keys:
    {
        "type": "car" | "part" | "unknown",
        "title": "Short title (e.g. Toyota Camry 2023)",
        "description": "Brief description of what you see",
        "searchQuery": "Keywords to search for this item in a store"
    }
    Do not use Markdown code blocks. Just return the raw JSON.`;

    const parts: any[] = [prompt, imageBase64] // Passing base64 string directly, helper will handle it

    // Handle Reference Image
    if (referenceImageUrl) {
        try {
            const response = await fetch(referenceImageUrl);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const base64Reference = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = blob.type || "image/jpeg"

            parts.push(`data:${mimeType};base64,${base64Reference}`) // Helper handles data URI strings
            parts[0] += `\n\nNote: A REFERENCE IMAGE has been provided. Compare the input image with this reference if helpful.`;
        } catch (refError) {
            console.warn("Failed to load reference image:", refError);
        }
    }

    const result = await callGeminiAPI(apiKey, parts)

    if (result.success && result.text) {
        try {
            const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error("JSON Parse Error", e)
            return { type: "unknown", description: "Failed to parse AI response" }
        }
    }
    return { type: "unknown", description: "Connection failed" }
}

export async function extractBarcodeAction(apiKey: string, imageBase64: string) {
    const prompt = `
    Look at this image. specifically at any BARCODE or LABEL.
    Extract the alphanumeric CODE or PART NUMBER written on it or encoded in it.
    
    If you see multiple numbers, prefer the one labeled "Part Number" or "P/N" or the largest barcode text.
    
    Return JSON format:
    {
        "found": true,
        "code": "THE_EXTRACTED_CODE"
    }
    
    If no code is found, return { "found": false, "code": "" }.
    Do not use Markdown.
    `;

    const result = await callGeminiAPI(apiKey, [prompt, imageBase64])

    // FIXED: Properly handle the result logic
    if (result.success && result.text) {
        try {
            const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch (e) {
            return { found: false, code: "" }
        }
    }
    return { found: false, code: "" }
}

// Reuseable Internal Helper with Fallback Strategy
async function callGeminiAPI(apiKey: string, promptParts: any[], isVerification = false) {
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    let lastError: any = null;

    // Convert input parts to REST API format ONCE
    const payloadParts = promptParts.map((part: any) => {
        if (typeof part === 'string') {
            if (part.startsWith('data:')) {
                const split = part.split(',')
                const mimeType = split[0].match(/:(.*?);/)?.[1]
                const base64Data = split[1]

                if (mimeType && base64Data) {
                    return {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    }
                }
            }
            return { text: part }
        } else if (part.inlineData) {
            return { inlineData: part.inlineData }
        }
        return { text: String(part) }
    })

    // Try models in sequence
    for (const model of GEMINI_MODELS) {
        try {
            console.log(`Attempting Gemini Model: ${model}`)
            // Note: v1beta is standard for most, v1 is for pro. But v1beta usually works for all new ones.
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: payloadParts }]
                }),
                cache: "no-store"
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                const message = errorData.error?.message || `HTTP Error: ${response.status}`
                throw new Error(message)
            }

            const data = await response.json()

            // Verification check - short circuit if just testing connection
            if (isVerification && data.candidates) {
                return { success: true, text: "Verified" }
            }

            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
            return { success: true, text: responseText }

        } catch (error: any) {
            console.warn(`Model ${model} failed:`, error.message)
            lastError = error

            // If it's an Auth error, don't try other models (Key is wrong globally)
            const msg = error.message.toLowerCase()
            if (msg.includes("api_key") || msg.includes("invalid argument")) {
                // Sometimes 'invalid argument' is just the model name, but usually auth is 'invalid authentication'
                // Proceed to next model if it's 404 Not Found or 400 Bad Request (Model not supported)
            }
            if (msg.includes("api key") || msg.includes("unauthenticated")) {
                return { success: false, error: error.message }
            }
        }
    }

    // All models failed
    const errorMsg = lastError?.message || "Unknown Error";
    console.error("All Gemini models failed. Last error:", errorMsg)
    return { success: false, error: `All models failed. Last error: ${errorMsg}` }
}
