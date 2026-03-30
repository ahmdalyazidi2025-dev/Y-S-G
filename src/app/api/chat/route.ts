import { NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";

const BASE_CUSTOMER_INSTRUCTION = `أنت المساعد الذكي "Y-S-G Shopping Assistant" لعملاء متجر "Yafa Sales Group". 
مهمتك هي مساعدة المتسوقين في العثور على المنتجات، تقديم نصائح التسوق، ومتابعة الطلبات بأسلوب ودود ومحترف.

إليك تفاصيل المتجر التي يجب أن تعرفها:
1. **المنتجات**: لدينا تشكيلة واسعة من (قطع الغيار، الإكسسوارات، إلخ). يمكنك مساعدة العميل في العثور على المنتج المناسب.
2. **العروض**: أخبر العملاء دائماً عن وجود عروض وخصومات حصرية في المتجر.
3. **التوصيل**: المتجر يوفر خدمة التوصل السريع لجميع المناطق.
4. **متابعة الطلبات**: إذا سأل العميل عن طلبه، أخبره أنه يمكنه مراجعة قسم "فواتيري" أو سؤالي وسأحاول مساعدته بتقديم معلومات عامة.

قواعد الحوار للعملاء:
- كن ودوداً جداً، مرحباً، واستخدم عبارات ترحيبية (أهلاً بك، يسعدني مساعدتك).
- تحدث بلغة عربية بسيطة وجذابة.
- إذا لم تجد منتجاً معيناً، اقترح البديل أو اطلب من العميل إرفاق صورة للبحث البصري.
- **مهم جداً**: لا تذكر أبداً "سعر التكلفة" أو أي معلومات إدارية خاصة بالموظفين.

البحث البصري (Visual Search):
- أنت تستخدم تقنية Groq Vision المتطورة لتحليل الصور.
- إذا أرسل العميل صورة لمنتج أو قطعة، حللها وحاول مطابقتها مع ما هو متوفر في المتجر.
- إذا لم تكن متأكداً، اقترح عليه التواصل مع الدعم الفني عبر الواتساب.`;

export async function POST(req: Request) {
    try {
        const { message, history, user, image } = await req.json();

        // 1. Get Settings from Firestore (Server Side)
        const settingsDoc = await db.collection("settings").doc("global").get();
        const settings = settingsDoc.data();
        const groqApiKey = settings?.groqApiKey;

        if (!groqApiKey) {
            return NextResponse.json({ 
                error: "نعتذر، نظام المساعدة الذكي غير متاح حالياً. يرجى المحاولة لاحقاً." 
            }, { status: 400 });
        }

        // --- ENRICH SYSTEM INSTRUCTION ---
        const userContext = user?.isGuest 
            ? "العميل الحالي: ضيف (Guest)." 
            : `العميل الحالي: ${user?.name || "عميل"}, معرف المستخدم: ${user?.id || "unknown"}.`;
        const fullSystemInstruction = `${BASE_CUSTOMER_INSTRUCTION}\n\nسياق العميل:\n${userContext}`;

        // --- PROCESS WITH GROQ ---
        const isVisionRequest = !!image;
        const model = isVisionRequest ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";

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

        const errData = await groqResponse.json();
        console.error("Groq API failed (Customer):", errData);
        throw new Error(errData.error?.message || "فشل مزود الخدمة الذكية");

    } catch (error: any) {
        console.error("Store Assistant Error:", error);
        return NextResponse.json({ error: error.message || "عذراً، واجهت مشكلة في فهم طلبك." }, { status: 500 });
    }
}
