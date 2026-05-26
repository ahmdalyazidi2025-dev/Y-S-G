"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Package, Users, ClipboardList, Image as LugideImage, MessageCircle, Settings, Layers,
    Camera, LogOut, TrendingUp, ShoppingBag, UserCheck, Clock, BarChart3,
    type LucideIcon
} from "lucide-react"
import NextImage from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useStore, type Product, type Order } from "@/context/store-context"

const ADMIN_MODULES = [
    {
        title: "إدارة المنتجات", icon: Package, link: "/admin/products",
        color: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-500/30 dark:to-blue-600/10",
        iconBorder: "border border-blue-200 dark:border-blue-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(59,130,246,0.35)]",
        cardGlow: "from-blue-500/8",
    },
    {
        title: "الأقسام", icon: Layers, link: "/admin/categories",
        color: "text-primary",
        iconBg: "bg-gradient-to-br from-primary/20 to-primary/10",
        iconBorder: "border border-primary/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(99,102,241,0.35)]",
        cardGlow: "from-primary/8",
    },
    {
        title: "إدارة العملاء", icon: Users, link: "/admin/customers",
        color: "text-teal-600 dark:text-teal-400",
        iconBg: "bg-gradient-to-br from-teal-500/20 to-teal-600/10 dark:from-teal-500/30 dark:to-teal-600/10",
        iconBorder: "border border-teal-200 dark:border-teal-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(20,184,166,0.35)]",
        cardGlow: "from-teal-500/8",
    },
    {
        title: "الإحصائيات", icon: BarChart3, link: "/admin/analytics",
        color: "text-indigo-600 dark:text-indigo-400",
        iconBg: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 dark:from-indigo-500/30 dark:to-indigo-600/10",
        iconBorder: "border border-indigo-200 dark:border-indigo-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(99,102,241,0.35)]",
        cardGlow: "from-indigo-500/8",
    },
    {
        title: "متابعة الطلبات", icon: ClipboardList, link: "/admin/orders",
        color: "text-orange-600 dark:text-orange-400",
        iconBg: "bg-gradient-to-br from-orange-500/20 to-orange-600/10 dark:from-orange-500/30 dark:to-orange-600/10",
        iconBorder: "border border-orange-200 dark:border-orange-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(249,115,22,0.35)]",
        cardGlow: "from-orange-500/8",
    },
    {
        title: "طلبات التوفير", icon: Camera, link: "/admin/requests",
        color: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-gradient-to-br from-purple-500/20 to-purple-600/10 dark:from-purple-500/30 dark:to-purple-600/10",
        iconBorder: "border border-purple-200 dark:border-purple-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(168,85,247,0.35)]",
        cardGlow: "from-purple-500/8",
    },
    {
        title: "صور العرض", icon: LugideImage, link: "/admin/banners",
        color: "text-pink-600 dark:text-pink-400",
        iconBg: "bg-gradient-to-br from-pink-500/20 to-pink-600/10 dark:from-pink-500/30 dark:to-pink-600/10",
        iconBorder: "border border-pink-200 dark:border-pink-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(236,72,153,0.35)]",
        cardGlow: "from-pink-500/8",
    },
    {
        title: "الدردشة", icon: MessageCircle, link: "/admin/chat",
        color: "text-sky-600 dark:text-sky-400",
        iconBg: "bg-gradient-to-br from-sky-500/20 to-sky-600/10 dark:from-sky-500/30 dark:to-sky-600/10",
        iconBorder: "border border-sky-200 dark:border-sky-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(14,165,233,0.35)]",
        cardGlow: "from-sky-500/8",
    },
    {
        title: "الإعدادات", icon: Settings, link: "/admin/settings",
        color: "text-slate-600 dark:text-slate-400",
        iconBg: "bg-gradient-to-br from-slate-400/20 to-slate-500/10 dark:from-slate-500/30 dark:to-slate-600/10",
        iconBorder: "border border-slate-200 dark:border-slate-500/20",
        iconGlow: "group-hover:shadow-[0_0_24px_rgba(148,163,184,0.3)]",
        cardGlow: "from-slate-400/8",
    },
]

