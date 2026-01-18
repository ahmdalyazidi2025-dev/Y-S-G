"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Package, Grid, Users, ClipboardList, Image, MessageCircle, Settings, Layers,
    Camera, ShieldCheck, LogOut, TrendingUp, ShoppingBag, UserCheck, Clock,
    type LucideIcon
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useStore, type Product, type Order } from "@/context/store-context"

const ADMIN_MODULES = [
    { title: "إدارة المنتجات", icon: Package, link: "/admin/products", color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "الأقسام", icon: Layers, link: "/admin/categories", color: "text-primary", bg: "bg-primary/10" },
    { title: "إدارة العملاء", icon: Users, link: "/admin/customers", color: "text-teal-400", bg: "bg-teal-400/10" },
    { title: "متابعة الطلبات", icon: ClipboardList, link: "/admin/orders", color: "text-orange-400", bg: "bg-orange-400/10" },
    { title: "طلبات التوفير", icon: Camera, link: "/admin/requests", color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "صور العرض", icon: Image, link: "/admin/banners", color: "text-pink-400", bg: "bg-pink-400/10" },
    { title: "الدردشة", icon: MessageCircle, link: "/admin/chat", color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { title: "الإعدادات", icon: Settings, link: "/admin/settings", color: "text-slate-400", bg: "bg-slate-400/10" },
]

export default function AdminDashboard() {
    const { orders, customers, products, logout } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

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
                        <img
                            src="/logo.jpg"
                            alt="Logo"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/10 relative z-10"
                        />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">النظام الذكي</h1>
                        <p className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.2em]">Analytical Core Control</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2.5 glass rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-white/5 transition-all"
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
                                color="text-emerald-400"
                                glow="bg-emerald-400/20"
                            />
                            <StatsCard
                                title="الطلبات النشطة"
                                value={pendingOrders.toString()}
                                icon={ShoppingBag}
                                color="text-sky-400"
                                glow="bg-sky-400/20"
                            />
                            <StatsCard
                                title="قاعدة العملاء"
                                value={customers.length.toString()}
                                icon={UserCheck}
                                color="text-violet-400"
                                glow="bg-violet-400/20"
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
                        ADMIN_MODULES.map((module, idx) => {
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
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="glass-card p-8 flex flex-col items-center justify-center text-center gap-6 h-48 relative border-white/5 group-hover:border-primary/50 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className={cn(
                                            "p-5 rounded-[2rem] bg-white/5 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]",
                                            module.color
                                        )}>
                                            <module.icon className="w-10 h-10" strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-1 z-10">
                                            <span className="font-black text-sm text-white block uppercase tracking-[0.15em]">{module.title}</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">System Module</span>
                                        </div>

                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[3px] bg-primary group-hover:w-1/3 transition-all duration-500 rounded-t-full" />

                                        <div className="absolute top-6 right-6 flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
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
                <div className="lg:col-span-2 glass-card p-8 border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-black text-lg text-white">تحليل المنتجات</h2>
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
                                <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07] group">
                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-xs text-slate-500 overflow-hidden relative border border-white/10">
                                        {p.image ? (
                                            <img src={p.image} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <Package className="w-6 h-6 opacity-30" />
                                        )}
                                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-bold text-white leading-tight">{p.name}</p>
                                        <p className="text-[10px] text-primary">{p.pricePiece} ر.س</p>
                                        <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                                            <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${100 - (i * 20)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity - Side Card */}
                <div className="glass-card p-8 border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-black text-lg text-white">موجز العمليات</h2>
                        <Clock className="w-5 h-5 text-orange-400" />
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
                                    {idx !== 4 && <div className="absolute left-[15px] top-8 bottom-[-24px] w-[2px] bg-white/5" />}
                                    <div className="w-8 h-8 rounded-xl bg-orange-400/10 flex items-center justify-center text-orange-400 flex-shrink-0 z-10 border border-orange-400/20">
                                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                                    </div>
                                    <div className="space-y-1 pt-0.5">
                                        <p className="text-xs text-slate-200">طلب جديد: <span className="font-bold">#{o.id}</span></p>
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
        <div className="glass-card p-6 h-32 flex flex-col gap-4 relative overflow-hidden border-white/5">
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
            "glass-card p-8 h-48 relative border-white/5 overflow-hidden",
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
        <div className="glass-card p-6 h-32 flex flex-col gap-4 relative overflow-hidden border-white/5">
            <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity group-hover:opacity-40", glow)} />
            <div className="flex items-center justify-between relative z-10">
                <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform", color)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{title}</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
                </div>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                <div className={cn("h-full w-2/3 rounded-full opacity-50", glow)} />
            </div>
        </div>
    )
}
