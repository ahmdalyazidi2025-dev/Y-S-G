"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, getDocs, where, limit } from "firebase/firestore"
import { toast } from "sonner"
import { Message, Notification, ProductRequest, JoinRequest, PasswordRequest } from "@/types/store"
import { sanitizeData, toDate } from "@/lib/utils/store-helpers"
import { useCustomers } from "./customer-context"
import { useAuth } from "./auth-context"

interface CommunicationContextType {
    messages: Message[]
    notifications: Notification[]
    productRequests: ProductRequest[]
    joinRequests: JoinRequest[]
    passwordRequests: PasswordRequest[]
    sendMessage: (text: string, isAdmin: boolean, userId: string, userName?: string, link?: string, linkTitle?: string, image?: string, isSystemNotification?: boolean) => Promise<void>
    markNotificationsRead: (userId: string) => Promise<void>
    markNotificationRead: (id: string) => Promise<void>
    addProductRequest: (request: Omit<ProductRequest, "id" | "status" | "createdAt">) => Promise<void>
    updateProductRequestStatus: (id: string, status: ProductRequest["status"]) => Promise<void>
    deleteProductRequest: (id: string) => Promise<void>
    addJoinRequest: (name: string, phone: string) => Promise<void>
    deleteJoinRequest: (id: string) => Promise<void>
    resolvePasswordRequest: (id: string) => Promise<void>
    requestPasswordReset: (phone: string) => Promise<{ success: boolean; message: string }>
    broadcastNotification: (text: string) => void
    markMessagesRead: (userId?: string, isAdmin?: boolean) => Promise<void>
    broadcastToCategory: (category: string, text: string) => void
    markAllNotificationsRead: (userId: string) => Promise<void>
    sendNotificationToGroup: (groupId: string, title: string, body: string, link?: string) => Promise<void>
    sendGlobalMessage: (text: string, link?: string, linkTitle?: string) => Promise<void>
    sendNotification: (params: { userId: string, title: string, body: string, link?: string, type?: string }) => Promise<void>
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined)

