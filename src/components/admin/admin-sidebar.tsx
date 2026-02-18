"use client"

import { BarChart3, Package, Users, ClipboardList, Image as LugideImage, MessageCircle, Settings, Layers, Camera, LayoutDashboard, LogOut, ChevronRight, Shield, Activity, Tag, UserPlus, KeyRound } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useStore } from "@/context/store-context"
import { ThemeToggle } from "@/components/theme-toggle"


const NAV_ITEMS = [
    { title: "الرئيسية", icon: LayoutDashboard, href: "/admin", color: "text-foreground" },
    { title: "المنتجات والعروض", icon: Package, href: "/admin/products", color: "text-blue-400" },
    { title: "الأقسام", icon: Layers, href: "/admin/categories", color: "text-primary" },
    { title: "العملاء", icon: Users, href: "/admin/customers", color: "text-teal-400" },
    { title: "الإحصائيات", icon: BarChart3, href: "/admin/reports", color: "text-indigo-400" },
    { title: "الطلبات", icon: ClipboardList, href: "/admin/orders", color: "text-orange-400" },
    { title: "طلبات التوفير", icon: Camera, href: "/admin/requests", color: "text-purple-400" },
    { title: "استعادة كلمة المرور", icon: KeyRound, href: "/admin/password-requests", color: "text-yellow-400" },
    { title: "صور العرض", icon: LugideImage, href: "/admin/banners", color: "text-pink-400" },
    { title: "الدردشة", icon: MessageCircle, href: "/admin/chat", color: "text-indigo-400" },
    { title: "طلبات الانضمام", icon: UserPlus, href: "/admin/join-requests", color: "text-emerald-400" },
    { title: "حالة النظام", icon: Activity, href: "/admin/system", color: "text-rose-400" },
    { title: "الإعدادات", icon: Settings, href: "/admin/settings", color: "text-slate-400" },
]

