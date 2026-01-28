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
        // Use 'data' payload ONLY to force background SW handling for max customization
        const message = {
            data: {
                title,
                body,
                link,
                icon: '/app-icon-v2.png',
            },
            tokens: tokens,
        }

        const response = await adminMessaging.sendEachForMulticast(message)

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
