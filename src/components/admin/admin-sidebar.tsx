"use client"

import { BarChart3, Package, Users, ClipboardList, Image as LugideImage, MessageCircle, Settings, Layers, Camera, LayoutDashboard, LogOut, ChevronRight, Shield, Activity } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useStore } from "@/context/store-context"


const NAV_ITEMS = [
    { title: "الرئيسية", icon: LayoutDashboard, href: "/admin", color: "text-white" },
    { title: "المنتجات", icon: Package, href: "/admin/products", color: "text-blue-400" },
    { title: "الأقسام", icon: Layers, href: "/admin/categories", color: "text-primary" },
    { title: "العملاء", icon: Users, href: "/admin/customers", color: "text-teal-400" },
    { title: "الإحصائيات", icon: BarChart3, href: "/admin/analytics", color: "text-indigo-400" },
    { title: "الطلبات", icon: ClipboardList, href: "/admin/orders", color: "text-orange-400" },
    { title: "طلبات التوفير", icon: Camera, href: "/admin/requests", color: "text-purple-400" },
    { title: "صور العرض", icon: LugideImage, href: "/admin/banners", color: "text-pink-400" },
    { title: "الدردشة", icon: MessageCircle, href: "/admin/chat", color: "text-indigo-400" },
    { title: "إدارة الكيان", icon: Shield, href: "/admin/entity", color: "text-emerald-400" },
    { title: "حالة النظام", icon: Activity, href: "/admin/system", color: "text-rose-400" },
    { title: "الإعدادات", icon: Settings, href: "/admin/settings", color: "text-slate-400" },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout, currentUser, authInitialized } = useStore()

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
            "/admin/categories": "products",
            "/admin/customers": "customers",
            "/admin/analytics": "sales",
            "/admin/orders": "orders",
            "/admin/requests": "orders",
            "/admin/banners": "settings",
            "/admin/chat": "chat",
            "/admin/entity": "settings",
            "/admin/system": "settings",
            "/admin/settings": "settings",
        }

        const required = perms[item.href]
        return currentUser.permissions?.includes(required)
    }

    const filteredNavItems = NAV_ITEMS.filter(canAccess)

    return (
        <aside className="fixed right-0 top-0 bottom-0 w-64 glass border-l border-white/5 z-50 hidden lg:flex flex-col p-6 gap-8">
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-2">
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
                    <span className="text-sm font-black text-white tracking-tighter">YSG GROUP</span>
                    <span className="text-[8px] text-primary font-bold uppercase tracking-[0.2em]">Core Control</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                <p className="px-4 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-4">Management</p>
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ x: -4 }}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-2xl transition-all group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-white border border-primary/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : item.color)} />
                                    <span className="text-xs font-bold">{item.title}</span>
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
                <p className="text-[10px] text-gray-500 font-mono">
                    Items: {filteredNavItems.length}
                </p>
            </div>

            {/* Bottom Section */}
            <div className="pt-6 border-t border-white/5 space-y-2">
                {currentUser && (
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-slate-400">Logged in as:</p>
                        <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
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
    const { currentUser } = useStore()
    // Simplified items for mobile bottom bar
    const BOTTOM_ITEMS = [
        { title: "الرئيسية", icon: LayoutDashboard, href: "/admin" },
        { title: "المنتجات", icon: Package, href: "/admin/products" },
        { title: "العملاء", icon: Users, href: "/admin/customers" },
        { title: "الطلبات", icon: ClipboardList, href: "/admin/orders" },
        { title: "الدردشة", icon: MessageCircle, href: "/admin/chat" },
        { title: "إدارة الكيان", icon: Shield, href: "/admin/entity" },
        { title: "الإعدادات", icon: Settings, href: "/admin/settings" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 glass border-t border-white/5 z-[60] flex items-center justify-around lg:hidden px-2 pb-safe">
            {BOTTOM_ITEMS.filter(item => {
                if (!currentUser) return false
                if (currentUser.role === "admin") return true
                if (item.href === "/admin") return true
                const perms: Record<string, string> = {
                    "/admin/products": "products",
                    "/admin/customers": "customers",
                    "/admin/orders": "orders",
                    "/admin/chat": "chat",
                    "/admin/entity": "settings",
                    "/admin/settings": "settings",
                }
                return currentUser.permissions?.includes(perms[item.href])
            }).map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link key={item.href} href={item.href} className="flex-1">
                        <div className={cn(
                            "flex flex-col items-center justify-center gap-1 transition-all",
                            isActive ? "text-primary scale-110" : "text-slate-500 hover:text-white"
                        )}>
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all",
                                isActive ? "bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-transparent"
                            )}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold">{item.title}</span>
                        </div>
                    </Link>
                )
            })}
        </nav>
    )
}
