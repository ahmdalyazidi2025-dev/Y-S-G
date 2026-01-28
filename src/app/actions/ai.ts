"use server"

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1"
const MODEL_ID = "google/gemini-flash-1.5" // Low latency, free/cheap
const FALLBACK_MODEL_ID = "google/gemini-pro-1.5"

export interface AIKeyStatus {
    key: string
    status: "valid" | "invalid" | "unchecked"
}

// Helper to sanitize key (remove whitespace)
const cleanKey = (k: string) => k?.trim() || ""

/**
 * Verify a single API Key (OpenRouter)
 */
export async function verifyAIKey(apiKey: string): Promise<{ success: boolean, error?: string }> {
    const cleanedKey = cleanKey(apiKey)
    if (!cleanedKey) return { success: false, error: "المفتاح فارغ" }

    try {
        // Simple generation test
        const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${cleanedKey}`,
                "Content-Type": "application/json",
                // "HTTP-Referer": "https://your-site.com", // Optional for OpenRouter rankings
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages: [{ role: "user", content: "Test connection" }],
                max_tokens: 5
            }),
            cache: "no-store"
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            console.error("Verification Failed:", err)
            return { success: false, error: err.error?.message || `HTTP Error ${response.status}` }
        }

        return { success: true }
    } catch (e: any) {
        return { success: false, error: `Network/Server Error: ${e.message}` }
    }
}

/**
 * Generate Text Response with Multi-Key Rotation
 */
export async function generateAIResponse(
    apiKeys: AIKeyStatus[],
    messages: { role: string, content: string }[]
): Promise<{ success: boolean, text?: string, usedKeyIndex?: number, error?: string }> {

    const validKeys = apiKeys.filter(k => k.key && k.status !== "invalid")
    if (validKeys.length === 0) {
        return { success: false, error: "لا توجد مفاتيح صالحة. يرجى التحقق من الإعدادات." }
    }

    let lastError = ""

    for (let i = 0; i < validKeys.length; i++) {
        const keyObj = validKeys[i]
        const apiKey = cleanKey(keyObj.key)

        try {
            console.log(`Attempting AI Key #${i + 1}`)
            const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: MODEL_ID,
                    messages: messages
                }),
                cache: "no-store"
            })

            if (!response.ok) {
                // If 401 (Auth) or 402 (Payment), this key is bad.
                // If 429 (Rate Limit) or 5xx, maybe temporary, but still fail over.
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.error?.message || `HTTP ${response.status}`)
            }

            const data = await response.json()
            const text = data.choices?.[0]?.message?.content || ""
            return { success: true, text, usedKeyIndex: i }

        } catch (e: any) {
            console.warn(`Key #${i + 1} failed:`, e.message)
            lastError = e.message
            // Continue to next key logic is implicit loop
        }
    }

    return { success: false, error: `All keys failed. Last error: ${lastError}` }
}

/**
 * Analyze Image (Vision) with Multi-Key Rotation
 */
export async function analyzeImageAI(
    apiKeys: AIKeyStatus[],
    imageBase64: string,
    promptText: string
): Promise<any> {

    const validKeys = apiKeys.filter(k => k.key && k.status !== "invalid")
    if (validKeys.length === 0) return { error: "No valid keys" }

    for (const keyObj of validKeys) {
        try {
            const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${cleanKey(keyObj.key)}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: MODEL_ID, // Gemini Flash supports vision
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: promptText },
                                { type: "image_url", image_url: { url: imageBase64 } } // OpenRouter accepts base64 data URLs
                            ]
                        }
                    ]
                })
            })

            if (response.ok) {
                const data = await response.json()
                const text = data.choices?.[0]?.message?.content || ""
                // Try parsing JSON
                try {
                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
                    return JSON.parse(cleanJson)
                } catch {
                    return { type: "unknown", raw: text }
                }
            }
        } catch (e) {
            console.warn("Vision Key fail", e)
        }
    }
    return { type: "unknown", error: "All keys failed" }
}

/**
 * Extract Barcode/Part Number with Multi-Key Rotation
 */
export async function extractBarcodeAI(
    apiKeys: AIKeyStatus[],
    imageBase64: string
): Promise<{ found: boolean, code: string }> {

    const validKeys = apiKeys.filter(k => k.key && k.status !== "invalid")
    if (validKeys.length === 0) return { found: false, code: "" }

    const prompt = `Extract barcode/part number from image. Return JSON: { "found": boolean, "code": string }. No Markdown.`;

    for (const keyObj of validKeys) {
        try {
            const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${cleanKey(keyObj.key)}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: MODEL_ID,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                { type: "image_url", image_url: { url: imageBase64 } }
                            ]
                        }
                    ]
                })
            })

            if (response.ok) {
                const data = await response.json()
                const text = data.choices?.[0]?.message?.content || ""
                try {
                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
                    return JSON.parse(cleanJson)
                } catch {
                    continue
                }
            }
        } catch (e) {
            console.warn("Barcode Key fail", e)
        }
    }
    return { found: false, code: "" }
}
