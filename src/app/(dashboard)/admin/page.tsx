"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Package, Users, ClipboardList, Image as LugideImage, MessageCircle, Settings, Layers,
    Camera, LogOut, TrendingUp, ShoppingBag, UserCheck, Clock, BarChart3,
    type LucideIcon, ArrowRight
} from "lucide-react"
import NextImage from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useStore, type Product, type Order } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { AdminStatsSkeleton, AdminModuleSkeleton } from "@/components/store/skeletons"
import { getVisits, DailyVisit } from "@/lib/analytics"

const ADMIN_MODULES = [
    { title: "المنتجات", icon: Package, link: "/admin/products", gradient: "from-blue-500 to-cyan-400", shadow: "shadow-blue-500/20" },
    { title: "الأقسام", icon: Layers, link: "/admin/categories", gradient: "from-violet-500 to-purple-400", shadow: "shadow-violet-500/20" },
    { title: "كل العملاء", icon: Users, link: "/admin/customers", gradient: "from-emerald-500 to-teal-400", shadow: "shadow-emerald-500/20" },
    { title: "الإحصائيات", icon: BarChart3, link: "/admin/analytics", gradient: "from-amber-500 to-orange-400", shadow: "shadow-amber-500/20" },
    { title: "متابعة الطلبات", icon: ClipboardList, link: "/admin/orders", gradient: "from-pink-500 to-rose-400", shadow: "shadow-pink-500/20" },
    { title: "طلبات التوفير", icon: Camera, link: "/admin/requests", gradient: "from-indigo-500 to-blue-400", shadow: "shadow-indigo-500/20" },
    { title: "صور العرض", icon: LugideImage, link: "/admin/banners", gradient: "from-fuchsia-500 to-pink-400", shadow: "shadow-fuchsia-500/20" },
    { title: "الدردشة", icon: MessageCircle, link: "/admin/chat", gradient: "from-sky-500 to-cyan-400", shadow: "shadow-sky-500/20" },
    { title: "الإعدادات", icon: Settings, link: "/admin/settings", gradient: "from-slate-500 to-gray-400", shadow: "shadow-slate-500/20" },
]

