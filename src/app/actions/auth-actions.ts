"use server"

import { adminDb, adminAuth } from "@/lib/firebase-admin"
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

export async function adminCreateOrUpdateUserAction(email: string, password?: string, displayName?: string) {
    if (!email) return { success: false, error: "البريد الإلكتروني مطلوب" };

    try {
        let userRecord;
        try {
            // Check if user exists
            userRecord = await adminAuth.getUserByEmail(email);
            // User exists, update password if provided
            if (password) {
                userRecord = await adminAuth.updateUser(userRecord.uid, {
                    password: password,
                    displayName: displayName || userRecord.displayName
                });
            }
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // User does not exist, create them
                userRecord = await adminAuth.createUser({
                    email: email,
                    password: password || "123456",
                    displayName: displayName
                });
            } else {
                throw error;
            }
        }

        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error("Create/Update Admin User Error:", error);
        return { success: false, error: error.message };
    }
}

export async function adminDeleteUserAction(uid: string) {
    if (!uid) return { success: false, error: "معرف المستخدم مطلوب" };
    try {
        await adminAuth.deleteUser(uid);
        return { success: true };
    } catch (error: any) {
        console.error("Delete Admin User Error:", error);
        // Do not fail entirely if user not found, they might have been deleted already.
        if (error.code !== 'auth/user-not-found') {
            return { success: false, error: error.message };
        }
        return { success: true };
    }
}
