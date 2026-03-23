"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, getDocs, where, limit, writeBatch, getCountFromServer } from "firebase/firestore"
import { toast } from "sonner"
import { Message, Notification, ProductRequest, JoinRequest, PasswordRequest } from "@/types/store"
import { sanitizeData, toDate } from "@/lib/utils/store-helpers"
import { useCustomers } from "./customer-context"
import { useAuth } from "./auth-context"
import { useSettings } from "./settings-context"

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
    deleteProductRequests: (ids: string[]) => Promise<void>
    addJoinRequest: (name: string, phone: string) => Promise<void>
    deleteJoinRequest: (id: string) => Promise<void>
    resolvePasswordRequest: (id: string) => Promise<void>
    requestPasswordReset: (phone: string) => Promise<{ success: boolean; message: string }>
    broadcastNotification: (text: string) => void
    markMessagesRead: (userId?: string, isAdmin?: boolean, isSystem?: boolean) => Promise<void>
    broadcastToCategory: (category: string, text: string) => void
    markAllNotificationsRead: (userId: string) => Promise<void>
    sendNotificationToGroup: (groupId: string, title: string, body: string, link?: string) => Promise<void>
    sendGlobalMessage: (text: string, link?: string, linkTitle?: string) => Promise<void>
    sendNotification: (params: { userId: string, title: string, body: string, link?: string, type?: string }) => Promise<void>
    deleteAllChatsAndNotifications: (onProgress?: (progress: number, status: string) => void) => Promise<void>
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined)

