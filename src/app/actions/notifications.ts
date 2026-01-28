"use server"

import Link from "next/link" // Unused, remove if strict
import * as admin from 'firebase-admin' // explicit import for types
import { adminDb, adminMessaging } from "@/lib/firebase-admin"

export async function sendPushNotification(
    userId: string | undefined,
    title: string,
    body: string,
    link: string = "/"
) {
    if (!userId) return { success: false, error: "No user ID provided" }

    try {
        // 1. Get user tokens
        // Check both 'customers' and 'staff' collections just in case, or rely on distinct collections.
        // Assuming 'customers' for now based on context.
        // 1. Get user tokens
        let collectionName = "customers"
        let userDoc = await adminDb.collection("customers").doc(userId).get()

        if (!userDoc.exists) {
            // Fallback to staff
            userDoc = await adminDb.collection("staff").doc(userId).get()
            collectionName = "staff"
        }

        const userData = userDoc.data()

        if (!userData || !userData.fcmTokens || !Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) {
            console.log(`No tokens found for user ${userId} in ${collectionName}`)
            return { success: false, error: "User has no registered devices" }
        }

        const tokens = userData.fcmTokens as string[]

        // 2. Send messages
        const message = {
            notification: {
                title,
                body,
            },
            data: {
                title,
                body,
                link,
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    body,
                    icon: '/app-icon-v2.png',
                    badge: '/app-icon-v2.png', // Small monochrome icon for status bar
                    tag: 'ysg-notification',
                    renotify: true,
                    requireInteraction: true,
                },
                fcm_options: {
                    link,
                }
            },
            android: {
                priority: 'high' as const,
                notification: {
                    icon: 'stock_ticker_update',
                }
            },
            tokens: tokens,
        }

        const response = await adminMessaging.sendEachForMulticast(message)

        if (response.successCount === 0) {
            return { success: false, error: "فشل الإرسال: لم يتم قبول الرسالة من قبل أي جهاز. تأكد من أن هاتفك مسجل." }
        }

        // 3. Cleanup invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = []
            response.responses.forEach((resp, idx: number) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx])
                }
            })

            if (failedTokens.length > 0) {
                await adminDb.collection(collectionName).doc(userId).update({
                    fcmTokens: admin.firestore.FieldValue.arrayRemove(...failedTokens)
                })
            }
        }

        return { success: true, sentCount: response.successCount }

    } catch (error) {
        console.error("Error sending push notification:", error)
        return { success: false, error: "Server error" }
    }
}

export async function broadcastPushNotification(
    title: string,
    body: string,
    link: string = "/"
) {
    try {
        const allTokens: string[] = []

        // 1. Get tokens from staff
        const staffDocs = await adminDb.collection("staff").get()
        staffDocs.forEach(doc => {
            const data = doc.data()
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                allTokens.push(...data.fcmTokens)
            }
        })

        // 2. Get tokens from customers
        const customerDocs = await adminDb.collection("customers").get()
        customerDocs.forEach(doc => {
            const data = doc.data()
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                allTokens.push(...data.fcmTokens)
            }
        })

        const uniqueTokens = Array.from(new Set(allTokens))

        if (uniqueTokens.length === 0) {
            return { success: false, error: "لا يوجد أجهزة مسجلة في النظام" }
        }

        const message = {
            notification: { title, body },
            data: { title, body, link },
            webpush: {
                notification: {
                    body,
                    icon: '/app-icon-v2.png',
                    badge: '/app-icon-v2.png',
                },
                fcm_options: { link }
            },
            tokens: uniqueTokens,
        }

        const response = await adminMessaging.sendEachForMulticast(message)

        // Cleanup invalid tokens if any
        if (response.failureCount > 0) {
            // Processing broadcast cleanup is complex, for now we log it.
            // In a production app, we'd map back and remove failed tokens.
            console.log(`Broadcast: ${response.failureCount} tokens failed delivery.`)
        }

        return { success: true, sentCount: response.successCount }

    } catch (error) {
        console.error("Broadcast Error:", error)
        return { success: false, error: "حدث خطأ في السيرفر أثناء البث" }
    }
}
