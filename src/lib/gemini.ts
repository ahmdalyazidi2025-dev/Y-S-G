import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeImageWithGemini(apiKey: string, imageBase64: string) {
    try {
        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the prompt
        const prompt = `
        You are an expert automotive parts specialist. Analyze this image.
        
        If it is a CAR:
        - Identify the Make, Model, and Approximate Year.
        
        If it is a CAR PART:
        - Identify the Part Name (e.g., Oil Filter, Brake Pad).
        - If visible, extract the Part Number.
        
        If it is NEITHER or unclear:
        - Return "UNKNOWN".

        Format your response as a valid JSON object with these keys:
        {
            "type": "car" | "part" | "unknown",
            "title": "Short title (e.g. Toyota Camry 2023)",
            "description": "Brief description of what you see",
            "searchQuery": "Keywords to search for this item in a store"
        }
        Do not use Markdown code blocks. Just return the raw JSON.
        `;

        // Prepare image part
        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = imageBase64.split(',')[1] || imageBase64;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
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
