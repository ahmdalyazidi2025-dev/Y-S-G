"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ClipboardList, PlusCircle, Scan, ShoppingCart, LogOut, MessageSquare, Share2, Bell } from "lucide-react"
import React, { useState, useRef, useEffect } from "react" // Added useRef
import { useStore } from "@/context/store-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ScannerModal from "@/components/store/scanner-modal"
import SmartCameraModal from "@/components/store/smart-camera-modal" // Added import
import { CartDrawer } from "@/components/store/cart-drawer"
import RequestModal from "@/components/store/request-modal"
import NotificationSlideOver from "@/components/store/notification-slide-over"
import { NotificationHandler } from "@/components/store/notification-handler" // Added import
import { AiChatModal } from "@/components/store/ai-chat-modal"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import { Footer } from "@/components/store/footer"
import { ThemeToggle } from "@/components/theme-toggle"
import { VisitTracker } from "@/components/analytics/visit-tracker"

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isRequestOpen, setIsRequestOpen] = useState(false)
    const [isAiChatOpen, setIsAiChatOpen] = useState(false)
    const [isNotifyOpen, setIsNotifyOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { cart, logout, storeSettings, messages, currentUser, guestId, markNotificationsAsRead } = useStore()

    // Chat Logic
    // const searchParams = useSearchParams() // Removed
    // useEffect moved to NotificationHandler

    // Chat Logic
    const currentCustomerId = currentUser?.id || guestId
    const unreadChatCount = messages.filter(m => {
        const isFromAdmin = m.isAdmin
        // Logic: Message from Admin to Me OR Broadcast
        const text = m.text || ""
        const isForMe = text.includes(`(@${currentCustomerId})`) || m.userId === currentCustomerId
        return isFromAdmin && isForMe && !m.read && !m.isSystemNotification
    }).length

    const unreadNotificationCount = messages.filter(m => {
        const isFromAdmin = m.isAdmin
        const text = m.text || ""
        const isForMe = text.includes(`(@${currentCustomerId})`) || m.userId === currentCustomerId
        return isFromAdmin && isForMe && !m.read && m.isSystemNotification
    }).length

    // --- Smart Camera Logic ---
    const [isSmartCameraOpen, setIsSmartCameraOpen] = useState(false)
    const longPressTimer = useRef<NodeJS.Timeout | null>(null)
    const isLongPress = useRef(false)

    const handleTouchStart = (e?: React.TouchEvent | React.MouseEvent) => {
        // e?.preventDefault() // Don't prevent default on start, or scrolling breaks
        if (storeSettings.enableAIChat === false) return

        isLongPress.current = false
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true
            hapticFeedback('heavy')
            setIsAiChatOpen(true)
        }, 600)
    }

    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent, action: () => void) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
        }

        // If it was a long press, we prevent further actions (like click processing)
        if (isLongPress.current) {
            e.preventDefault()
            return
        }

        action()
    }
    // --------------------------

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

    const handleLogout = () => {
        logout()
        hapticFeedback('medium')
        router.push("/?logout=true")
    }

    const navItems = [
        { name: "الفواتير", icon: ClipboardList, href: "/customer/invoices" },
        { name: "السلة", icon: ShoppingCart, onClick: () => setIsCartOpen(true), badge: cartCount },
        // Show Scanner ONLY on Home Page (/customer) AND if enabled
        ...(pathname === "/customer" && storeSettings.enableBarcodeScanner !== false ? [{ name: "الماسح", icon: Scan, isCenter: true, onClick: () => setIsScannerOpen(true) }] : []),
        {
            name: "طلب",
            icon: PlusCircle,
            onClick: () => {
                if (storeSettings.enableProductRequests === false) {
                    // Show alert using built-in alert or sonner toast if available (sonner is imported in root layout, assuming available globally via logic or we can use window.alert for simplicity as requested "show message")
                    // Better to use Sonner since we have it, but here we can just use alert or simply return.
                    // User said: "تضهر رسالة اقترحها انت مفادها انه رفع طلبات مغلق تواصل مع الادارة عبر الواتس او عبر الدردشه"
                    // I'll use a simple alert for now or try to import toast. Let's start with alert to be safe in this file or use Sonner if I can see it. 
                    // Toaster is in RootLayout. I can import { toast } from "sonner".
                    import("sonner").then(({ toast }) => {
                        toast.error("عفواً، رفع الطلبات مغلق حالياً", {
                            description: "يمكنك التواصل مع الإدارة عبر الواتساب أو الدردشة للمساعدة.",
                            duration: 4000
                        })
                    })
                } else {
                    setIsRequestOpen(true)
                }
            }
        },
        { name: "الدردشة", icon: MessageSquare, href: "/customer/chat", badge: unreadChatCount },
    ]

    return (


        <ProtectedRoute role="customer">
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center overflow-x-hidden relative selection:bg-primary/30 transition-colors duration-300">
                {/* Ambient Background Elements */}
                {/* Ambient Background Elements - Only visible in Dark Mode for Cleaner Light Mode */}
                <div className="fixed inset-0 z-0 hidden dark:block pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]" />
                    <div className="bg-noise absolute inset-0 opacity-[0.03]" />
                </div>

                <div className="w-full max-w-7xl mx-auto flex flex-col min-h-screen relative z-10">
                    <VisitTracker />
                    <main className="flex-1 px-4 pt-6 w-full pb-32">
                        {/* New Header Navigation (Stacked Fixed) */}
                        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm dark:shadow-black/20 transition-all duration-300">
                            <div className="w-full max-w-7xl mx-auto px-4 pt-2 pb-3">
                                {/* Row 1: Logo & Nav Actions */}
                                <div className="flex justify-between items-center mb-2">
                                    {/* Left Side: Logo & Main Actions */}
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                        <div className="flex items-center gap-3 pl-2 border-l border-border/50 ml-1">
                                            <div className="relative group cursor-default">
                                                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:opacity-100 transition-all" />
                                                <Image
                                                    src="/logo.jpg"
                                                    alt="Logo"
                                                    width={38}
                                                    height={38}
                                                    className="rounded-full object-cover border border-white/10 relative z-10 shadow-lg"
                                                />
                                            </div>
                                            <div className="hidden sm:block">
                                                <h1 className="text-sm font-black tracking-widest text-foreground uppercase mb-0.5">YSG</h1>
                                            </div>
                                        </div>

                                        {/* Navigation Items */}
                                        <Link
                                            href="/customer/invoices"
                                            className="flex flex-col items-center justify-center gap-1 p-2 min-w-[50px] h-[50px] rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 active:scale-95 transition-all border border-border"
                                        >
                                            <ClipboardList className="w-5 h-5" />
                                            <span className="text-[9px] font-bold">فواتيري</span>
                                        </Link>

                                        <button
                                            onClick={() => {
                                                if (storeSettings.enableProductRequests === false) {
                                                    import("sonner").then(({ toast }) => {
                                                        toast.error("عفواً، رفع الطلبات مغلق حالياً", {
                                                            description: "يمكنك التواصل مع الإدارة للمساعدة.",
                                                            duration: 4000
                                                        })
                                                    })
                                                } else {
                                                    setIsRequestOpen(true)
                                                }
                                            }}
                                            className="flex flex-col items-center justify-center gap-1 p-2 min-w-[50px] h-[50px] rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 active:scale-95 transition-all border border-border"
                                        >
                                            <PlusCircle className="w-5 h-5" />
                                            <span className="text-[9px] font-bold">طلب</span>
                                        </button>

                                        {storeSettings.enableAIChat !== false && (
                                            <Link
                                                href="/customer/chat"
                                                onClick={() => markNotificationsAsRead('chat')}
                                                className="relative flex flex-col items-center justify-center gap-1 p-2 min-w-[50px] h-[50px] rounded-xl bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 active:scale-95 transition-all border border-border"
                                            >
                                                <MessageSquare className="w-5 h-5" />
                                                <span className="text-[9px] font-bold">محادثة</span>
                                                {unreadChatCount > 0 && (
                                                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-[#0f111a] font-bold">
                                                        {unreadChatCount}
                                                    </span>
                                                )}
                                            </Link>
                                        )}

                                        <button
                                            onClick={() => setIsNotifyOpen(true)}
                                            className="relative flex flex-col items-center justify-center gap-1 p-2 min-w-[50px] h-[50px] rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 active:scale-95 transition-all border border-border"
                                        >
                                            <Bell className="w-5 h-5" />
                                            <span className="text-[9px] font-bold">تنبيهات</span>
                                            {unreadNotificationCount > 0 && (
                                                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-[#0f111a] font-bold">
                                                    {unreadNotificationCount}
                                                </span>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                const url = window.location.origin
                                                const text = "تسوق أفضل المنتجات من YSG Store"
                                                if (navigator.share) {
                                                    navigator.share({ title: 'YSG Store', text, url }).catch(console.error)
                                                } else {
                                                    navigator.clipboard.writeText(url)
                                                    import("sonner").then(({ toast }) => toast.success("تم نسخ الرابط"))
                                                }
                                                hapticFeedback('light')
                                            }}
                                            className="flex flex-col items-center justify-center gap-1 p-2 min-w-[50px] h-[50px] rounded-xl bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 active:scale-95 transition-all border border-border"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            <span className="text-[9px] font-bold">نشر</span>
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="flex flex-col items-center justify-center gap-1 p-2 min-w-[50px] h-[50px] rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all border border-border"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span className="text-[9px] font-bold">خروج</span>
                                        </button>

                                        <div className="mx-1 scale-75 sm:scale-90 origin-center">
                                            <ThemeToggle />
                                        </div>
                                    </div>

                                    {/* Right Side: Cart (Primary Action) */}
                                    <button
                                        onClick={() => setIsCartOpen(true)}
                                        className="relative p-2.5 bg-amber-500/10 rounded-xl text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 active:scale-95 transition-all flex items-center gap-2 mr-2 group"
                                    >
                                        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span className="font-bold text-xs">السلة</span>
                                        {cartCount > 0 && (
                                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-lg shadow-amber-500/20">
                                                {cartCount}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Row 2: Global Search Bar */}
                                <div className="w-full">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-secondary/30 rounded-xl pointer-events-none" />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="ابحث عن منتج، قطعة، أو باركود..."
                                            className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-right text-sm outline-none transition-all placeholder:text-muted-foreground/70 font-medium relative z-10"
                                            id="global-search-input"
                                            onChange={(e) => {
                                                const params = new URLSearchParams(window.location.search);
                                                if (e.target.value) {
                                                    params.set("q", e.target.value);
                                                } else {
                                                    params.delete("q");
                                                }
                                                router.replace(`${pathname}?${params.toString()}`);
                                            }}
                                        />
                                        <script dangerouslySetInnerHTML={{
                                            __html: `
                                                (function() {
                                                    const q = new URLSearchParams(window.location.search).get('q');
                                                    if (q) {
                                                        const el = document.getElementById('global-search-input');
                                                        if (el) el.value = q;
                                                    }
                                                })()
                                            `
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Spacer for Fixed Header (~140px) */}
                        <div className="h-[140px]" />

                        {children}
                    </main>

                    <Footer />
                </div>

                {/* Floating Scanner Button (Isolated) - Only on Customer Home Page & Enabled */}
                {pathname === "/customer" && storeSettings.enableBarcodeScanner !== false && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50]">
                        <button
                            // Mobile Touch Events
                            onTouchStart={handleTouchStart}
                            onTouchEnd={(e) => handleTouchEnd(e, () => setIsScannerOpen(true))}
                            // Desktop/Mouse Events
                            onMouseDown={handleTouchStart}
                            onMouseUp={(e) => handleTouchEnd(e, () => setIsScannerOpen(true))}
                            // Prevent Context Menu on Long Press
                            onContextMenu={(e) => e.preventDefault()}
                            // Fallback
                            onClick={() => { }}
                            className="group relative w-18 h-18 sm:w-20 sm:h-20 bg-background rounded-full flex items-center justify-center shadow-[0_4px_30px_-5px_hsl(var(--primary)/0.5)] active:scale-95 transition-all duration-300 border-4 border-background dark:border-[#0f111a] hover:-translate-y-1"
                        >
                            {/* Premium Gradient Background */}
                            <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-primary to-primary/80 opacity-100 dark:opacity-90 transition-opacity" />

                            {/* Glow Effect */}
                            <div className="absolute inset-0 rounded-full bg-primary/50 blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />

                            <Scan className="w-8 h-8 sm:w-9 sm:h-9 text-white relative z-10 group-hover:scale-110 transition-transform drop-shadow-md" />

                            {/* Scan Line Animation */}
                            <div className="absolute inset-3 rounded-full overflow-hidden z-10 opacity-30 pointer-events-none">
                                <div className="w-full h-[2px] bg-white/80 absolute top-0 animate-scan-line shadow-[0_0_10px_white]" />
                            </div>
                        </button>
                    </div>
                )}

                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
            </div>

            {/* Modals moved outside the main layout container to avoid stacking context issues */}
            {storeSettings.enableBarcodeScanner !== false && (
                <ScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onRequestProduct={() => setIsRequestOpen(true)}
                />
            )}

            <AiChatModal
                isOpen={isAiChatOpen}
                onClose={() => setIsAiChatOpen(false)}
            />

            <NotificationSlideOver
                isOpen={isNotifyOpen}
                onClose={() => setIsNotifyOpen(false)}
            />
            <NotificationHandler onOpen={() => setIsNotifyOpen(true)} />
        </ProtectedRoute>

    )
}
