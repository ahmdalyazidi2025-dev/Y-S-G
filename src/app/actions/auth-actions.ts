"use server"

import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function requestPasswordResetAction(phone: string) {
    if (!phone) return { success: false, error: "رقم الهاتف مطلوب" }

    try {
        // 1. Find customer by phone
        const customersRef = adminDb.collection("customers")
        const snapshot = await customersRef.where("phone", "==", phone).limit(1).get()

        if (snapshot.empty) {
            return { success: false, error: "رقم الهاتف غير مسجل لدينا" }
        }

        const customerDoc = snapshot.docs[0]
        const customer = customerDoc.data()

        // 2. Create Request
        await adminDb.collection("password_requests").add({
            customerId: customerDoc.id,
            customerName: customer.name || "Unknown",
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