export function CommunicationProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
    const [passwordRequests, setPasswordRequests] = useState<PasswordRequest[]>([])

    useEffect(() => {
        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff'
        const userId = currentUser?.id || "guest"

        // Messages Listener
        let msgQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(100))
        if (!isAdmin) {
            // REMOVED orderBy and limit to avoid index requirement
            msgQuery = query(collection(db, "messages"), where("userId", "==", userId))
        }
        const unsubMessages = onSnapshot(msgQuery, (snap) => {
            const docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Message))
            if (!isAdmin) {
                // Client-side sort and limit
                docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                setMessages(docs.slice(0, 100))
            } else {
                setMessages(docs)
            }
        })

        // Notifications Listener
        let notifQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(50))
        if (!isAdmin) {
            // REMOVED orderBy and limit
            notifQuery = query(collection(db, "notifications"), where("userId", "==", userId))
        }
        const unsubNotifications = onSnapshot(notifQuery, (snap) => {
            const docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Notification))
            if (!isAdmin) {
                // Client-side sort and limit
                docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                setNotifications(docs.slice(0, 50))
            } else {
                setNotifications(docs)
            }
        })

        const unsubRequests = onSnapshot(query(collection(db, "requests"), orderBy("createdAt", "desc")), (snap) => {
            setProductRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as ProductRequest)))
        })
        const unsubJoin = onSnapshot(query(collection(db, "joinRequests"), orderBy("createdAt", "desc")), (snap) => {
            setJoinRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as JoinRequest)))
        })
        const unsubPassword = onSnapshot(query(collection(db, "password_requests"), orderBy("createdAt", "desc")), (snap) => {
            setPasswordRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as PasswordRequest)))
        })

        return () => {
            unsubMessages(); unsubNotifications(); unsubRequests(); unsubJoin(); unsubPassword()
        }
    }, [currentUser])

    const sendMessage = async (text: string, isAdmin: boolean, userId: string, userName: string = "عميل", link?: string, linkTitle?: string, image?: string, isSystemNotification?: boolean) => {
        await addDoc(collection(db, "messages"), sanitizeData({
            senderId: isAdmin ? "admin" : userId,
            senderName: isAdmin ? "الإدارة" : userName,
            text, isAdmin, read: false, userId, link, linkTitle, image, isSystemNotification, createdAt: Timestamp.now()
        }))
    }


    const markNotificationsRead = async (userId: string) => {
        const unread = notifications.filter(n => n.userId === userId && !n.read)
        const batch = unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }))
        await Promise.all(batch)
    }

    const addProductRequest = async (request: Omit<ProductRequest, "id" | "status" | "createdAt">) => {
        await addDoc(collection(db, "requests"), sanitizeData({ ...request, status: "pending", createdAt: Timestamp.now() }))
        toast.success("تم إرسال طلبك")
    }

    const updateProductRequestStatus = async (id: string, status: ProductRequest["status"]) => {
        await updateDoc(doc(db, "requests", id), { status })
    }

    const deleteProductRequest = async (id: string) => {
        await deleteDoc(doc(db, "requests", id))
    }

    const addJoinRequest = async (name: string, phone: string) => {
        await addDoc(collection(db, "joinRequests"), sanitizeData({ name, phone, createdAt: Timestamp.now() }))
        toast.success("تم إرسال طلب الانضمام")
    }

    const deleteJoinRequest = async (id: string) => {
        await deleteDoc(doc(db, "joinRequests", id))
    }

    const resolvePasswordRequest = async (id: string) => {
        await deleteDoc(doc(db, "password_requests", id))
        toast.success("تم إغلاق الطلب")
    }

    const broadcastNotification = (text: string) => {
        toast.info(text, { duration: 5000, icon: "🔔" })
    }

    const markMessagesRead = async (userId?: string, isAdminView = false) => {
        if (!userId) return
        const unread = messages.filter(m => (isAdminView ? (m.senderId === userId && !m.isAdmin) : (m.userId === userId && m.isAdmin)) && !m.read)
        const batch = unread.map(m => updateDoc(doc(db, "messages", m.id), { read: true }))
        await Promise.all(batch)
    }

    const broadcastToCategory = (category: string, text: string) => {
        toast.info(`بث إلى فئة ${category}: ${text}`, { icon: "📢" })
    }

    const markAllNotificationsRead = async (userId: string) => {
        const unread = notifications.filter(n => n.userId === userId && !n.read)
        const batch = unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true }))
        await Promise.all(batch)
    }

    const requestPasswordReset = async (phone: string) => {
        try {
            const { requestPasswordResetAction } = await import("@/app/actions/auth-actions")
            const result = await requestPasswordResetAction(phone)
            if (!result.success) {
                const msg = result.error || "حدث خطأ، حاول مرة أخرى"
                toast.error(msg)
                return { success: false, message: msg }
            }
            const msg = "تم إرسال طلبك للإدارة، سيتم التواصل معك قريباً"
            toast.success(msg)
            return { success: true, message: msg }
        } catch (error) {
            console.error("Password Request Error:", error)
            toast.error("حدث خطأ، حاول مرة أخرى")
            return { success: false, message: "حدث خطأ غير متوقع" }
        }
    }

    const sendNotificationToGroup = async (groupId: string, title: string, body: string, link?: string) => {
        try {
            const { broadcastPushNotification } = await import("@/app/actions/notifications")
            if (groupId === "all") {
                await broadcastPushNotification(title, body, link)
            }
            toast.success("تم إرسال الإشعار بنجاح")
        } catch (error) {
            console.error("Error sending notification:", error)
            toast.error("حدث خطأ أثناء إرسال الإشعار")
        }
    }

    const sendNotification = async ({ userId, title, body, link, type }: { userId: string, title: string, body: string, link?: string, type?: string }) => {
        try {
            const { sendPushNotification } = await import("@/app/actions/notifications")
            await sendPushNotification(userId, title, body, link)
            toast.success("تم إرسال الإشعار بنجاح")
        } catch (error) {
            console.error("Error sending notification:", error)
            toast.error("حدث خطأ أثناء إرسال الإشعار")
        }
    }




    const { customers } = useCustomers()

    const sendGlobalMessage = async (text: string, link?: string, linkTitle?: string) => {
        try {
            const batch = customers.map(async (c) => {
                await addDoc(collection(db, "messages"), sanitizeData({
                    senderId: "admin",
                    senderName: "الإدارة",
                    text: link ? `${text}\n\n[${linkTitle || 'عرض'}](${link})` : text,
                    isAdmin: true,
                    read: false,
                    userId: c.id,
                    createdAt: Timestamp.now()
                }))
            })
            await Promise.all(batch)
            toast.success("تم إرسال الرسالة للجميع")
        } catch (error) {
            toast.error("حدث خطأ أثناء الإرسال الجماعي")
        }
    }

    const markNotificationRead = async (id: string) => {
        await updateDoc(doc(db, "notifications", id), { read: true })
    }

    return (
        <CommunicationContext.Provider value={{
            messages, notifications, productRequests, joinRequests, passwordRequests,
            sendMessage, markNotificationsRead, markNotificationRead, addProductRequest, updateProductRequestStatus, deleteProductRequest, addJoinRequest, deleteJoinRequest, resolvePasswordRequest, requestPasswordReset,
            broadcastNotification, markMessagesRead, broadcastToCategory, markAllNotificationsRead, sendNotificationToGroup, sendGlobalMessage, sendNotification
        }}>
            {children}
        </CommunicationContext.Provider>
    )
}

export const useCommunication = () => {
    const context = useContext(CommunicationContext)
    if (!context) throw new Error("useCommunication must be used within CommunicationProvider")
    return context
}
