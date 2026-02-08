"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ClipboardList, PlusCircle, Scan, ShoppingCart, LogOut, MessageSquare, Share2 } from "lucide-react"
import React, { useState, useRef } from "react" // Added useRef
import { useStore } from "@/context/store-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ScannerModal from "@/components/store/scanner-modal"
import SmartCameraModal from "@/components/store/smart-camera-modal" // Added import
import { CartDrawer } from "@/components/store/cart-drawer"
import RequestModal from "@/components/store/request-modal"
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
    const pathname = usePathname()
    const router = useRouter()
    const { cart, logout, storeSettings, messages, currentUser, guestId } = useStore()

    // Chat Logic
    const currentCustomerId = currentUser?.id || guestId
    const unreadChatCount = messages.filter(m => {
        const isFromAdmin = m.isAdmin
        const isForMe = m.text.includes(`(@${currentCustomerId})`) || m.userId === currentCustomerId
        return isFromAdmin && isForMe && !m.read
    }).length

    // --- Smart Camera Logic ---
    const [isSmartCameraOpen, setIsSmartCameraOpen] = useState(false)
    const longPressTimer = useRef<NodeJS.Timeout | null>(null)
    const isLongPress = useRef(false)

    const handleTouchStart = (e?: React.TouchEvent | React.MouseEvent) => {
        // e?.preventDefault() // Don't prevent default on start, or scrolling breaks
        if (storeSettings.enableAIChat === false) return // Disable long press if AI is off

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
        { name: "الماسح", icon: Scan, isCenter: true, onClick: () => setIsScannerOpen(true) },
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
                <div className="fixed inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse dark:bg-primary/10" />
                    <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] dark:bg-blue-500/10" />
                    <div className="hidden dark:block bg-noise absolute inset-0 opacity-[0.03]" />
                </div>

                <div className="w-full max-w-7xl mx-auto flex flex-col min-h-screen relative z-10">
                    <VisitTracker />
                    <main className="flex-1 px-4 pt-6 w-full pb-32">
                        {/* New Header Navigation */}
                        <div className="flex justify-between items-center mb-8 sticky top-0 z-50 bg-[#0f111a]/95 backdrop-blur-xl py-3 -mx-4 px-4 transition-all border-b border-white/5 shadow-2xl shadow-black/20">

                            {/* Left Side: Logo & Main Actions */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                <div className="flex items-center gap-3 pl-2 border-l border-white/10 ml-1">
                                    <div className="relative group cursor-default">
                                        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-all" />
                                        <Image
                                            src="/logo.jpg"
                                            alt="Logo"
                                            width={38}
                                            height={38}
                                            className="rounded-full object-cover border border-white/10 relative z-10 shadow-lg"
                                        />
                                    </div>
                                    <div className="hidden sm:block">
                                        <h1 className="text-sm font-black tracking-widest text-white uppercase mb-0.5">YSG</h1>
                                    </div>
                                </div>

                                {/* Navigation Items */}
                                <Link
                                    href="/customer/invoices"
                                    className="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] h-[60px] rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 active:scale-95 transition-all"
                                >
                                    <ClipboardList className="w-6 h-6" />
                                    <span className="text-[10px] font-bold">فواتيري</span>
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
                                    className="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] h-[60px] rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 active:scale-95 transition-all"
                                >
                                    <PlusCircle className="w-6 h-6" />
                                    <span className="text-[10px] font-bold">طلب جديد</span>
                                </button>

                                <Link
                                    href="/customer/chat"
                                    className="relative flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] h-[60px] rounded-xl bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 active:scale-95 transition-all"
                                >
                                    <MessageSquare className="w-6 h-6" />
                                    <span className="text-[10px] font-bold">محادثة</span>
                                    {unreadChatCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#0f111a] font-bold">
                                            {unreadChatCount}
                                        </span>
                                    )}
                                </Link>

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
                                    className="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] h-[60px] rounded-xl bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 active:scale-95 transition-all"
                                >
                                    <Share2 className="w-6 h-6" />
                                    <span className="text-[10px] font-bold">نشر</span>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] h-[60px] rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all"
                                >
                                    <LogOut className="w-6 h-6" />
                                    <span className="text-[10px] font-bold">خروج</span>
                                </button>
                            </div>

                            {/* Right Side: Cart (Primary Action) */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2.5 bg-amber-500/10 rounded-xl text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 active:scale-95 transition-all flex items-center gap-2 mr-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="font-bold text-xs">السلة</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1c2a36] shadow-lg shadow-amber-500/20">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {children}
                    </main>

                    <Footer />
                </div>

                {/* Floating Scanner Button (Isolated) */}
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
                        className="group relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)] active:scale-95 transition-all border-4 border-[#0f111a]"
                    >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gray-100 to-white opacity-100 group-hover:opacity-90 transition-opacity" />
                        <Scan className="w-8 h-8 text-black relative z-10 group-hover:scale-110 transition-transform" />

                        {/* Pulse Effect */}
                        <div className="absolute inset-0 rounded-full animate-ping bg-white/20 -z-10" />
                    </button>
                </div>

                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
            </div>

            {/* Modals moved outside the main layout container to avoid stacking context issues */}
            <ScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onRequestProduct={() => setIsRequestOpen(true)}
            />

            <AiChatModal
                isOpen={isAiChatOpen}
                onClose={() => setIsAiChatOpen(false)}
            />
        </ProtectedRoute>

    )
}
