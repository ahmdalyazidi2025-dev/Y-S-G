'use server'

import { adminDb } from "@/lib/firebase-admin";

export async function submitJoinRequest(name: string, phone: string) {
    try {
        if (!name || !phone) {
            return { success: false, error: "الاسم ورقم الهاتف مطلوبان" };
        }

        const docRef = await adminDb.collection("joinRequests").add({
            name,
            phone,
            createdAt: new Date(), // Firebase Admin handles native Date objects
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Submit Join Request Error:", error);
        return { success: false, error: "حدث خطأ أثناء إرسال الطلب" };
    }
}
