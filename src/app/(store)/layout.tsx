"use client"

import React, { useState, useEffect } from "react"
import { ClipboardList, ShoppingCart, PlusCircle, MessageSquare, Scan, LogOut, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import ScannerModal from "@/components/store/scanner-modal"
import { CartDrawer } from "@/components/store/cart-drawer"
import RequestModal from "@/components/store/request-modal"
import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ProductDetailsModal } from "@/components/store/product-details-modal"
import { Footer } from "@/components/store/footer"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"

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
    const { cart, logout, storeSettings, messages, globalSelectedProduct, setGlobalSelectedProduct, products } = useStore()
    const [unreadChatCount, setUnreadChatCount] = useState(0)

    useEffect(() => {
        if (pathname === "/customer/chat") {
            setUnreadChatCount(0)
            localStorage.setItem("ysg_last_chat_read", Date.now().toString())
        } else {
            const lastReadStr = localStorage.getItem("ysg_last_chat_read")
            const lastRead = lastReadStr ? Number(lastReadStr) : 0
            const count = messages.filter(m => m.isAdmin && m.createdAt.getTime() > lastRead).length
            setUnreadChatCount(count)
        }
    }, [pathname, messages])

    // Global listener for product modal
    useEffect(() => {
        if (typeof window === "undefined") return

        // 1. Check URL parameters globally
        const params = new URLSearchParams(window.location.search)
        const productId = params.get("product")
        if (productId && products.length > 0) {
            const prod = products.find(p => String(p.id).trim().toLowerCase() === String(productId).trim().toLowerCase())
            if (prod) {
                setGlobalSelectedProduct(prod)
                const cleanUrl = window.location.pathname
                window.history.replaceState({}, document.title, cleanUrl)
            }
        }
        
        // 2. Check localStorage globally
        try {
            const pendingId = localStorage.getItem("open_product_id")
            if (pendingId && products.length > 0) {
                const prod = products.find(p => String(p.id).trim().toLowerCase() === String(pendingId).trim().toLowerCase())
                if (prod) {
                    setGlobalSelectedProduct(prod)
                    localStorage.removeItem("open_product_id")
                }
            }
        } catch (e) {
            console.error(e)
        }

        const handleOpenProductModal = (e: Event) => {
            const evProductId = (e as CustomEvent).detail
            if (evProductId && products.length > 0) {
                const prod = products.find(p => String(p.id).trim().toLowerCase() === String(evProductId).trim().toLowerCase())
                if (prod) {
                    setGlobalSelectedProduct(prod)
                }
            }
        }
        window.addEventListener("open-product-modal", handleOpenProductModal)
        return () => window.removeEventListener("open-product-modal", handleOpenProductModal)
    }, [products, setGlobalSelectedProduct, pathname])

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)
    const showBottomNav = pathname === "/customer"

    const handleLogout = () => {
        logout()
        hapticFeedback('medium')
        router.push("/?logout=true")
    }

    const navItems = [
        { name: "الفواتير", icon: ClipboardList, href: "/customer/invoices" },
        { name: "السلة", icon: ShoppingCart, onClick: () => setIsCartOpen(true), badge: cartCount },
        ...(storeSettings?.enableBarcodeScanner !== false ? [
            { name: "الماسح", icon: Scan, isCenter: true, onClick: () => setIsScannerOpen(true) }
        ] : []),
        ...(storeSettings?.enableProductRequests !== false ? [
            { name: "طلب", icon: PlusCircle, onClick: () => setIsRequestOpen(true) }
        ] : []),
        { name: "الدردشة", icon: MessageSquare, href: "/customer/chat", badge: unreadChatCount },
    ]

    return (
        <ProtectedRoute role="customer">
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col items-center overflow-x-hidden relative">
                <div className="w-full max-w-7xl mx-auto flex flex-col min-h-screen relative z-10">
                    <main className={cn("flex-1 px-4 pt-6 w-full", showBottomNav ? "pb-32" : "pb-12")}>
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                    <Image
                                        src="/logo.jpg"
                                        alt="Logo"
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover border-2 border-white/10 relative z-10 shadow-2xl"
                                    />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-sm font-black tracking-widest text-foreground uppercase mb-0.5">YSG SALES</h1>
                                    <p className="text-[8px] text-primary font-bold tracking-[0.3em] uppercase opacity-70">Client Management Hub</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ThemeToggle />
                                <button
                                    onClick={() => {
                                        try {
                                            const shareData = {
                                                title: 'YSG SALES',
                                                text: 'تفضل بزيارة متجرنا الإلكتروني المميز لطلب المنتجات ومتابعة الفواتير والطلبات!',
                                                url: window.location.origin
                                            }
                                            if (navigator.share) {
                                                navigator.share(shareData)
                                            } else {
                                                navigator.clipboard.writeText(window.location.origin)
                                                toast.success("تم نسخ رابط المتجر بنجاح!", { description: "رابط المتجر جاهز الآن للمشاركة 🔗" })
                                            }
                                        } catch (err) {
                                            console.error(err)
                                        }
                                    }}
                                    className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center justify-center cursor-pointer gap-1.5"
                                    title="مشاركة رابط المتجر"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span className="hidden sm:inline text-xs font-bold">مشاركة المتجر</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-5 py-2.5 bg-red-500/10 rounded-2xl text-red-400 hover:bg-red-400/20 transition-all border border-red-500/20 flex items-center gap-2 font-bold text-xs"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">تسجيل الخروج</span>
                                </button>
                            </div>
                        </div>
                        {children}
                    </main>

                    <Footer />

                    {/* Bottom Navigation (Adaptive & Wide) - Moved inside z-10 container to resolve CSS stacking context */}
                    {showBottomNav && (
                        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-md h-16 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl rounded-[24px] z-[45] border border-slate-200/50 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center justify-around px-3 transition-all animate-in slide-in-from-bottom-5 duration-300">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                const Icon = item.icon

                                if (item.isCenter) {
                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => {
                                                item.onClick?.()
                                                hapticFeedback('medium')
                                            }}
                                            className="relative -top-5 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-all border-2 border-white dark:border-slate-950 group"
                                        >
                                            <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                                            <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 -z-10" />
                                        </button>
                                    )
                                }

                                const Content = (
                                    <div className={cn(
                                        "flex flex-col items-center gap-0.5 transition-all relative",
                                        isActive ? "text-primary" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}>
                                        <div className="relative">
                                            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                            {item.badge && item.badge > 0 ? (
                                                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white dark:border-slate-950 px-1">
                                                    {item.badge}
                                                </span>
                                            ) : null}
                                        </div>
                                        <span className="text-[9px] font-bold tracking-wide mt-0.5">{item.name}</span>
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
                    )}
                </div>

                <ScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onRequestProduct={() => setIsRequestOpen(true)}
                />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
                <ProductDetailsModal
                    isOpen={!!globalSelectedProduct}
                    onClose={() => setGlobalSelectedProduct(null)}
                    product={globalSelectedProduct}
                />
            </div>
        </ProtectedRoute>
    )
}
