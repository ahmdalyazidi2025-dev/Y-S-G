"use client"

import { useEffect, useState } from 'react'
import { getMessaging, getToken } from 'firebase/messaging'
import { app } from '@/lib/firebase'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export const useFcmToken = () => {
    const [token, setToken] = useState<string | null>(null)
    const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>('default')

    useEffect(() => {
        const retrieveToken = async () => {
            try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    const messaging = getMessaging(app)

                    // Retrieve current permission status
                    const permission = await Notification.requestPermission()
                    setNotificationPermissionStatus(permission)

                    if (permission === 'granted') {
                        // Wait for service worker to be ready
                        await navigator.serviceWorker.ready;
                        const registration = await navigator.serviceWorker.getRegistration();

                        if (!VAPID_KEY) {
                            console.warn("VAPID Key is missing in .env (NEXT_PUBLIC_FIREBASE_VAPID_KEY). Notification token cannot be retrieved.")
                            return
                        }

                        const currentToken = await getToken(messaging, {
                            vapidKey: VAPID_KEY,
                            serviceWorkerRegistration: registration, // Use our unified SW
                        })

                        if (currentToken) {
                            setToken(currentToken)
                        } else {
                            console.log('No registration token available. Request permission to generate one.')
                        }
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error)
            }
        }

        retrieveToken()
    }, [])

    return { fcmToken: token, notificationPermissionStatus }
}
