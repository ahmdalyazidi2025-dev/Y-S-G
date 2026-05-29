"use client"

import { BarChart3, Package, Users, ClipboardList, Image as LugideImage, MessageCircle, Settings, Layers, Camera, LayoutDashboard, LogOut, ChevronRight, Activity, UserPlus, KeyRound, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useStore } from "@/context/store-context"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV_ITEMS = [
    { title: "الرئيسية", icon: LayoutDashboard, href: "/admin", color: "text-slate-800 dark:text-slate-200" },
    { title: "المنتجات", icon: Package, href: "/admin/products", color: "text-blue-400" },
    { title: "الأقسام", icon: Layers, href: "/admin/categories", color: "text-primary" },
    { title: "العملاء", icon: Users, href: "/admin/customers", color: "text-teal-400" },
    { title: "الإحصائيات", icon: BarChart3, href: "/admin/analytics", color: "text-indigo-400" },
    { title: "الطلبات", icon: ClipboardList, href: "/admin/orders", color: "text-orange-400" },
    { title: "طلبات التوفير", icon: Camera, href: "/admin/requests", color: "text-purple-400" },
    { title: "استعادة كلمة المرور", icon: KeyRound, href: "/admin/password-requests", color: "text-yellow-400" },
    { title: "صور العرض", icon: LugideImage, href: "/admin/banners", color: "text-pink-400" },
    { title: "الدردشة", icon: MessageCircle, href: "/admin/chat", color: "text-indigo-400" },
    { title: "طلبات الانضمام", icon: UserPlus, href: "/admin/join-requests", color: "text-emerald-400" },
    { title: "حالة النظام", icon: Activity, href: "/admin/system", color: "text-rose-400" },
    { title: "الإعدادات", icon: Settings, href: "/admin/settings", color: "text-slate-400" },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { logout, currentUser, joinRequests = [], passwordRequests = [], orders = [], productRequests = [], messages = [] } = useStore()

    const getBadgeCount = (href: string) => {
        if (href === "/admin/join-requests") return joinRequests.length
        if (href === "/admin/password-requests") return passwordRequests.length
        if (href === "/admin/orders") return orders.filter((o: any) => o.status === 'pending').length
        if (href === "/admin/requests") return productRequests.filter((r: any) => r.status === 'pending').length
        if (href === "/admin/chat") return messages.filter((m: any) => !m.isAdmin && !m.read).length
        return 0
    }

    const handleLogout = () => {
        logout()
        router.push("/?logout=true")
    }

    const canAccess = (item: typeof NAV_ITEMS[0]) => {
        if (!currentUser) return false
        if (currentUser.role === "admin") return true
        if (item.href === "/admin") return true

        const perms: Record<string, string> = {
            "/admin/products": "products",
            "/admin/categories": "products",
            "/admin/customers": "customers",
            "/admin/analytics": "sales",
            "/admin/orders": "orders",
            "/admin/requests": "orders",
            "/admin/password-requests": "customers",
            "/admin/banners": "settings",
            "/admin/chat": "chat",
            "/admin/join-requests": "customers",
            "/admin/system": "settings",
            "/admin/settings": "settings",
        }

        const required = perms[item.href]
        return currentUser.permissions?.includes(required)
    }

    const filteredNavItems = NAV_ITEMS.filter(canAccess)

    return (
        <aside className="fixed right-0 top-0 bottom-0 w-64 glass border-l border-slate-200/80 dark:border-white/5 z-50 hidden lg:flex flex-col p-6 gap-8">
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-2">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                    <Image
                        src="/logo.jpg"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="rounded-full object-cover border border-slate-200 dark:border-white/10 relative z-10"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">YSG GROUP</span>
                    <span className="text-[8px] text-primary font-bold uppercase tracking-[0.2em]">Core Control</span>
                </div>
            </div>

            {/* Navigation with internal scrolling to prevent cutoff */}
            <nav className="flex-1 space-y-2 overflow-y-auto pr-1 no-scrollbar max-h-[calc(100vh-280px)]">
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
                                        ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10 w-full">
                                    <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : item.color)} />
                                    <span className="text-xs font-bold flex-1 text-right">{item.title}</span>
                                    {getBadgeCount(item.href) > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-[18px] ml-1 shadow-sm shadow-red-500/30 animate-pulse">
                                            {getBadgeCount(item.href)}
                                        </span>
                                    )}
                                </div>

                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                                    />
                                )}

                                <ChevronRight className={cn(
                                    "w-3 h-3 transition-transform opacity-0 group-hover:opacity-100",
                                    isActive ? "opacity-100 text-primary" : "text-slate-650 dark:text-slate-600"
                                )} />
                            </motion.div>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-white/5 flex flex-col gap-3">
                {/* Global Store Sharing button in sidebar */}
                <button
                    onClick={() => {
                        try {
                            const storefrontLink = window.location.origin
                            navigator.clipboard.writeText(storefrontLink)
                            import("sonner").then(({ toast }) => {
                                toast.success("تم نسخ رابط المتجر بنجاح!", { description: "رابط متجر العملاء جاهز الآن للمشاركة 🔗" })
                            })
                        } catch (e) {
                            console.error(e)
                        }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-orange-500 hover:bg-orange-500/10 border border-orange-500/20 bg-orange-500/5 transition-all group cursor-pointer text-right justify-start"
                    title="نسخ رابط المتجر للعملاء"
                >
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-xs font-black">نسخ رابط المتجر</span>
                </button>

                <div className="flex justify-between items-center px-4 py-1.5 bg-slate-100/50 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">المظهر</span>
                    <ThemeToggle />
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-red-500 dark:text-red-400 hover:bg-red-400/10 transition-colors group cursor-pointer text-right justify-start"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
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
        { title: "الطلبات", icon: ClipboardList, href: "/admin/orders" },
        { title: "الدردشة", icon: MessageCircle, href: "/admin/chat" },
        { title: "الإعدادات", icon: Settings, href: "/admin/settings" },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 glass border-t border-slate-200/80 dark:border-white/5 z-[60] flex items-center justify-around lg:hidden px-2 pb-safe">
            {BOTTOM_ITEMS.filter(item => {
                if (!currentUser) return false
                if (currentUser.role === "admin") return true
                if (item.href === "/admin") return true
                const perms: Record<string, string> = {
                    "/admin/products": "products",
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
                            isActive ? "text-primary scale-110" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
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
