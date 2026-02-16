"use client"

import { useEffect, useState } from "react"
import { messaging } from "@/lib/firebase"
import { getToken, onMessage } from "firebase/messaging"
import { toast } from "sonner"
import { Bell, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function NotificationManager() {
    const { currentUser, playSound } = useStore()
    const [permission, setPermission] = useState<NotificationPermission>("default")
    const [fcmToken, setFcmToken] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined" && 'Notification' in window) {
            setPermission(Notification.permission)
        }
    }, [])

    const requestPermission = async () => {
        try {
            const permissionResult = await Notification.requestPermission()
            setPermission(permissionResult)

            if (permissionResult === "granted") {
                const msg = await messaging
                if (msg) {
                    const token = await getToken(msg, {
                        vapidKey: "BLM4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ4yZ"
                    }).catch(e => {
                        console.log("Token generation failed, might need VAPID key", e)
                        return null
                    })

                    if (token) {
                        setFcmToken(token)
                        console.log("FCM Token:", token)
                        if (currentUser) {
                            toast.success("تم تفعيل الإشعارات بنجاح")
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Permission request failed", error)
            toast.error("فشل تفعيل الإشعارات")
        }
    }

    useEffect(() => {
        // Foreground message listener
        const setupListener = async () => {
            const msg = await messaging
            if (msg) {
                const unsubscribe = onMessage(msg, (payload) => {
                    console.log("Foreground Message:", payload)

                    let title = payload.notification?.title || "إشعار جديد"
                    let body = payload.notification?.body || ""

                    // 1. Hide Invoice ID Number from Title
                    title = title.replace(/(Invoice|الفاتورة)\s*#\w+/gi, "$1")

                    // 2. Privacy for Chat Messages
                    if (payload.data?.link?.includes('/chat') || title.includes('رسالة')) {
                        if (/[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(body)) {
                            body = "لديك رسالة جديدة من الإدارة 🔒"
                        }
                    }

                    let link = payload.data?.link

                    // Force link for chat messages if missing
                    if (!link && (title.includes('رسالة') || body.includes('msg'))) {
                        link = '/customer/chat'
                    }

                    const action = link ? {
                        label: "عرض",
                        onClick: () => window.location.href = link
                    } : undefined

                    toast.message(title, {
                        description: body,
                        icon: <BellRing className="w-5 h-5 text-primary" />,
                        action
                    })

                    // Play sound based on context
                    if (title.includes('طلب') || title.includes('Order') || body.includes('طلب')) {
                        playSound('newOrder')
                    } else if (title.includes('رسالة') || body.includes('msg')) {
                        playSound('newMessage')
                    } else {
                        playSound('generalPush')
                    }
                })
                return unsubscribe
            }
        }
        setupListener()
    }, [playSound])

    if (permission === 'granted' || permission === 'denied') return null

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-[#1c2a36] border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
                <div className="p-3 bg-primary/20 rounded-xl text-primary animate-pulse">
                    <Bell className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="text-white font-bold text-sm">تفعيل الإشعارات؟</h4>
                    <p className="text-slate-400 text-xs">احصل على تحديثات طلبك وعروض حصرية</p>
                </div>
                <Button size="sm" onClick={requestPermission} className="bg-primary text-white hover:bg-primary/90">
                    تفعيل
                </Button>
            </div>
        </div>
    )
}
