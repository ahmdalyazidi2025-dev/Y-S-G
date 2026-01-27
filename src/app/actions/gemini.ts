"use server"

const MODEL = "gemini-1.5-flash";

export async function verifyGeminiKey(rawApiKey: string) {
    const apiKey = rawApiKey?.trim()
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Test" }] }]
            }),
            cache: "no-store"
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `فشل التحقق: ${error.error?.message || response.status}`
            };
        }

        return { success: true };

    } catch (e: any) {
        return { success: false, error: `خطأ في الاتصال: ${e.message}` }
    }
}

export async function generateGeminiResponse(apiKey: string, promptParts: any[]) {
    // Helper to keep compatibility if other components use it, but standardized
    return callGeminiStandard(apiKey, promptParts)
}

export async function analyzeImageAction(apiKey: string, imageBase64: string, customPrompt?: string, referenceImageUrl?: string) {
    const systemInstruction = `You are an expert automotive parts specialist. Analyze this image. If it is a CAR, identify Make, Model, Year. If it is a PART, identify Name and Part Number. If NEITHER, return "UNKNOWN". ${customPrompt || ""}`;

    const prompt = `${systemInstruction}
    Format your response as a valid JSON:
    { "type": "car"|"part"|"unknown", "title": "...", "description": "...", "searchQuery": "..." }
    Do not use Markdown.`;

    const parts: any[] = [{ text: prompt }];

    // Handle Image
    if (imageBase64) {
        // Check if it already has header
        let cleanBase64 = imageBase64;
        let mimeType = "image/jpeg";
        if (imageBase64.includes("base64,")) {
            const split = imageBase64.split(",");
            cleanBase64 = split[1];
            mimeType = split[0].replace("data:", "").replace(";base64", "") || "image/jpeg";
        }
        parts.push({ inlineData: { mimeType, data: cleanBase64 } });
    }

    if (referenceImageUrl) {
        // Appending reference URL as text context since we want to avoid complex server-side fetching unless necessary
        // This matches the "Simplest" approach. 
        parts.push({ text: `\n\n[Reference Image]: ${referenceImageUrl}` });
    }

    const result = await callGeminiStandard(apiKey, parts);

    if (result.success && result.text) {
        try {
            const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch {
            return { type: "unknown", description: "Parse Error" };
        }
    }
    return { type: "unknown", description: "Connection failed" };
}

export async function extractBarcodeAction(apiKey: string, imageBase64: string) {
    const prompt = `Extract barcode/part number from image. Return JSON: { "found": boolean, "code": string }. No Markdown.`;

    const parts: any[] = [{ text: prompt }];
    if (imageBase64) {
        let cleanBase64 = imageBase64;
        let mimeType = "image/jpeg";
        if (imageBase64.includes("base64,")) {
            const split = imageBase64.split(",");
            cleanBase64 = split[1];
            mimeType = split[0].replace("data:", "").replace(";base64", "") || "image/jpeg";
        }
        parts.push({ inlineData: { mimeType, data: cleanBase64 } });
    }

    const result = await callGeminiStandard(apiKey, parts);

    if (result.success && result.text) {
        try {
            const cleanedText = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanedText);
        } catch { return { found: false, code: "" } }
    }
    return { found: false, code: "" }
}

// Unified Simple Fetch Function
async function callGeminiStandard(apiKey: string, contentsParts: any[]) {
    if (!apiKey) return { success: false, error: "المفتاح غير موجود" }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

        // Map simplified parts to API structure
        // 'contentsParts' here expects the array of {text:..} or {inlineData:..} directly
        // But helper callers above constructed mixed arrays. Let's standardize.
        // Actually, the callers above passed [{text:..}, {inlineData...}] which IS valid for 'parts'.

        const payload = {
            contents: [{ parts: contentsParts }]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            cache: "no-store"
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return { success: false, error: err.error?.message || "API Error" };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return { success: true, text };

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