export default function AdminDashboard() {
    const { orders, customers, products, logout, currentUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [statsTimeRange, setStatsTimeRange] = useState<"today" | "week" | "month" | "year" | "all">("all")
    const [filteredVisits, setFilteredVisits] = useState(0)
    const router = useRouter()

    const filteredModules = ADMIN_MODULES.filter(module => {
        if (!currentUser) return false
        if (currentUser.role === "admin") return true

        const perms: Record<string, string> = {
            "/admin/products": "products",
            "/admin/categories": "products",
            "/admin/customers": "customers",
            "/admin/orders": "orders",
            "/admin/requests": "orders",
            "/admin/banners": "settings",
            "/admin/chat": "chat",
            "/admin/settings": "settings",
            "/admin/analytics": "sales",
        }
        return currentUser.permissions?.includes(perms[module.link])
    })

    const handleLogout = () => {
        logout()
        router.push("/?logout=true")
    }

    // Calculate date limits based on range
    const getDateRange = () => {
        const now = new Date()
        const start = new Date()

        switch (statsTimeRange) {
            case "today": start.setHours(0, 0, 0, 0); break;
            case "week": start.setDate(now.getDate() - 7); break;
            case "month": start.setMonth(now.getMonth() - 1); break;
            case "year": start.setFullYear(now.getFullYear() - 1); break;
            case "all": start.setFullYear(2000); break;
        }
        return start
    }

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800)

        const fetchVisits = async () => {
            const start = getDateRange()
            const end = new Date()

            const visits = await getVisits(start, end)
            const count = visits.reduce((acc, v) => acc + v.count, 0)
            setFilteredVisits(count)
        }
        fetchVisits()

        return () => clearTimeout(timer)
    }, [statsTimeRange])

    const filteredOrders = orders.filter(o => new Date(o.createdAt) >= getDateRange())
    const filteredCustomers = customers.filter(c => {
        if (!c.createdAt) return false
        const date = c.createdAt instanceof Date ? c.createdAt : (c.createdAt as any).toDate()
        return date.getTime() >= getDateRange().getTime()
    })

    // Metrics
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0)
    // Active orders are usually "current" state, not historical, maybe we keep them absolute or filter by "created recently" and "still active"? 
    // For dashboard, "Active Orders" usually implies "Current Workload". Filtering by date might be confusing if it hides old active orders.
    // Let's keep Active Orders as "Current Active Workload" (All time pending/processing), but Sales as "Filtered Revenue".
    const pendingOrders = orders.filter(o => o.status === "processing" || o.status === "pending").length
    const newCustomersCount = statsTimeRange === 'all' ? customers.length : filteredCustomers.length

    return (
        <div className="space-y-8 pt-4 pb-20 max-w-7xl mx-auto px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                        <NextImage
                            src="/logo.jpg"
                            alt="Logo"
                            width={56}
                            height={56}
                            className="w-14 h-14 rounded-full object-cover border-2 border-border relative z-10 shadow-2xl"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">النظام الذكي</h1>
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">مركز التحكم الذكي</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="flex bg-muted/50 p-1 rounded-full border border-border">
                        {(["today", "week", "month", "all"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setStatsTimeRange(range)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all",
                                    statsTimeRange === range
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                {range === "today" && "اليوم"}
                                {range === "week" && "أسبوع"}
                                {range === "month" && "شهر"}
                                {range === "all" && "الكل"}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>




            {/* Premium Stats Grid - Only for Admins or Staff with 'sales' permission */}
            {(currentUser?.role === 'admin' || currentUser?.permissions?.includes('sales')) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            [1, 2, 3].map(i => <AdminStatsSkeleton key={i} />)
                        ) : (
                            <>
                                <StatsCard
                                    title={statsTimeRange === 'all' ? "إجمالي المبيعات" : "مبيعات الفترة"}
                                    value={`${totalSales.toLocaleString()} ر.س`}
                                    icon={TrendingUp}
                                    gradient="from-emerald-500/10 to-teal-500/5"
                                    border="border-emerald-500/20"
                                    iconColor="text-emerald-500"
                                    href="/admin/analytics"
                                />
                                <StatsCard
                                    title="الطلبات النشطة"
                                    value={pendingOrders.toString()}
                                    icon={ShoppingBag}
                                    gradient="from-blue-500/10 to-indigo-500/5"
                                    border="border-blue-500/20"
                                    iconColor="text-blue-500"
                                    href="/admin/orders"
                                    subtitle="عبء العمل الحالي"
                                />
                                <StatsCard
                                    title={statsTimeRange === 'all' ? "إجمالي العملاء" : "عملاء جدد"}
                                    value={newCustomersCount.toString()}
                                    icon={UserCheck}
                                    gradient="from-violet-500/10 to-purple-500/5"
                                    border="border-violet-500/20"
                                    iconColor="text-violet-500"
                                    href="/admin/customers"
                                />
                                <StatsCard
                                    title={statsTimeRange === 'today' ? "زيارات اليوم" : "زيارات الفترة"}
                                    value={filteredVisits.toLocaleString()}
                                    icon={Users}
                                    gradient="from-pink-500/10 to-rose-500/5"
                                    border="border-pink-500/20"
                                    iconColor="text-pink-500"
                                    href="/admin/analytics"
                                />
                            </>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Modern Module Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence>
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6, 7, 8].map(i => <AdminModuleSkeleton key={i} index={i} />)
                    ) : (
                        filteredModules.map((module, idx) => {
                            const isLarge = idx === 0 || idx === 1; // First two are large
                            return (
                                <Link key={idx} href={module.link} className={cn(
                                    "group relative",
                                    isLarge ? "col-span-2 lg:col-span-2 row-span-1" : "col-span-1"
                                )}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="h-full min-h-[160px] md:min-h-[180px] rounded-[2rem] relative overflow-hidden bg-card/50 border border-border hover:border-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                                    >
                                        {/* Background Gradient Mesh */}
                                        <div className={cn(
                                            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                                            module.gradient
                                        )} />

                                        {/* Icon Container */}
                                        <div className="absolute top-6 right-6">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl",
                                                module.gradient,
                                                module.shadow
                                            )}>
                                                <module.icon className="w-6 h-6 text-white" strokeWidth={2} />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="absolute bottom-6 right-6 z-10">
                                            <h3 className="text-xl font-bold text-foreground mb-1 group-hover:translate-x-1 transition-transform">{module.title}</h3>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest group-hover:text-primary transition-colors">فتح القسم</p>
                                        </div>

                                        {/* Decorative Elements */}
                                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                                    </motion.div>
                                </Link>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Actions / Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="lg:col-span-2 rounded-[2rem] bg-card/30 border border-border p-6 md:p-8 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">الأكثر مبيعاً</h2>
                            <p className="text-xs text-muted-foreground">أفضل المنتجات أداءً</p>
                        </div>
                        <Link href="/admin/analytics">
                            <Button variant="outline" size="sm" className="rounded-full h-8 text-xs border-border hover:bg-muted">
                                عرض الكل
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.slice(0, 4).map((p: Product, i: number) => (
                            <div key={p.id} className="flex items-center gap-4 p-3 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors group shadow-sm">
                                <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden relative">
                                    {p.image ? (
                                        <NextImage src={p.image} alt={p.name} fill className="object-cover" />
                                    ) : (
                                        <Package className="w-5 h-5 m-auto text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-foreground truncate">{p.name}</h4>
                                    <p className="text-xs text-muted-foreground">{p.pricePiece} ر.س</p>
                                </div>
                                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                    #{i + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-[2rem] bg-card/30 border border-border p-6 md:p-8 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-foreground">آخر الطلبات</h2>
                        <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-6">
                        {orders.slice(0, 5).map((o: Order, idx: number) => (
                            <div key={o.id} className="flex items-start gap-4 relative group">
                                {idx !== 4 && (
                                    <div className="absolute right-[19px] top-8 bottom-[-24px] w-[2px] bg-border/50 group-hover:bg-primary/20 transition-colors" />
                                )}

                                {/* Customer Avatar / Name Bubble */}
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 z-10 group-hover:scale-110 transition-transform overflow-hidden">
                                    <span className="text-[10px] font-bold text-blue-500 text-center leading-tight px-1">
                                        {o.customerName.split(" ").slice(0, 2).map(n => n[0]).join("")}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{o.customerName}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">طلب #{o.id} • {o.total} ر.س</p>
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full border border-border/50">
                                                <Clock className="w-3 h-3" />
                                                <time>{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</time>
                                                <span className="mx-0.5">-</span>
                                                <time>{new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</time>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}



function StatsCard({ title, value, icon: Icon, gradient, border, iconColor, href, subtitle }: any) {
    const Content = (
        <div className={cn(
            "relative overflow-hidden h-32 rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] cursor-pointer group bg-card/50 border backdrop-blur-md shadow-sm hover:shadow-md",
            border
        )}>
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-20 group-hover:opacity-40 transition-opacity",
                gradient
            )} />

            <div className="relative z-10 flex justify-between items-start h-full">
                <div className="flex flex-col justify-between h-full">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
                    {subtitle && <p className="text-[10px] text-muted-foreground font-medium">{subtitle}</p>}
                </div>
                <div className={cn(
                    "w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center backdrop-blur-md border border-border group-hover:rotate-12 transition-transform",
                    iconColor
                )}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    )

    if (href) return <Link href={href}>{Content}</Link>
    return Content
}
