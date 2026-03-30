import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";

const BASE_CUSTOMER_INSTRUCTION = `أنت المساعد الذكي "Y-S-G Shopping Assistant" لعملاء متجر "Yafa Sales Group". 
مهمتك هي مساعدة المتسوقين في العثور على المنتجات، تقديم نصائح التسوق، ومتابعة الطلبات بأسلوب ودود ومحترف.

إليك تفاصيل المتجر التي يجب أن تعرفها:
1. **المنتجات**: لدينا تشكيلة واسعة من (قطع الغيار، الإكسسوارات، إلخ). يمكنك مساعدة العميل في العثور على المنتج المناسب.
2. **العروض**: أخبر العملاء دائماً عن وجود عروض وخصومات حصرية في المتجر.
3. **التوصيل**: المتجر يوفر خدمة التوصل السريع لجميع المناطق.
4. **متابعة الطلبات**: إذا سأل العميل عن طلبه، أخبره أنه يمكنه مراجعة قسم "فواتيري" أو سؤالي وسأحاول مساعدته بتقديم معلومات عامة (لا تظهر أرقام سرية).

قواعد الحوار للعملاء:
- كن ودوداً جداً، مرحباً، واستخدم عبارات ترحيبية (أهلاً بك، يسعدني مساعدتك).
- تحدث بلغة عربية بسيطة وجذابة.
- إذا لم تجد منتجاً معيناً، اقترح البديل أو اطلب من العميل إرفاق صورة للبحث البصري.
- **مهم جداً**: لا تذكر أبداً "سعر التكلفة" أو أي معلومات إدارية خاصة بالموظفين.

البحث البصري (Visual Search):
- إذا أرسل العميل صورة لمنتج أو قطعة، حللها وحاول مطابقتها مع ما هو متوفر في المتجر.
- إذا لم تكن متأكداً، اقترح عليه التواصل مع الدعم الفني عبر الواتساب.`;

export async function POST(req: Request) {
    try {
        const { message, history, user, image } = await req.json();

        // 1. Get Settings from Firestore
        const settingsDoc = await db.collection("settings").doc("global").get();
        const settings = settingsDoc.data();
        const geminiApiKey = settings?.geminiApiKey;
        const groqApiKey = settings?.groqApiKey;

        if (!geminiApiKey && !groqApiKey) {
            return NextResponse.json({ 
                error: "الخدمة غير متوفرة حالياً، يرجى المحاولة لاحقاً." 
            }, { status: 400 });
        }

        // --- ENRICH SYSTEM INSTRUCTION ---
        const userContext = user?.isGuest 
            ? "العميل الحالي: ضيف (Guest)." 
            : `العميل الحالي: ${user?.name || "عميل"}, معرف المستخدم: ${user?.id || "unknown"}.`;
        const fullSystemInstruction = `${BASE_CUSTOMER_INSTRUCTION}\n\nسياق العميل:\n${userContext}`;

        // --- TRY GROQ FIRST ---
        if (groqApiKey) {
            try {
                const isVisionRequest = !!image;
                const model = isVisionRequest ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";

                const content: any[] = [{ type: "text", text: message }];
                if (image) {
                    content.push({
                        type: "image_url",
                        image_url: { url: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}` }
                    });
                }

                const groqMessages = [
                    { role: "system", content: fullSystemInstruction },
                    ...(history || []).map((h: any) => ({
                        role: h.role === "user" ? "user" : "assistant",
                        content: h.parts?.[0]?.text || h.content || ""
                    })),
                    { role: "user", content: isVisionRequest ? content : message }
                ];

                const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${groqApiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: groqMessages,
                        temperature: 0.7,
                        max_tokens: 1000
                    })
                });

                if (groqResponse.ok) {
                    const data = await groqResponse.json();
                    return NextResponse.json({ text: data.choices[0].message.content });
                }
                console.error("Groq failed for store assistant, falling back...");
            } catch (e) {
                console.error("Groq Error (Store):", e);
            }
        }

        // --- FALLBACK TO GEMINI ---
        if (geminiApiKey) {
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", systemInstruction: fullSystemInstruction });
                const chat = model.startChat({ history: history || [] });
                
                let promptParts: any[] = [message];
                if (image) {
                    const base64Data = image.split(",")[1] || image;
                    promptParts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/jpeg"
                        }
                    });
                }

                const result = await chat.sendMessage(promptParts);
                const response = await result.response;
                return NextResponse.json({ text: response.text() });
            } catch (e: any) {
                throw new Error(`AI Provider failed: ${e.message}`);
            }
        }

        throw new Error("لم نتمكن من الاتصال بمزودات الذكاء الاصطناعي");
    } catch (error: any) {
        console.error("Store Assistant Error:", error);
        return NextResponse.json({ error: error.message || "عذراً، واجهت مشكلة في فهم طلبك." }, { status: 500 });
    }
}
