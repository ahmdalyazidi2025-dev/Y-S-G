"use server"

const GROQ_API_URL = "https://api.groq.com/openai/v1"
// Stable Groq models for 2026
const TEXT_MODEL = "llama-3.3-70b-versatile"
const VISION_MODEL = "llama-3.2-11b-vision-preview"

/**
 * Verify a Groq API Key
 */
export async function verifyAIKey(apiKey: string): Promise<{ success: boolean, error?: string }> {
    const cleanedKey = apiKey?.trim() || ""
    if (!cleanedKey) return { success: false, error: "المفتاح فارغ" }

    try {
        const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${cleanedKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: TEXT_MODEL,
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 5
            }),
            cache: "no-store",
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            return { success: false, error: err.error?.message || `HTTP Error ${response.status}` }
        }

        return { success: true }
    } catch (e: any) {
        return { success: false, error: `Network Error: ${e.message}` }
    }
}

/**
 * Generate Text Response with Groq (Replaces multi-key Gemini logic)
 */
export async function generateAIResponse(
    groqKey: string,
    messages: { role: string, content: string }[]
): Promise<{ success: boolean, text?: string, error?: string }> {

    if (!groqKey) return { success: false, error: "مفتاح Groq غير متوفر" }

    try {
        const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: TEXT_MODEL,
                messages: messages,
                temperature: 0.7
            }),
            cache: "no-store"
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(errData.error?.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        const text = data.choices?.[0]?.message?.content || ""
        return { success: true, text }

    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

/**
 * Analyze Image (Vision) using Groq Llama 3.2
 */
export async function analyzeImageAI(
    groqKey: string,
    imageBase64: string,
    promptText: string
): Promise<any> {

    if (!groqKey) return { error: "Missing Groq Key" }

    try {
        const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: promptText },
                            { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } }
                        ]
                    }
                ]
            })
        })

        if (response.ok) {
            const data = await response.json()
            const text = data.choices?.[0]?.message?.content || ""
            try {
                // Strip markdown code blocks
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
                return JSON.parse(cleanJson)
            } catch {
                return { type: "unknown", raw: text }
            }
        }
    } catch (e) {
        console.warn("Groq Vision fail", e)
    }
    return { type: "unknown", error: "Groq Vision call failed" }
}

/**
 * Extract Barcode/Part Number with Groq Vision
 */
export async function extractBarcodeAI(
    groqKey: string,
    imageBase64: string
): Promise<{ found: boolean, code: string }> {

    if (!groqKey) return { found: false, code: "" }

    const prompt = `Extract the primary product barcode or automotive part number (OEM code) from the image. 
Automotive part numbers often look like '90915-YZZE1' or similar alphanumeric patterns.
Return JSON ONLY: { "found": boolean, "code": string }.`;

    try {
        const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqKey.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: VISION_MODEL,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } }
                        ]
                    }
                ],
                response_format: { type: "json_object" } // Groq supports JSON mode
            })
        })

        if (response.ok) {
            const data = await response.json()
            const text = data.choices?.[0]?.message?.content || ""
            try {
                return JSON.parse(text)
            } catch {
                return { found: false, code: "" }
            }
        }
    } catch (e) {
        console.warn("Groq Barcode fail", e)
    }
    return { found: false, code: "" }
}
