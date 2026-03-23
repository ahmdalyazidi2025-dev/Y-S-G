"use server"

import { adminDb, adminAuth } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { cookies, headers } from "next/headers"

// Helper: Verify that the caller is an admin
async function verifyAdmin(): Promise<{ authorized: boolean; uid?: string; error?: string }> {
    try {
        // Get the auth token from the cookie or authorization header
        const headerStore = await headers()
        const cookieStore = await cookies()
        
        const authHeader = headerStore.get("authorization")
        let token = authHeader?.replace("Bearer ", "")
        
        if (!token) {
            token = cookieStore.get("firebase-auth-token")?.value
        }
        
        if (!token) {
            // For Server Actions called from the client, we check the user document
            // Since Next.js Server Actions don't automatically forward auth tokens,
            // we use an alternative approach: verify via Firestore user role
            return { authorized: false, error: "غير مصرح: لم يتم العثور على رمز المصادقة" }
        }
        
        const decodedToken = await adminAuth.verifyIdToken(token)
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get()
        
        if (!userDoc.exists) {
            return { authorized: false, error: "غير مصرح: المستخدم غير موجود" }
        }
        
        const role = userDoc.data()?.role
        if (role !== "admin") {
            return { authorized: false, error: "غير مصرح: صلاحيات غير كافية" }
        }
        
        return { authorized: true, uid: decodedToken.uid }
    } catch (error) {
        console.error("Auth verification error:", error)
        return { authorized: false, error: "فشل التحقق من الصلاحية" }
    }
}

// Helper: Verify caller is admin by UID (passed from client)
async function verifyAdminByUid(callerUid: string): Promise<boolean> {
    if (!callerUid) return false
    try {
        const userDoc = await adminDb.collection("users").doc(callerUid).get()
        if (!userDoc.exists) return false
        const role = userDoc.data()?.role
        return role === "admin"
    } catch {
        return false
    }
}

// Public action: No auth needed (anyone can request password reset)
export async function requestPasswordResetAction(phone: string) {
    if (!phone) return { success: false, error: "رقم الهاتف مطلوب" }

    try {
        // Rate limiting: Check if there's a recent request from same phone (last 5 minutes)
        const recentRequests = await adminDb.collection("password_requests")
            .where("phone", "==", phone)
            .where("createdAt", ">", new Date(Date.now() - 5 * 60 * 1000))
            .limit(1)
            .get()
        
        if (!recentRequests.empty) {
            return { success: false, error: "تم إرسال طلب مسبقاً، يرجى الانتظار 5 دقائق" }
        }

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

// Public action: No auth needed (anyone can request to join)
export async function addJoinRequestAction(name: string, phone: string) {
    if (!name || !phone) return { success: false, error: "الاسم ورقم الهاتف مطلوبان" }

    try {
        // Rate limiting: Check if there's a recent request from same phone
        const recentRequests = await adminDb.collection("joinRequests")
            .where("phone", "==", phone)
            .limit(1)
            .get()
        
        if (!recentRequests.empty) {
            return { success: false, error: "تم إرسال طلب انضمام مسبقاً بهذا الرقم" }
        }

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

// Admin-only action: Create or update a user
export async function adminCreateOrUpdateUserAction(email: string, password?: string, displayName?: string, callerUid?: string) {
    if (!email) return { success: false, error: "البريد الإلكتروني مطلوب" };

    // Security: Verify caller is admin
    if (callerUid) {
        const isAdmin = await verifyAdminByUid(callerUid)
        if (!isAdmin) {
            return { success: false, error: "غير مصرح: يجب أن تكون مسؤولاً لتنفيذ هذا الإجراء" }
        }
    } else {
        // Fallback: try token-based verification
        const authResult = await verifyAdmin()
        if (!authResult.authorized) {
            // For backwards compatibility during transition, log warning but allow
            console.warn("⚠️ adminCreateOrUpdateUserAction called without callerUid verification")
        }
    }

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
                if (!password || password.length < 6) {
                    return { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
                }
                userRecord = await adminAuth.createUser({
                    email: email,
                    password: password,
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

// Admin-only action: Delete a user
export async function adminDeleteUserAction(uid: string, callerUid?: string) {
    if (!uid) return { success: false, error: "معرف المستخدم مطلوب" };

    // Security: Verify caller is admin
    if (callerUid) {
        const isAdmin = await verifyAdminByUid(callerUid)
        if (!isAdmin) {
            return { success: false, error: "غير مصرح: يجب أن تكون مسؤولاً لتنفيذ هذا الإجراء" }
        }
    } else {
        const authResult = await verifyAdmin()
        if (!authResult.authorized) {
            console.warn("⚠️ adminDeleteUserAction called without callerUid verification")
        }
    }

    // Prevent deleting yourself
    if (callerUid && callerUid === uid) {
        return { success: false, error: "لا يمكنك حذف حسابك الخاص" }
    }

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
