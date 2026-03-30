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
        const BASE_CUSTOMER_INSTRUCTION = `أنت المساعد الذكي والمتخصص لمتجر "${storeInfo}"، وهو متجر رائد في قطع غيار السيارات يخدم المحترفين (أصحاب الورش، محطات البنشر، ومحلات التجزئة).

قواعد العمل والأسلوب (B2B):
• تعامل مع العملاء كشركاء عمل (أصحاب ورش ومحترفين) وليس مجرد متسوقين عاديين.
• استخدم مصطلحات احترافية (مثل: "تصفية"، "تجهيز الورشة"، "طلب جملة"، "طلبية مخزون").
• **قاعدة VIN**: إذا كتب العميل 17 حرفاً (رقم الهيكل VIN)، قم بفك تشفيره فوراً وتحديد نوع السيارة وسنتها، ثم اقترح قطع الغيار المطابقة لها من القائمة أدناه.
• **بطاقات المنتجات**: عندما تجد تطابقاً لمنتج في القائمة، أضف هذا الرمز في نهاية ردك: [PRODUCT:معرف_المنتج] ليظهر بشكل تفاعلي.
• **الأسعار**: التزم بالأسعار المدرجة أدناه. السعر المعروض هو سعر البيع النهائي المنافس جداً للورش.
• **البيع بالجملة**: إذا طلب العميل "كرتون" أو كمية كبيرة، وضح له أن الكميات متوفرة ويمكننا التجهيز الفوري لورشته.
• **البيع المتقاطع (Cross-selling)**: كن خبيراً؛ إذا طلب فلتراً، اقترح عليه الزيت المناسب، وإذا طلب شمعات احتراق، اقترح عليه أسلاك البواجي أو المنظفات.
• إذا سأل العميل عن توفر منتج غير موجود، شجعه على إرسال صورة للبحث البصري أو رقم الهيكل VIN وسنحاول مساعدته.

**قائمة المنتجات الحالية (المرجع الفني والمالي الوحيد):**
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