export default function AdminDashboard() {
    const { orders, customers, products, logout, currentUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
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
        }
        return currentUser.permissions?.includes(perms[module.link])
    })

    const handleLogout = () => {
        logout()
        router.push("/?logout=true")
    }

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const totalSales = orders.reduce((sum, o) => sum + o.total, 0)
    const pendingOrders = orders.filter(o => o.status === "processing" || o.status === "pending").length

    return (
        <div className="space-y-8 pt-4 pb-20 max-w-7xl mx-auto px-4 md:px-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                        <NextImage
                            src="/logo.jpg"
                            alt="Logo"
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-white/10 relative z-10"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">النظام الذكي</h1>
                        <p className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.2em]">Analytical Core Control</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2.5 glass rounded-2xl text-red-500 dark:text-red-400 hover:text-red-650 dark:hover:text-red-300 hover:bg-red-400/10 border border-slate-200/80 dark:border-white/5 transition-all cursor-pointer"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        [1, 2, 3].map(i => <SkeletonStats key={i} />)
                    ) : (
                        <>
                            <StatsCard
                                title="إجمالي المبيعات"
                                value={`${totalSales.toLocaleString()} ر.س`}
                                icon={TrendingUp}
                                color="text-emerald-600 dark:text-emerald-450"
                                glow="bg-emerald-450/20"
                            />
                            <StatsCard
                                title="الطلبات النشطة"
                                value={pendingOrders.toString()}
                                icon={ShoppingBag}
                                color="text-sky-600 dark:text-sky-450"
                                glow="bg-sky-450/20"
                            />
                            <StatsCard
                                title="قاعدة العملاء"
                                value={customers.length.toString()}
                                icon={UserCheck}
                                color="text-violet-600 dark:text-violet-450"
                                glow="bg-violet-450/20"
                            />
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Bento Module Grid - Perfectly Balanced Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
                <AnimatePresence>
                    {isLoading ? (
                        [1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonModule key={i} index={i} />)
                    ) : (
                        filteredModules.map((module, idx) => {
                            const isLarge = idx === 0 || idx === 1 || idx === 6 || idx === 7;
                            return (
                                <Link key={idx} href={module.link} className={cn(
                                    "group",
                                    isLarge ? "col-span-1 lg:col-span-2" : "col-span-1"
                                )}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -6, scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 h-44 relative border-slate-200/80 dark:border-white/5 group-hover:border-primary/20 overflow-hidden transition-all duration-300"
                                    >
                                        {/* Card background glow on hover */}
                                        <div className={cn("absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500", module.cardGlow)} />

                                        {/* Icon — circular, soft, modern */}
                                        <div className={cn(
                                            "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-115 group-hover:shadow-lg",
                                            module.iconBg,
                                            module.iconBorder,
                                            module.iconGlow,
                                            module.color
                                        )}>
                                            <module.icon className="w-6 h-6" strokeWidth={1.8} />
                                        </div>

                                        <div className="space-y-0.5 z-10">
                                            <span className="font-bold text-sm text-slate-800 dark:text-white block">{module.title}</span>
                                            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-[0.2em]">System Module</span>
                                        </div>

                                        {/* Bottom accent */}
                                        <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] group-hover:w-1/3 transition-all duration-500 rounded-t-full", module.iconBg.includes('blue') ? 'bg-blue-500' : module.iconBg.includes('teal') ? 'bg-teal-500' : module.iconBg.includes('orange') ? 'bg-orange-500' : module.iconBg.includes('purple') ? 'bg-purple-500' : module.iconBg.includes('pink') ? 'bg-pink-500' : module.iconBg.includes('sky') ? 'bg-sky-500' : module.iconBg.includes('indigo') ? 'bg-indigo-500' : 'bg-primary')} />

                                        <div className="absolute top-3 right-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products - Large Card */}
                <div className="lg:col-span-2 glass-card p-8 border-slate-200/80 dark:border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-black text-lg text-slate-900 dark:text-white">تحليل المنتجات</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Performance Insights</p>
                        </div>
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Layers className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isLoading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)
                        ) : (
                            products.slice(0, 4).map((p: Product, i: number) => (
                                <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all hover:bg-slate-100/50 dark:hover:bg-white/[0.07] group">
                                    <div className="w-14 h-14 bg-slate-100/70 dark:bg-white/5 rounded-2xl flex items-center justify-center text-xs text-slate-500 overflow-hidden relative border border-slate-200 dark:border-white/10">
                                        {p.image ? (
                                            <NextImage
                                                src={p.image}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <Package className="w-6 h-6 opacity-30" />
                                        )}
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{p.name}</p>
                                        <p className="text-[10px] text-primary">{p.pricePiece} ر.س</p>
                                        <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full mt-2">
                                            <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${100 - (i * 20)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity - Side Card */}
                <div className="glass-card p-8 border-slate-200/80 dark:border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-black text-lg text-slate-900 dark:text-white">موجز العمليات</h2>
                        <Clock className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                    </div>
                    <div className="space-y-6">
                        {isLoading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-xl skeleton" />
                                    <div className="space-y-2 flex-1">
                                        <div className="w-3/4 h-2 skeleton" />
                                        <div className="w-1/2 h-2 skeleton opacity-50" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            orders.slice(0, 5).map((o: Order, idx: number) => (
                                <div key={o.id} className="flex gap-4 relative">
                                    {idx !== 4 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-[2px] bg-slate-200 dark:bg-white/5" />}
                                    <div className="w-8 h-8 rounded-xl bg-orange-400/10 flex items-center justify-center text-orange-550 dark:text-orange-400 flex-shrink-0 z-10 border border-orange-400/20">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 animate-pulse" />
                                    </div>
                                    <div className="space-y-1 pt-0.5">
                                        <p className="text-xs text-slate-700 dark:text-slate-200">طلب جديد: <span className="font-bold">#{o.id}</span></p>
                                        <p className="text-[10px] text-slate-500 font-medium">{o.customerName} • {o.total} ر.س</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function SkeletonStats() {
    return (
        <div className="glass-card p-6 h-32 flex flex-col gap-4 relative overflow-hidden border-slate-200/80 dark:border-white/5">
            <div className="flex items-center justify-between">
                <div className="w-12 h-12 skeleton rounded-2xl" />
                <div className="space-y-2 flex flex-col items-end">
                    <div className="w-16 h-2 skeleton" />
                    <div className="w-24 h-6 skeleton" />
                </div>
            </div>
            <div className="w-full h-1.5 skeleton rounded-full" />
        </div>
    )
}

function SkeletonModule({ index }: { index: number }) {
    const isLarge = index === 1 || index === 2 || index === 7 || index === 8;
    return (
        <div className={cn(
            "glass-card p-8 h-48 relative border-slate-200/80 dark:border-white/5 overflow-hidden",
            isLarge ? "col-span-1 lg:col-span-2" : "col-span-1"
        )}>
            <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="w-20 h-20 skeleton rounded-[2rem]" />
                <div className="space-y-2">
                    <div className="w-24 h-3 skeleton mx-auto" />
                    <div className="w-16 h-2 skeleton mx-auto opacity-50" />
                </div>
            </div>
        </div>
    )
}

function StatsCard({ title, value, icon: Icon, color, glow }: { title: string; value: string; icon: LucideIcon; color: string; glow: string; }) {
    return (
        <div className="glass-card p-6 h-32 flex flex-col gap-4 relative overflow-hidden border-slate-200/80 dark:border-white/5">
            <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-40", glow)} />
            <div className="flex items-center justify-between relative z-10">
                <div className={cn(
                    "p-3 rounded-2xl transition-all duration-300",
                    "bg-gradient-to-br from-current/10 to-current/5",
                    "border border-current/15",
                    color
                )}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{title}</p>
                    <p className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter">{value}</p>
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative z-10">
                <div className={cn("h-full w-2/3 rounded-full opacity-50", glow)} />
            </div>
        </div>
    )
}

