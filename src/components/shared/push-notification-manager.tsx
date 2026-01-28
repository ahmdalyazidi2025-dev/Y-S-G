"use client"

import { useEffect } from "react"
import { useFcmToken } from "@/hooks/use-fcm-token"
import { useStore } from "@/context/store-context"
import { doc, setDoc, arrayUnion } from "firebase/firestore"
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

                    // 1. Play Sound
                    try {
                        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTpvT18AAAAAAAD//w=="); // Empty tiny wav as placeholder? 
                        // Better: reuse playSound from store-context if possible, but this is a standalone component.
                        // I will use a simple notification sound.
                        const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                        sound.volume = 0.5;
                        sound.play().catch(() => { });
                    } catch (e) { }

                    // 2. Display toast
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
