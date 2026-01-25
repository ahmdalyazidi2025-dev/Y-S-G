import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeImageWithGemini(
    apiKey: string,
    imageBase64: string,
    customPrompt?: string,
    referenceImageUrl?: string
) {
    try {
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the prompt
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

        // Prepare image part
        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        const parts: any[] = [prompt, imagePart];

        // Handle Reference Image if provided
        if (referenceImageUrl) {
            try {
                // We need to fetch the image and convert to base64
                // Since this runs on client, we fetch directly.
                // Note: CORS issues might happen if the image is on a different domain not allowing CORS.
                // Ideally, this should be proxied or the image should be on the same domain/firebase storage with CORS allowed.
                const response = await fetch(referenceImageUrl);
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                // Convert to base64
                const base64Reference = Buffer.from(arrayBuffer).toString('base64');

                parts.push({
                    inlineData: {
                        data: base64Reference,
                        mimeType: blob.type || "image/jpeg"
                    }
                });

                // Add instruction about reference image
                parts[0] += `\n\nNote: A REFERENCE IMAGE has been provided. Compare the input image with this reference if helpful.`;

            } catch (refError) {
                console.warn("Failed to load reference image for Gemini:", refError);
                // Continue without reference image
            }
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // Clean up text if it contains markdown code blocks
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanedText);

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
}

export async function extractBarcodeWithGemini(
    apiKey: string,
    imageBase64: string
) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        const base64Data = imageBase64.split(',')[1] || imageBase64;
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Barcode Extraction Error:", error);
        return { found: false, code: "" };
    }
}
