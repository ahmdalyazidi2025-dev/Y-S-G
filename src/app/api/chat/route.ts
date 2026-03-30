import { NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { message, history, user, image } = await req.json();

        // 1. Get Settings + Products from Firestore (Server Side)
        const [settingsDoc, productsSnap] = await Promise.all([
            db.collection("settings").doc("global").get(),
            db.collection("products").where("isDraft", "==", false).limit(80).get()
        ]);

        const settings = settingsDoc.data();
        const groqApiKey = settings?.groqApiKey;

        if (!groqApiKey) {
            return NextResponse.json({ 
                error: "نعتذر، نظام المساعدة الذكية غير متاح حالياً. يرجى التواصل مع الإدارة." 
            }, { status: 400 });
        }

        // 2. Build product catalog string for AI context
        const productList = productsSnap.docs
            .map(d => { const p = d.data(); return `- ${p.name}: ${p.pricePiece ?? p.price ?? 0} ر.س للحبة${p.priceDozen ? ` / ${p.priceDozen} ر.س للدستة` : ''}` })
            .join('\n');

        // 3. Build the system instruction with REAL product data
        const storeInfo = settings?.aboutTitle || "Yafa Sales Group";
        const BASE_CUSTOMER_INSTRUCTION = `أنت مساعد متجر ذكي لـ ${storeInfo} وهو متخصص في بيع قطع غيار السيارات.

قواعد صارمة لا تحيد عنها:
• لا تخترع أسعاراً أبداً. الأسعار الحقيقية واضحة أدناه فقط.
• لا تذكر سعراً لمنتج غير موجود في القائمة. قل "لا أعرف سعره حالياً"
• لا تذكر سعر التكلفة أبداً.
• إذا سأل العميل عن سعر منتج غير موجود: "هذا المنتج ليس في قائمة المتجر حالياً"
• كن ودوداً ومحترفاً بلغة عربية بسيطة.
• إذا أرسل صورة لقطعة غيار، حللها وابحث عن اسمها في القائمة أدناه.

**قائمة منتجات المتجر وأسعارها (هذه هي الأسعار الحقيقية الوحيدة المسموح لك بذكرها):**
${productList || "لا توجد منتجات متاحة حالياً"}`;

        // 4. Enrich with user context
        const userContext = user?.isGuest 
            ? "العميل الحالي: ضيف (Guest)." 
            : `العميل الحالي: ${user?.name || "عميل"}.`;
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
