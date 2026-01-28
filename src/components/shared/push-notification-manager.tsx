"use client"

import { useEffect } from "react"
import { useFcmToken } from "@/hooks/use-fcm-token"
import { useStore } from "@/context/store-context"
import { doc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function PushNotificationManager() {
    const { fcmToken, notificationPermissionStatus } = useFcmToken()
    const { currentUser } = useStore()

    useEffect(() => {
        const syncToken = async () => {
            if (fcmToken && currentUser && currentUser.id) {
                // Determine collection based on role
                const collectionName = currentUser.role === "admin" || currentUser.role === "staff" ? "staff" : "customers"

                try {
                    const userRef = doc(db, collectionName, currentUser.id)
                    await updateDoc(userRef, {
                        fcmTokens: arrayUnion(fcmToken)
                    })
                    console.log("FCM Token synced for user:", currentUser.id)
                } catch (error) {
                    console.error("Failed to sync FCM token:", error)
                }
            }
        }

        syncToken()
    }, [fcmToken, currentUser])

    return null // Headless component
}
