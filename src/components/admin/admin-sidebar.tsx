"use client"

import {
    Package, Users, ClipboardList, Image, MessageCircle,
    Settings, Layers, Camera, LayoutDashboard, LogOut,
    ChevronRight
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useStore } from "@/context/store-context"

const NAV_ITEMS = [
    { title: "الرئيسية", icon: LayoutDashboard, href: "/admin", color: "text-white" },
    { title: "المنتجات", icon: Package, href: "/admin/products", color: "text-blue-400" },
    { title: "الأقسام", icon: Layers, href: "/admin/categories", color: "text-primary" },
    { title: "العملاء", icon: Users, href: "/admin/customers", color: "text-teal-400" },
    { title: "الطلبات", icon: ClipboardList, href: "/admin/orders", color: "text-orange-400" },
    { title: "طلبات التوفير", icon: Camera, href: "/admin/requests", color: "text-purple-400" },
    { title: "صور العرض", icon: Image, href: "/admin/banners", color: "text-pink-400" },
    { title: "الدردشة", icon: MessageCircle, href: "/admin/chat", color: "text-indigo-400" },
    { title: "الإعدادات", icon: Settings, href: "/admin/settings", color: "text-slate-400" },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout } = useStore()

    const handleLogout = () => {
        logout()
        router.push("/?logout=true")
    }

    return (
        <aside className="fixed right-0 top-0 bottom-0 w-64 glass border-l border-white/5 z-50 hidden lg:flex flex-col p-6 gap-8">
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-2">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                    <img
                        src="/logo.jpg"
                        alt="Logo"
                        className="w-10 h-10 rounded-full object-cover border border-white/10 relative z-10"
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
                {NAV_ITEMS.map((item) => {
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

            {/* Bottom Section */}
            <div className="pt-6 border-t border-white/5">
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
    // Simplified items for mobile bottom bar
    const BOTTOM_ITEMS = [
        { title: "الرئيسية", icon: LayoutDashboard, href: "/admin" },
        { title: "المنتجات", icon: Package, href: "/admin/products" },
        { title: "الطلبات", icon: ClipboardList, href: "/admin/orders" },
        { title: "الدردشة", icon: MessageCircle, href: "/admin/chat" },
        { title: "الإعدادات", icon: Settings, href: "/admin/settings" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 glass border-t border-white/5 z-[60] flex items-center justify-around lg:hidden px-2 pb-safe">
            {BOTTOM_ITEMS.map((item) => {
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
