"use client"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Bell, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface CustomerNotificationsProps {
    forceOpen?: boolean;
}

export function CustomerNotifications({ forceOpen }: CustomerNotificationsProps) {
    const { notifications, markNotificationRead, markAllNotificationsRead, currentUser } = useStore()
    const [isOpen, setIsOpen] = useState(false)

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
    const userNotifications = notifications
        .filter(n => n.userId === currentUser?.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Oldest first, newest bottom

    const unreadCount = userNotifications.filter(n => !n.read).length

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
            <SheetContent side="left" className="w-full sm:w-[400px] border-r border-white/10 bg-black/90 backdrop-blur-xl text-white">
                <SheetHeader className="text-right border-b border-white/10 pb-4 mb-4">
                    <SheetTitle className="text-white text-xl font-bold flex items-center gap-2 justify-end">
                        الإشعارات
                        <Bell className="w-5 h-5 text-primary" />
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-4 overflow-y-auto h-[calc(100vh-100px)] customer-scrollbar p-1">
                    {userNotifications.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            لا توجد إشعارات حالياً
                        </div>
                    ) : (
                        userNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "relative p-4 rounded-xl border transition-all duration-300",
                                    notification.read ? "bg-white/5 border-white/5 opacity-70" : "bg-primary/10 border-primary/20 shadow-lg shadow-primary/5"
                                )}
                                onClick={() => {
                                    if (!notification.read) markNotificationRead(notification.id)
                                    if (notification.link) {
                                        setIsOpen(false)
                                        window.location.href = notification.link
                                    }
                                }}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 space-y-1">
                                        <h4 className={cn("text-sm font-bold flex items-center gap-2", !notification.read && "text-primary")}>
                                            {/* Format title for chat */}
                                            {(notification.title.includes('رسالة') || /^[a-zA-Z0-9]{20}$/.test(notification.body))
                                                ? "💬 رسالة جديدة"
                                                : notification.title.replace(/(Invoice|الفاتورة)\s*#\w+/gi, "$1")}
                                            {notification.link && <ExternalLink className="w-3 h-3 opacity-50" />}
                                        </h4>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            {/* Format body for chat */}
                                            {(notification.title.includes('رسالة') || /^[a-zA-Z0-9]{20}$/.test(notification.body))
                                                ? "قام أحد ممثلي الإدارة بالرد على استفسارك..."
                                                : notification.body}
                                        </p>
                                        <span className="text-[10px] text-slate-500 block pt-2">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ar })}
                                        </span>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
