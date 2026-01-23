"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ClipboardList, PlusCircle, Scan, ShoppingCart, LogOut, MessageSquare } from "lucide-react"
import React, { useState, useRef } from "react" // Added useRef
import { useStore } from "@/context/store-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ScannerModal from "@/components/store/scanner-modal"
import SmartCameraModal from "@/components/store/smart-camera-modal" // Added import
import { CartDrawer } from "@/components/store/cart-drawer"
import RequestModal from "@/components/store/request-modal"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import { Footer } from "@/components/store/footer"
import { ThemeToggle } from "@/components/theme-toggle" // Added ThemeToggle import here to be safe

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isRequestOpen, setIsRequestOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { cart, logout } = useStore()

    // --- Smart Camera Logic ---
    const [isSmartCameraOpen, setIsSmartCameraOpen] = useState(false)
    const longPressTimer = useRef<NodeJS.Timeout | null>(null)
    const isLongPress = useRef(false)

    const handleTouchStart = () => {
        isLongPress.current = false
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true
            hapticFeedback('heavy')
            setIsSmartCameraOpen(true)
        }, 600)
    }

    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent, action: () => void) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
        }
        if (!isLongPress.current) {
            action()
        }
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
        { name: "طلب", icon: PlusCircle, onClick: () => setIsRequestOpen(true) },
        { name: "الدردشة", icon: MessageSquare, href: "/customer/chat" },
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
                    <main className="flex-1 px-4 pt-6 w-full pb-32">
                        <div className="flex justify-between items-center mb-8 sticky top-0 z-50 bg-[#0f111a]/80 backdrop-blur-xl py-4 -mx-4 px-4 transition-all border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <Link href="/customer" className="relative group">
                                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-all" />
                                    <Image
                                        src="/logo.jpg"
                                        alt="Logo"
                                        width={42}
                                        height={42}
                                        className="rounded-full object-cover border border-white/10 relative z-10 shadow-lg group-active:scale-95 transition-transform"
                                    />
                                </Link>
                                <div className="hidden sm:block">
                                    <h1 className="text-sm font-black tracking-widest text-white uppercase mb-0.5">YSG SALES</h1>
                                    <p className="text-[9px] text-primary/80 font-bold tracking-[0.2em] uppercase">Client Portal</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2.5 bg-red-500/10 rounded-2xl text-red-400 hover:bg-red-400/20 transition-all border border-red-500/20 flex items-center gap-2 font-bold text-xs"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">تسجيل الخروج</span>
                            </button>
                        </div>
                        {children}
                    </main>

                    <Footer />
                </div>

                {/* Bottom Navigation (Adaptive & Wide) */}
                <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm md:max-w-xl h-20 glass rounded-[32px] z-[50] border border-white/10 shadow-2xl flex items-center justify-around px-2 transition-all">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        if (item.isCenter) {
                            return (
                                <button
                                    key={item.name}
                                    // Mobile Touch Events
                                    onTouchStart={() => item.name === "الماسح" && handleTouchStart()}
                                    onTouchEnd={(e) => item.name === "الماسح" ? handleTouchEnd(e, () => item.onClick?.()) : item.onClick?.()}
                                    // Desktop/Mouse Events
                                    onMouseDown={() => item.name === "الماسح" && handleTouchStart()}
                                    onMouseUp={(e) => item.name === "الماسح" ? handleTouchEnd(e, () => item.onClick?.()) : item.onClick?.()}
                                    // Fallback Click
                                    onClick={() => item.name !== "الماسح" && item.onClick?.()}
                                    className="relative -top-8 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 active:scale-95 transition-all border-4 border-[#101c26] group"
                                >
                                    <Icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                                    <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 -z-10" />
                                </button>
                            )
                        }

                        const Content = (
                            <div className={cn(
                                "flex flex-col items-center gap-1 transition-all relative",
                                isActive ? "text-primary scale-110" : "text-slate-400 hover:text-slate-300"
                            )}>
                                <div className="relative">
                                    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                                    {item.badge && item.badge > 0 ? (
                                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1c2a36]">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </div>
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </div>
                        )

                        return item.href ? (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="p-2"
                                onClick={() => hapticFeedback('light')}
                            >
                                {Content}
                            </Link>
                        ) : (
                            <button
                                key={item.name}
                                onClick={() => {
                                    item.onClick?.()
                                    hapticFeedback('light')
                                }}
                                className="p-2"
                            >
                                {Content}
                            </button>
                        )
                    })}
                </nav>

                <ScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onRequestProduct={() => setIsRequestOpen(true)}
                />
                <SmartCameraModal
                    isOpen={isSmartCameraOpen}
                    onClose={() => setIsSmartCameraOpen(false)}
                />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
            </div>
        </ProtectedRoute>
    )
}
