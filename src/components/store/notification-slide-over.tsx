"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bell, Clock, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export default function NotificationSlideOver({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { messages, currentUser, guestId } = useStore()

    // Filter messages/notifications for this user
    // Assuming 'messages' are used for notifications as per previous context
    const currentCustomerId = currentUser?.id || guestId
    const notifications = messages.filter(m => {
        const isFromAdmin = m.isAdmin
        // Logic: Message from Admin to Me OR Broadcast
        // If m.userId is null/empty, it might be a broadcast if logic supports it, 
        // but here we check if it targets the user explicitly or via @mention
        const isForMe = m.userId === currentCustomerId || m.text.includes(`(@${currentCustomerId})`)
        return isFromAdmin && isForMe && m.isSystemNotification
    }).sort((a, b) => {
        const timeA = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : 0
        const timeB = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : 0
        return timeB - timeA
    })

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                    />

                    {/* Slide Over Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/50 backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                <h2 className="font-bold text-lg">الإشعارات</h2>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    {notifications.length}
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 opacity-50">
                                    <Bell className="w-16 h-16" />
                                    <p>لا توجد إشعارات حالياً</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all hover:bg-secondary/50",
                                            notification.read
                                                ? "bg-transparent border-border/50 opacity-70"
                                                : "bg-secondary/30 border-primary/20 shadow-sm"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn(
                                                "relative flex-shrink-0 overflow-hidden border border-border/50 shadow-sm",
                                                notification.image ? "w-16 h-16 rounded-xl" : "w-10 h-10 rounded-full flex items-center justify-center bg-primary/10"
                                            )}>
                                                {notification.image ? (
                                                    <img src={notification.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Info className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-snug">{notification.text}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        {(notification.createdAt as any)?.seconds
                                                            ? format(new Date((notification.createdAt as any).seconds * 1000), "d MMM - h:mm a", { locale: ar })
                                                            : format(new Date(), "d MMM - h:mm a", { locale: ar })
                                                        }
                                                    </span>
                                                </div>

                                                {notification.actionLink && (
                                                    <a
                                                        href={notification.actionLink}
                                                        className="block mt-2 text-xs text-primary underline underline-offset-4"
                                                        onClick={() => onClose()}
                                                    >
                                                        {notification.actionTitle || "عرض التفاصيل"}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
