"use client"

import { useEffect } from "react"
import { useFcmToken } from "@/hooks/use-fcm-token"
import { useStore } from "@/context/store-context"
import { doc, setDoc, arrayUnion } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { playNotificationSound } from "@/lib/sounds"
import { hapticFeedback } from "@/lib/haptics"

export function PushNotificationManager() {
    const { fcmToken, notificationPermissionStatus } = useFcmToken()
    const { currentUser } = useStore()

    useEffect(() => {
        const syncToken = async () => {
            if (fcmToken && currentUser && currentUser.id) {
                const collectionName = currentUser.role === "admin" || currentUser.role === "staff" ? "staff" : "customers"

                try {
                    const userRef = doc(db, collectionName, currentUser.id)
                    await setDoc(userRef, {
                        fcmTokens: arrayUnion(fcmToken)
                    }, { merge: true })
                    console.log("FCM Token synced for user:", currentUser.id)
                } catch (error) {
                    console.error("Failed to sync FCM token:", error)
                }
            }
        }

        syncToken()
    }, [fcmToken, currentUser])

    // Foreground notification handling
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            import('firebase/messaging').then(({ getMessaging, onMessage }) => {
                const messaging = getMessaging()
                onMessage(messaging, (payload) => {
                    console.log('Foreground message received:', payload)

                    // 1. Play Sound (using reliable base64)
                    playNotificationSound()

                    // 2. Trigger Haptics
                    hapticFeedback('success')

                    // 3. Display toast
                    import('sonner').then(({ toast }) => {
                        toast.info(payload.data?.title || payload.notification?.title || "تنبيه جديد", {
                            description: payload.data?.body || payload.notification?.body || "",
                            icon: "🔔",
                            action: payload.data?.link ? {
                                label: "عرض",
                                onClick: () => window.location.href = payload.data?.link as string
                            } : undefined
                        })
                    })
                })
            })
        }
    }, [])

    return null // Headless component
}