export function CommunicationProvider({ children }: { children: React.ReactNode }) {
    const { currentUser, guestId } = useAuth()
    const [messages, setMessages] = useState<Message[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
    const [passwordRequests, setPasswordRequests] = useState<PasswordRequest[]>([])
    const { storeSettings } = useSettings()

    // Auto Delete Background Job
    useEffect(() => {
        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff'
        if (!isAdmin || !storeSettings?.autoDeleteChats) return;

        const runCleanup = async () => {
            const LAST_CLEANUP_KEY = "lastAutoCleanup";
            const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
            // Run at most once a day
            if (lastCleanup && new Date().getTime() - Number(lastCleanup) < 24 * 60 * 60 * 1000) return;

            try {
                const duration = storeSettings.autoDeleteChatsDuration || 30;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - duration);
                const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
                // Delete Messages
                const msgsQuery = query(collection(db, "messages"), where("createdAt", "<", cutoffTimestamp), limit(500));
                const msgsSnap = await getDocs(msgsQuery);

                // Delete Notifications
                const notifsQuery = query(collection(db, "notifications"), where("createdAt", "<", cutoffTimestamp), limit(500));
                const notifsSnap = await getDocs(notifsQuery);

                const allDocs = [...msgsSnap.docs, ...notifsSnap.docs];

                if (allDocs.length > 0) {
                    const chunkSize = 400;
                    for (let i = 0; i < allDocs.length; i += chunkSize) {
                        const chunk = allDocs.slice(i, i + chunkSize);
                        const batch = writeBatch(db);
                        chunk.forEach(d => batch.delete(d.ref));
                        await batch.commit();
                    }
                    console.log(`Auto Delete: Cleared ${msgsSnap.size} messages and ${notifsSnap.size} notifications.`);
                }

                localStorage.setItem(LAST_CLEANUP_KEY, new Date().getTime().toString());
            } catch (error) {
                console.error("Auto Cleanup Failed:", error);
            }
        };

        // Delay it by 5 seconds so it doesn't block initial load
        const timer = setTimeout(runCleanup, 5000);
        return () => clearTimeout(timer);
    }, [currentUser?.role, storeSettings?.autoDeleteChats, storeSettings?.autoDeleteChatsDuration]);

    useEffect(() => {
        // Wait until guestId is generated if not logged in
        if (!currentUser && !guestId) return;

        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff'
        const userId = currentUser?.id || guestId

        // Messages Listener
        // Refactored to be compatible with security rules by filtering for the user's ID
        let msgQuery;
        if (isAdmin) {
            msgQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(200))
        } else {
            // For customers/guests: We filter specifically for their ID or global messages
            // Using separate logic or 'in' filter to comply with rules
            // NOTE: Using "where" on userId and "orderBy" on createdAt requires a composite index
            msgQuery = query(
                collection(db, "messages"), 
                where("userId", "in", [userId, "all"]), 
                orderBy("createdAt", "desc"), 
                limit(100)
            )
        }
        
        const unsubMessages = onSnapshot(msgQuery, (snap) => {
            const docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Message))
            setMessages(docs)
        }, (error) => {
            console.error("Messages sync error:", error)
        })

        // Notifications Listener
        let notifQuery;
        if (isAdmin) {
            notifQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(100))
        } else {
            notifQuery = query(
                collection(db, "notifications"), 
                where("userId", "in", [userId, "all"]), 
                orderBy("createdAt", "desc"), 
                limit(50)
            )
        }
        
        const unsubNotifications = onSnapshot(notifQuery, (snap) => {
            const docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Notification))
            setNotifications(docs)
        }, (error) => {
            console.error("Notifications sync error:", error)
        })

        let unsubRequests = () => { };
        let unsubJoin = () => { };
        let unsubPassword = () => { };

        if (isAdmin) {
            unsubRequests = onSnapshot(query(collection(db, "requests"), orderBy("createdAt", "desc")), (snap) => {
                setProductRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as ProductRequest)))
            })
            unsubJoin = onSnapshot(query(collection(db, "joinRequests"), orderBy("createdAt", "desc")), (snap) => {
                setJoinRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as JoinRequest)))
            })
            unsubPassword = onSnapshot(query(collection(db, "password_requests"), orderBy("createdAt", "desc")), (snap) => {
                setPasswordRequests(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as PasswordRequest)))
            })
        }

        return () => {
            unsubMessages(); unsubNotifications(); unsubRequests(); unsubJoin(); unsubPassword()
        }
    }, [currentUser, guestId])

    // Update PWA App Badge for installed apps automatically
    useEffect(() => {
        try {
            if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
                const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff'
                const userId = currentUser?.id || guestId
                let unreadCount = 0

                if (isAdmin) {
                    const unreadMessages = messages.filter(m => !m.read && !m.isAdmin).length
                    const pendingProductReqs = productRequests.filter(r => r.status === 'pending').length
                    const unreadJoins = joinRequests.length
                    const unreadPasswords = passwordRequests.length
                    unreadCount = unreadMessages + pendingProductReqs + unreadJoins + unreadPasswords
                } else {
                    const unreadMessages = messages.filter(m => {
                        const isFromAdmin = m.isAdmin || m.senderId === 'admin'
                        const isForMe = m.userId === userId || m.userId === 'all'
                        return isFromAdmin && isForMe && !m.read
                    }).length
                    
                    const unreadNotifs = notifications.filter(n => !n.read && (n.userId === userId || n.userId === 'all')).length
                    unreadCount = unreadMessages + unreadNotifs
                }

                if (unreadCount > 0) {
                    // @ts-ignore
                    navigator.setAppBadge(unreadCount).catch((e: any) => console.log("Badge warning:", e))
                } else {
                    // @ts-ignore
                    navigator.clearAppBadge().catch((e: any) => console.log("Badge clear warning:", e))
                }
            }
        } catch (error) {
            console.error("App Badging not supported or failed:", error)
        }
    }, [messages, notifications, productRequests, joinRequests, passwordRequests, currentUser, guestId])

    const sendMessage = async (text: string, isAdmin: boolean, userId: string, userName: string = "عميل", link?: string, linkTitle?: string, image?: string, isSystemNotification?: boolean) => {
        await addDoc(collection(db, "messages"), sanitizeData({
            senderId: isAdmin ? "admin" : userId,
            senderName: isAdmin ? "الإدارة" : userName,
            text, isAdmin, read: false, userId, link, linkTitle, image, isSystemNotification, createdAt: Timestamp.now()
        }))
    }


    const markNotificationsRead = async (userId: string) => {
        const unread = notifications.filter(n => n.userId === userId && !n.read)
        const batch = writeBatch(db)
        unread.forEach(n => {
            batch.update(doc(db, "notifications", n.id), { read: true })
        })
        await batch.commit()
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

    const deleteProductRequests = async (ids: string[]) => {
        try {
            // Delete sequentially to keep it simple, or use a batch here if needed
            // Since it might be multiple, doing sequentially or small batches is fine
            for (const id of ids) {
                await deleteDoc(doc(db, "requests", id))
            }
        } catch (error) {
            console.error("Error bulk deleting product requests:", error)
            toast.error("حدث خطأ أثناء حذف بعض الطلبات")
        }
    }

    const addJoinRequest = async (name: string, phone: string) => {
        try {
            const { addJoinRequestAction } = await import("@/app/actions/auth-actions")
            const result = await addJoinRequestAction(name, phone)
            if (!result.success) {
                toast.error(result.error || "حدث خطأ أثناء إرسال الطلب")
                throw new Error(result.error || "Error")
            }
        } catch (error) {
            console.error("Error sending join request:", error)
            throw error // Let the UI handle the failure notification
        }
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

    const markMessagesRead = async (userId?: string, isAdminView = false, isSystem = false) => {
        if (!userId) return
        const unread = messages.filter(m => {
            const isRead = m.read
            if (isRead) return false

            if (isAdminView) {
                // Admin viewing a customer's chat: mark messages FROM that customer as read
                // (Messages where isAdmin is false and userId matches)
                return m.userId === userId && !m.isAdmin
            } else {
                // Customer viewing their own chat: mark messages FROM admin TO them as read
                const isFromAdmin = m.isAdmin || m.senderId === 'admin'
                const isForMe = m.userId === userId || (m.text || "").includes(`(@${userId})`)
                const matchesSystemType = isSystem ? m.isSystemNotification : !m.isSystemNotification

                return isFromAdmin && isForMe && matchesSystemType
            }
        })
        const batch = writeBatch(db)
        unread.forEach(m => {
            batch.update(doc(db, "messages", m.id), { read: true })
        })
        await batch.commit()
    }

    const broadcastToCategory = (category: string, text: string) => {
        toast.info(`بث إلى فئة ${category}: ${text}`, { icon: "📢" })
    }

    const markAllNotificationsRead = async (userId: string) => {
        const unread = notifications.filter(n => n.userId === userId && !n.read)
        const batch = writeBatch(db)
        unread.forEach(n => {
            batch.update(doc(db, "notifications", n.id), { read: true })
        })
        await batch.commit()
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
                // Also save it as a system notification so it appears in the SlideOver
                await addDoc(collection(db, "messages"), sanitizeData({
                    senderId: "admin",
                    senderName: "الإدارة",
                    text: title ? `${title}\n${body}` : body,
                    isAdmin: true,
                    read: false,
                    userId: "all",
                    isSystemNotification: true,
                    actionLink: link,
                    actionTitle: "عرض",
                    createdAt: Timestamp.now()
                }))
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
            await addDoc(collection(db, "messages"), sanitizeData({
                senderId: "admin",
                senderName: "الإدارة",
                text: link ? `${text}\n\n[${linkTitle || 'عرض'}](${link})` : text,
                isAdmin: true,
                read: false,
                userId: "all", // Unified target instead of duplicating for every user
                createdAt: Timestamp.now()
            }))
            toast.success("تم إرسال الرسالة للجميع")
        } catch (error) {
            toast.error("حدث خطأ أثناء الإرسال الجماعي")
        }
    }

    const markNotificationRead = async (id: string) => {
        await updateDoc(doc(db, "notifications", id), { read: true })
    }

    const deleteAllChatsAndNotifications = async (onProgress?: (progress: number, status: string) => void) => {
        try {
            const msgsCol = collection(db, "messages");
            const notifsCol = collection(db, "notifications");

            onProgress?.(5, "جاري حساب السجلات...");
            const msgsCountSnap = await getCountFromServer(msgsCol);
            const notifsCountSnap = await getCountFromServer(notifsCol);

            const totalDocs = msgsCountSnap.data().count + notifsCountSnap.data().count;

            if (totalDocs === 0) {
                onProgress?.(100, "لا توجد سجلات للحذف");
                toast.success("قاعدة البيانات فارغة بالفعل!");
                return;
            }

            let deletedCount = 0;

            const deleteCollectionInBatches = async (colRef: any, name: string) => {
                let hasMore = true;
                while (hasMore) {
                    const q = query(colRef, limit(200));
                    const snap = await getDocs(q);

                    if (snap.empty) {
                        hasMore = false;
                        break;
                    }

                    const batch = writeBatch(db);
                    snap.docs.forEach(d => batch.delete(d.ref));
                    await batch.commit();

                    deletedCount += snap.size;
                    const percent = Math.min(Math.round((deletedCount / totalDocs) * 100), 100);
                    onProgress?.(percent, `جاري تنظيف ${name}... (${percent}%)`);
                }
            };

            await deleteCollectionInBatches(msgsCol, "الرسائل");
            await deleteCollectionInBatches(notifsCol, "الإشعارات");

            onProgress?.(100, "اكتمل الحذف بنجاح!");
            toast.success("تم حذف جميع السجلات بنجاح!");
        } catch (error) {
            console.error("Delete All Error:", error);
            toast.error("حدث خطأ أثناء محاولة حذف السجلات");
            onProgress?.(0, "فشلت العملية");
        }
    }

    return (
        <CommunicationContext.Provider value={{
            messages, notifications, productRequests, joinRequests, passwordRequests,
            sendMessage, markNotificationsRead, markNotificationRead, addProductRequest, updateProductRequestStatus, deleteProductRequest, deleteProductRequests, addJoinRequest, deleteJoinRequest, resolvePasswordRequest, requestPasswordReset,
            broadcastNotification, markMessagesRead, broadcastToCategory, markAllNotificationsRead, sendNotificationToGroup, sendGlobalMessage, sendNotification, deleteAllChatsAndNotifications
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
