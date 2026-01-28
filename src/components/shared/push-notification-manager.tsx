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

    // Foreground notification handling
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            import('firebase/messaging').then(({ getMessaging, onMessage }) => {
                const messaging = getMessaging()
                onMessage(messaging, (payload) => {
                    console.log('Foreground message received:', payload)
                    // Display a nice toast since the system won't show a notification when app is in focus
                    import('sonner').then(({ toast }) => {
                        toast.info(payload.notification?.title || payload.data?.title || "تنبيه جديد", {
                            description: payload.notification?.body || payload.data?.body || "",
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
