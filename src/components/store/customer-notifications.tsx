"use client"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Bell, ExternalLink, Trash2, CheckCheck, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { doc, deleteDoc, writeBatch } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"

interface CustomerNotificationsProps {
    forceOpen?: boolean;
}

export function CustomerNotifications({ forceOpen }: CustomerNotificationsProps) {
    const { notifications, markNotificationRead, markAllNotificationsRead, currentUser } = useStore()
    const [isOpen, setIsOpen] = useState(false)

    const handleDeleteSingle = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        hapticFeedback('light')
        try {
            await deleteDoc(doc(db, "notifications", id))
            toast.success("تم حذف الإشعار")
        } catch (e) {
            toast.error("فشل حذف الإشعار")
        }
    }

    const handleDeleteAll = async () => {
        if (userNotifications.length === 0) return
        if (!confirm("هل أنت متأكد من حذف جميع الإشغارات نهائياً؟")) return
        hapticFeedback('medium')
        try {
            const batch = writeBatch(db)
            userNotifications.forEach((n: any) => {
                batch.delete(doc(db, "notifications", n.id))
            })
            await batch.commit()
            toast.success("تم إخلاء جميع الإشعارات بنجاح")
        } catch (e) {
            console.error("Failed to delete notifications:", e)
            toast.error("فشل في حذف الإشعارات")
        }
    }

    useEffect(() => {
        if (forceOpen) {
            setIsOpen(true)
        }
    }, [forceOpen])

    // useEffect(() => {
    //     if (isOpen) {
    //         // Small delay to ensure UI opens first
    //         setTimeout(() => markAllNotificationsRead(currentUser?.id || ""), 500)
    //     }
    // }, [isOpen, markAllNotificationsRead])

    // Filter notifications for current user
    const userNotifications = (notifications || [])
        .filter((n: any) => n.userId === currentUser?.id)
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Oldest first, newest bottom

    const unreadCount = userNotifications.filter((n: any) => !n.read).length

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 border border-border bg-card hover:bg-accent shadow-lg group">
                        <Bell className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors group-hover:animate-swing" />
                    </Button>
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white z-10 animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[400px] border-r border-white/10 bg-slate-950/95 backdrop-blur-2xl text-white">
                <SheetHeader className="text-right border-b border-white/10 pb-4 mb-4">
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                            {userNotifications.length > 0 && (
                                <button
                                    onClick={handleDeleteAll}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold hover:bg-red-500/20 transition-all active:scale-95 cursor-pointer shadow-sm shadow-red-500/5"
                                >
                                    <Trash className="w-3 h-3" />
                                    <span>حذف الكل</span>
                                </button>
                            )}
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => {
                                        if (markAllNotificationsRead) {
                                            markAllNotificationsRead(currentUser?.id || "")
                                        }
                                        hapticFeedback('medium')
                                        toast.success("تم تحديد الجميع كمقروء ✅")
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-bold hover:bg-emerald-500/20 transition-all active:scale-95 cursor-pointer shadow-sm shadow-emerald-500/5"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    <span>مقروء للكل</span>
                                </button>
                            )}
                        </div>
                        <SheetTitle className="text-white text-xl font-black flex items-center gap-2 justify-end">
                            الإشعارات
                            <Bell className="w-5 h-5 text-primary animate-pulse" />
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <div className="space-y-3 overflow-y-auto h-[calc(100vh-120px)] customer-scrollbar p-1">
                    <AnimatePresence initial={false}>
                        {userNotifications.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                className="text-center py-20 text-slate-500 font-bold"
                            >
                                لا توجد إشعارات حالياً
                            </motion.div>
                        ) : (
                            userNotifications.map((notification: any) => {
                                const isSelected = notification.read
                                return (
                                    <motion.div
                                        key={notification.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className={cn(
                                            "relative p-4 rounded-xl border transition-all duration-300 cursor-pointer group/card overflow-hidden",
                                            notification.read 
                                                ? "bg-white/5 border-white/5 hover:bg-white/10 opacity-70" 
                                                : "bg-primary/10 border-primary/20 hover:bg-primary/15 shadow-lg shadow-primary/5"
                                        )}
                                        onClick={() => {
                                            if (!notification.read && markNotificationRead) markNotificationRead(notification.id)
                                            
                                            let targetLink = notification.link
                                            if (!targetLink && notification.body?.includes('?product=')) {
                                                const match = notification.body.match(/(https?:\/\/[^\s]+customer\?product=[a-zA-Z0-9_-]+)/i)
                                                if (match) {
                                                    targetLink = match[0]
                                                }
                                            }
                                            
                                            if (targetLink) {
                                                setIsOpen(false)
                                                const match = targetLink.match(/\?product=([a-zA-Z0-9_-]+)/i)
                                                if (match) {
                                                    const productId = match[1]
                                                    try {
                                                        localStorage.setItem("open_product_id", productId)
                                                    } catch (e) {
                                                        console.error(e)
                                                    }
                                                    // Dispatch custom event for instant in-page trigger
                                                    window.dispatchEvent(new CustomEvent("open-product-modal", { detail: productId }))
                                                }
                                                
                                                // Perform routing navigation
                                                window.location.href = targetLink
                                            }
                                        }}
                                    >
                                        <div className="flex justify-between items-start gap-3 relative">
                                            {/* Individual Delete Icon button */}
                                            <button
                                                onClick={(e) => handleDeleteSingle(notification.id, e)}
                                                className="absolute -top-1 -left-1 p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer opacity-0 group-hover/card:opacity-100 focus:opacity-100 z-10"
                                                title="حذف الإشعار"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="flex-1 space-y-1 pl-6">
                                                <h4 className={cn("text-sm font-bold flex items-center gap-2", !notification.read && "text-primary")}>
                                                    {/* Format title for chat */}
                                                    {(notification.title.includes('رسالة') || /^[a-zA-Z0-9]{20}$/.test(notification.body))
                                                        ? "💬 رسالة جديدة"
                                                        : notification.title.replace(/(Invoice|الفاتورة)\s*#\w+/gi, "$1").replace(/\(@[a-zA-Z0-9_-]+\)/g, '').trim()}
                                                    {(notification.link || notification.body?.includes('?product=')) && <ExternalLink className="w-3 h-3 opacity-50" />}
                                                </h4>
                                                <p className="text-xs text-slate-300 leading-relaxed">
                                                    {/* Format body for chat & clean raw URL links */}
                                                    {(notification.title.includes('رسالة') || /^[a-zA-Z0-9]{20}$/.test(notification.body))
                                                        ? "قام أحد ممثلي الإدارة بالرد على استفسارك..."
                                                        : notification.body
                                                            .replace(/https?:\/\/[^\s]+customer\?product=[a-zA-Z0-9_-]+/gi, '🛍️ (رابط منتج مرفق)')
                                                            .replace(/\[بواسطة الآدمن\]/g, '')
                                                            .replace(/\(@[a-zA-Z0-9_-]+\)/g, '')
                                                            .trim()}
                                                </p>
                                                
                                                {/* Attachment Action Badge */}
                                                {(notification.link?.includes('?product=') || notification.body?.includes('?product=')) && (
                                                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-lg border border-primary/20 hover:bg-primary/30 transition-all cursor-pointer">
                                                            🛍️ عرض المنتج المرفق
                                                        </span>
                                                    </div>
                                                )}

                                                <span className="text-[10px] text-slate-500 block pt-2">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                                                </span>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    )
}
