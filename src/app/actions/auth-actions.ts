"use server"

import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function requestPasswordResetAction(phone: string) {
    if (!phone) return { success: false, error: "رقم الهاتف مطلوب" }

    try {
        // 1. Find customer by phone (attempt)
        const customersRef = adminDb.collection("customers")
        const snapshot = await customersRef.where("phone", "==", phone).limit(1).get()

        let customerId = "unknown"
        let customerName = "عميل غير محدد (سيتم مطابقته من قبل الإدارة)"

        if (!snapshot.empty) {
            const customerDoc = snapshot.docs[0]
            const customer = customerDoc.data()
            customerId = customerDoc.id
            customerName = customer.name || "Unknown"
        }

        // 2. Create Request regardless of whether they were found exactly
        await adminDb.collection("password_requests").add({
            customerId: customerId,
            customerName: customerName,
            phone: phone,
            status: "pending",
            createdAt: FieldValue.serverTimestamp()
        })

        return { success: true }

    } catch (error) {
        console.error("Password Request Action Error:", error)
        return { success: false, error: "حدث خطأ في الخادم" }
    }
}

export async function addJoinRequestAction(name: string, phone: string) {
    if (!name || !phone) return { success: false, error: "الاسم ورقم الهاتف مطلوبان" }

    try {
        await adminDb.collection("joinRequests").add({
            name,
            phone,
            createdAt: FieldValue.serverTimestamp()
        })
        return { success: true }
    } catch (error) {
        console.error("Add Join Request Error:", error)
        return { success: false, error: "حدث خطأ أثناء إرسال الطلب" }
    }
}
