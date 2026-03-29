import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminDb as db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // 1. Get Settings from Firestore (Server Side)
        const settingsDoc = await db.collection("settings").doc("store").get();
        const settings = settingsDoc.data();
        const apiKey = settings?.geminiApiKey;

        if (!apiKey) {
            return NextResponse.json({ 
                error: "لم يتم تكوين مفتاح Gemini API في الإعدادات. يرجى إضافته أولاً." 
            }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `أنت المساعد الذكي لموظفي نظام "Y-S-G" (Yafa Sales Group). مهمتك هي توجيه الموظفين ومساعدتهم في إدارة الموقع.

إليك تفاصيل النظام التي يجب أن تعرفها جيداً:
1. **المنتجات**: يمكن إضافة منتج باسم، سعر مفرد، سعر دزينة، وتصنيف. يوجد "سعر التكلفة" (مخفي عن العملاء). يمكن تحويل المنتج لمسودة (Draft).
2. **العروض (Banners)**: يمكن تخصيص اسم العرض، الوصف، الخط العربي (كايرو، تجوال، إلخ)، ولون النص. كما يمكن إخفاء النصوص من فوق الصورة.
3. **التصنيفات**: تُستخدم لتقسيم المنتجات. الموظف يمكنه التحكم في ظهورها.
4. **الطلبات**: تمر بحالات: Pending (قيد الانتظار)، Processing (قيد المعالجة)، Shipped (تم الشحن)، Delivered (تم التوصيل).
5. **إظهار الأقسام**: في الإعدادات -> النظام والبيانات -> إظهار الأقسام، يمكن للمسؤول إظهار أو إخفاء (شريط البحث، البانر العلوي، شريط الأقسام، قائمة المنتجات).
6. **الماسح الضوئي**: يمكن تفعيله من الإعدادات ليظهر زر عائم يسهل البحث بالباركود.
7. **الخصوصية**: شروط الاستخدام والسياسات تُعدل من "الروابط القانونية" في الإعدادات.

قواعد الرد:
- رد باللغة العربية دائماً بأسلوب مهني وودي.
- وجّه الموظف للمكان الصحيح في لوحة التحكم (مثلاً: "اذهب إلى الإعدادات ثم تبويب إدارة الكيان").
- إذا سأل الموظف عن شيء خارج مهام النظام، اعتذر بلباقة وأخبره أنك مخصص لمساعدة موظفي Y-S-G فقط.`
        }, { apiVersion: "v1" });

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ error: error.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي" }, { status: 500 });
    }
}