const toDate = (d: any) => {
    if (d?.toDate) return d.toDate()
    if (d instanceof Date) return d
    return new Date(d || 0)
}

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout, currentUser, authInitialized, markNotificationsAsRead, adminPreferences, orders, joinRequests, passwordRequests, messages, productRequests, customers } = useStore()

    // If we have a user, show the sidebar immediately (optimistic). 
    // If no user AND not initialized, then hide (loading state).
    if (!authInitialized && !currentUser) return null


    const handleLogout = () => {
        logout()
        router.push("/?logout=true")
    }

    const canAccess = (item: typeof NAV_ITEMS[0]) => {
        if (!currentUser) return false
        if (currentUser.role === "admin") return true
        if (currentUser.permissions?.includes("all")) return true
        if (item.href === "/admin") return true

        const perms: Record<string, string> = {
            "/admin/products": "products",
            "/admin/offers": "products",
            "/admin/categories": "products",
            "/admin/customers": "customers",
            "/admin/reports": "sales",
            "/admin/orders": "orders",
            "/admin/requests": "orders",
            "/admin/banners": "settings",
            "/admin/chat": "chat",
            "/admin/password-requests": "customers",
            "/admin/join-requests": "customers", // Map to customers permission
            "/admin/system": "settings",
            "/admin/settings": "settings",
        }

        const required = perms[item.href]
        return currentUser.permissions?.includes(required)
    }

    const filteredNavItems = NAV_ITEMS.filter(canAccess)

    return (
        <aside className="fixed right-0 top-0 bottom-0 w-64 glass border-l border-border z-50 hidden lg:flex flex-col p-6 gap-6 overflow-y-auto no-scrollbar">
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-2 shrink-0">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                    <Image
                        src="/logo.jpg"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="rounded-full object-cover border border-white/10 relative z-10"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground tracking-tighter">YSG GROUP</span>
                    <span className="text-[8px] text-primary font-bold uppercase tracking-[0.2em]">Core Control</span>
                </div>
            </div>

            {/* Theme Toggle - High Visibility & Compact */}
            <div className="px-4 flex justify-center pb-4 border-b border-border/50 shrink-0">
                <div className="scale-75 origin-center">
                    <ThemeToggle />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                <p className="px-4 text-[10px] text-foreground font-bold uppercase tracking-[0.2em] mb-4">Management</p>
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                                // Smart Badge Clearing handles this via page useEffects usually, 
                                // but we can also trigger here for immediate feedback if needed.
                                // However, keeping it in page load is safer for "seen" logic.
                                if (item.href === '/admin/chat') {
                                    // markNotificationsAsRead('chat') // Deprecated in favor of markSectionAsViewed in page
                                }
                            }}
                        >
                            <motion.div
                                whileHover={{ x: -4 }}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-2xl transition-all group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-foreground border border-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : item.color)} />
                                    <span className="text-xs font-bold">{item.title}</span>
                                    {(() => {
                                        let count = 0
                                        const lastViewed = adminPreferences?.lastViewed || {}

                                        if (item.href === "/admin/orders") {
                                            const lastDate = toDate(lastViewed.orders)
                                            count = orders.filter(o => o.status === "pending" && toDate(o.createdAt) > lastDate).length
                                        } else if (item.href === "/admin/requests") {
                                            const lastDate = toDate(lastViewed.requests)
                                            count = productRequests.filter(r => r.status === "pending" && toDate(r.createdAt) > lastDate).length
                                        } else if (item.href === "/admin/chat") {
                                            const lastDate = toDate(lastViewed.chat)
                                            count = messages.filter(m => !m.isAdmin && !m.read && toDate(m.createdAt) > lastDate).length
                                        } else if (item.href === "/admin/password-requests") {
                                            const lastDate = toDate(lastViewed.passwordRequests || lastViewed.customers)
                                            count = passwordRequests.filter(r => toDate(r.createdAt) > lastDate).length
                                        } else if (item.href === "/admin/join-requests") {
                                            const lastDate = toDate(lastViewed.joinRequests || lastViewed.customers)
                                            count = joinRequests.filter(r => toDate(r.createdAt) > lastDate).length
                                        } else if (item.href === "/admin/customers") {
                                            const lastDate = toDate(lastViewed.customers)
                                            count = customers.filter(c => toDate(c.createdAt) > lastDate).length
                                        }

                                        if (count > 0) {
                                            return (
                                                <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in shadow-lg shadow-red-500/20">
                                                    {count > 99 ? '99+' : count}
                                                </span>
                                            )
                                        }
                                        return null
                                    })()}
                                </div>

                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                                    />
                                )}

                                <ChevronRight className={cn(
                                    "w-3 h-3 transition-transform opacity-0 group-hover:opacity-100",
                                    isActive ? "opacity-100 text-primary" : "text-slate-600"
                                )} />
                            </motion.div>
                        </Link>
                    )
                })}
            </nav>

            {/* Debug Info - Temporary */}
            <div className="px-4 py-2 mt-2">
                <p className="text-[10px] text-yellow-500 font-mono">
                    Debug: {currentUser ? `${currentUser.role} (${currentUser.id.slice(0, 4)})` : "No User"}
                </p>
                <p className="text-[10px] text-foreground font-mono">
                    Items: {filteredNavItems.length}
                </p>
            </div>

            {/* Bottom Section */}
            <div className="pt-6 border-t border-border space-y-2">
                {currentUser && (
                    <div className="px-4 py-2 bg-muted/50 rounded-xl border border-border">
                        <p className="text-[10px] text-muted-foreground">Logged in as:</p>
                        <p className="text-xs font-bold text-foreground truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-primary font-mono">{currentUser.role || "No Role"}</p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition-colors group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold">تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    )
}

export function AdminMobileNav() {
    const pathname = usePathname()
    const { currentUser, adminPreferences, orders, joinRequests, messages, productRequests, customers } = useStore()
    // Simplified items for mobile bottom bar
    const BOTTOM_ITEMS = [
        { title: "الرئيسية", icon: LayoutDashboard, href: "/admin" },
        { title: "المنتجات والعروض", icon: Package, href: "/admin/products" },
        { title: "العملاء", icon: Users, href: "/admin/customers" },
        { title: "الطلبات", icon: ClipboardList, href: "/admin/orders" },
        { title: "الدردشة", icon: MessageCircle, href: "/admin/chat" },

        { name: "طلبات الانضمام", icon: UserPlus, href: "/admin/join-requests" },
        { name: "الإعدادات", icon: Settings, href: "/admin/settings" },
    ]

    return (
        <>
            {/* Mobile Theme Toggle (Floating above nav) */}
            <div className="fixed bottom-20 left-4 z-[60] lg:hidden scale-75 origin-bottom-left">
                <ThemeToggle className="shadow-lg border-primary/20" />
            </div>

            <nav className="fixed bottom-0 left-0 right-0 h-16 glass border-t border-border z-[60] flex items-center justify-around lg:hidden px-2 pb-safe">
                {BOTTOM_ITEMS.filter(item => {
                    if (!currentUser) return false
                    if (currentUser.role === "admin") return true
                    if (item.href === "/admin") return true
                    const perms: Record<string, string> = {
                        "/admin/products": "products",
                        "/admin/offers": "products",
                        "/admin/customers": "customers",
                        "/admin/orders": "orders",
                        "/admin/chat": "chat",

                        "/admin/settings": "settings",
                    }
                    return currentUser.permissions?.includes(perms[item.href])
                }).map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href} className="flex-1">
                            <div className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-all",
                                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                            )}>
                                <div className={cn(
                                    "p-1.5 rounded-xl transition-all",
                                    isActive ? "bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-transparent"
                                )}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold">{item.title}</span>
                                {(() => {
                                    let count = 0
                                    const lastViewed = adminPreferences?.lastViewed || {}

                                    if (item.href === "/admin/orders") {
                                        const lastDate = toDate(lastViewed.orders)
                                        count = orders.filter(o => o.status === "pending" && toDate(o.createdAt) > lastDate).length
                                    } else if (item.href === "/admin/requests") {
                                        const lastDate = toDate(lastViewed.requests)
                                        count = productRequests.filter(r => r.status === "pending" && toDate(r.createdAt) > lastDate).length
                                    } else if (item.href === "/admin/chat") {
                                        const lastDate = toDate(lastViewed.chat)
                                        count = messages.filter(m => !m.isAdmin && !m.read && toDate(m.createdAt) > lastDate).length
                                    } else if (item.href === "/admin/join-requests") {
                                        const lastDate = toDate(lastViewed.joinRequests)
                                        count = joinRequests.filter(r => toDate(r.createdAt) > lastDate).length
                                    } else if (item.href === "/admin/customers") {
                                        const lastDate = toDate(lastViewed.customers)
                                        count = customers.filter(c => toDate(c.createdAt) > lastDate).length
                                    }

                                    if (count > 0) {
                                        return (
                                            <span className="absolute top-0 right-1/4 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in border border-background">
                                                {count}
                                            </span>
                                        )
                                    }
                                    return null
                                })()}
                            </div>
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}
