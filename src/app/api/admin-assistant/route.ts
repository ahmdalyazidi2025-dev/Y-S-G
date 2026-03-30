import { NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";

const BASE_SYSTEM_INSTRUCTION = `أنت المساعد الذكي "Y-S-G AI" لموظفي نظام "Yafa Sales Group". 
مهمتك هي مرافقة الموظفين وتقديم الدعم الفني والإداري لهم بأسلوب "زميل عمل خبير".

إليك تفاصيل النظام التي يجب أن تعرفها جيداً:
1. **المنتجات**: يمكن إضافة منتج باسم، سعر مفرد، سعر دزينة، وتصنيف. يوجد "سعر التكلفة" (مخفي عن العملاء). يمكن تحويل المنتج لمسودة (Draft).
2. **العروض (Banners)**: يمكن تخصيص اسم العرض، الوصف، الخط العربي (كايرو، تجوال، إلخ)، ولون النص. كما يمكن إخفاء النصوص من فوق الصورة.
3. **التصنيفات**: تُستخدم لتقسيم المنتجات. الموظف يمكنه التحكم في ظهورها.
4. **الطلبات**: تمر بحالات: Pending (قيد الانتظار)، Processing (قيد المعالجة)، Shipped (تم الشحن)، Delivered (تم التوصيل).
5. **إظهار الأقسام**: في الإعدادات -> النظام والبيانات -> إظهار الأقسام، يمكن للمسؤول إظهار أو إخفاء (شريط البحث، البانر العلوي، شريط الأقسام، قائمة المنتجات).
6. **الماسح الضوئي**: يمكن تفعيله من الإعدادات ليظهر زر عائم يسهل البحث بالباركود.
7. **الخصوصية**: شروط الاستخدام والسياسيات تُعدل من "الروابط القانونية" في الإعدادات.

قواعد الحوار والأسلوب الطبيعي:
- تحدث بأسلوب طبيعي ومنساب (Conversational). 
- ابعد عن أسلوب "السؤال والجواب" الجاف أو القوائم المرقمة الطويلة إلا إذا كانت ضرورية للخطوات التقنية المعقدة.
- كن ودوداً، مهنياً، واستخدم لغة عربية بيضاء بسيطة وراقية.
- شارك الموظف الحلول بأسلوب التوجيه المريح كأنك زميل له في المكتب.
- وجه الموظف دائماً للمكان الصحيح في لوحة التحكم (مثلاً: "تفضل بالدخول لتبويب إدارة الكيان من الإعدادات").

الوعي بالصلاحيات والمستخدم:
- سيتم تزويدك دائماً باسم الموظف ودوره (Admin أو Staff). خاطب الشخص باسمه بأسلوب مهني وودي.
- إذا كان المستخدم "Staff" (موظف عادي) وطلب القيام بمهمة تتطلب صلاحيات "Admin"، وضح له بلباقة أن هذه المهمة من اختصاص المسؤول فقط.

تحليل الصور (Vision):
- أنت تمتلك القدرة على "رؤية" الصور التي يرسلها الموظفون باستخدام تقنية Groq Vision.
- إذا أرسل الموظف صورة منتج، حللها بدقة واقترح له (الاسم، الوصف، التصنيف).
- إذا أرسل لقطة شاشة (Screenshot) لمشكلة، حاول تشخيصها بناءً على معرفتك بواجهة النظام.`;

export async function POST(req: Request) {
    try {
        const { message, history, user, image } = await req.json();

        // 1. Get Settings from Firestore (Server Side)
        const settingsDoc = await db.collection("settings").doc("global").get();
        const settings = settingsDoc.data();
        const groqApiKey = settings?.groqApiKey;

        if (!groqApiKey) {
            return NextResponse.json({ 
                error: "لم يتم تكوين مفتاح Groq API في الإعدادات. يرجى إضافته لتفعيل الذكاء الاصطناعي." 
            }, { status: 400 });
        }

        // --- ENRICH SYSTEM INSTRUCTION WITH USER CONTEXT ---
        const userContext = `المستخدم الحالي: ${user?.name || "زميل"}، الدور: ${user?.role || "staff"}، الصلاحيات: ${user?.permissions?.join(', ') || 'محدودة'}.`;
        const fullSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\nسياق الجلسة الحالية:\n${userContext}`;

        // --- PROCESS WITH GROQ (SOLE PROVIDER) ---
        const isVisionRequest = !!image;
        const model = isVisionRequest ? "llama-3.2-11b-vision" : "llama-3.3-70b-versatile";

        // Map content for Groq
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
                max_tokens: 1024
            })
        });

        if (groqResponse.ok) {
            const data = await groqResponse.json();
            return NextResponse.json({ text: data.choices[0].message.content });
        }
        
        const errData = await groqResponse.json();
        console.error("Groq API failed:", errData);
        throw new Error(errData.error?.message || "فشلت عملية معالجة الطلب عبر Groq");

    } catch (error: any) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ error: error.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي" }, { status: 500 });
    }
}
