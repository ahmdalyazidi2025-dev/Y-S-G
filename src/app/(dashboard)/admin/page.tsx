"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Package, Users, ClipboardList, Image as LugideImage, MessageCircle, Settings, Layers,
    Camera, LogOut, TrendingUp, ShoppingBag, UserCheck, Clock, BarChart3, Share2,
    Copy, Check, X,
    type LucideIcon
} from "lucide-react"
import NextImage from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useStore, type Product, type Order } from "@/context/store-context"

const ADMIN_MODULES = [
    {
        title: "إدارة المنتجات", icon: Package, link: "/admin/products",
        iconColor: "#2563eb",
        iconBgColor: "rgba(59,130,246,0.12)",
        iconBorderColor: "rgba(59,130,246,0.25)",
        glowColor: "rgba(59,130,246,0.3)",
    },
    {
        title: "الأقسام", icon: Layers, link: "/admin/categories",
        iconColor: "#4f46e5",
        iconBgColor: "rgba(99,102,241,0.12)",
        iconBorderColor: "rgba(99,102,241,0.25)",
        glowColor: "rgba(99,102,241,0.3)",
    },
    {
        title: "إدارة العملاء", icon: Users, link: "/admin/customers",
        iconColor: "#0d9488",
        iconBgColor: "rgba(20,184,166,0.12)",
        iconBorderColor: "rgba(20,184,166,0.25)",
        glowColor: "rgba(20,184,166,0.3)",
    },
    {
        title: "الإحصائيات", icon: BarChart3, link: "/admin/analytics",
        iconColor: "#4338ca",
        iconBgColor: "rgba(99,102,241,0.12)",
        iconBorderColor: "rgba(99,102,241,0.25)",
        glowColor: "rgba(99,102,241,0.3)",
    },
    {
        title: "متابعة الطلبات", icon: ClipboardList, link: "/admin/orders",
        iconColor: "#ea580c",
        iconBgColor: "rgba(249,115,22,0.12)",
        iconBorderColor: "rgba(249,115,22,0.25)",
        glowColor: "rgba(249,115,22,0.3)",
    },
    {
        title: "طلبات التوفير", icon: Camera, link: "/admin/requests",
        iconColor: "#9333ea",
        iconBgColor: "rgba(168,85,247,0.12)",
        iconBorderColor: "rgba(168,85,247,0.25)",
        glowColor: "rgba(168,85,247,0.3)",
    },
    {
        title: "صور العرض", icon: LugideImage, link: "/admin/banners",
        iconColor: "#db2777",
        iconBgColor: "rgba(236,72,153,0.12)",
        iconBorderColor: "rgba(236,72,153,0.25)",
        glowColor: "rgba(236,72,153,0.3)",
    },
    {
        title: "الدردشة", icon: MessageCircle, link: "/admin/chat",
        iconColor: "#0284c7",
        iconBgColor: "rgba(14,165,233,0.12)",
        iconBorderColor: "rgba(14,165,233,0.25)",
        glowColor: "rgba(14,165,233,0.3)",
    },
    {
        title: "الإعدادات", icon: Settings, link: "/admin/settings",
        iconColor: "#475569",
        iconBgColor: "rgba(100,116,139,0.12)",
        iconBorderColor: "rgba(100,116,139,0.25)",
        glowColor: "rgba(100,116,139,0.25)",
    },
]

export default function AdminDashboard() {
    const { orders, customers, products, logout, currentUser } = useStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isShareLinksOpen, setIsShareLinksOpen] = useState(false)
    const [copiedLink, setCopiedLink] = useState<string | null>(null)
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsShareLinksOpen(true)}
                        className="p-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 rounded-2xl flex items-center justify-center cursor-pointer transition-all gap-1.5"
                        title="مشاركة روابط المتجر ولوحة التحكم"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-xs font-bold hidden md:inline">مشاركة الروابط</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 glass rounded-2xl text-red-500 dark:text-red-400 hover:text-red-650 dark:hover:text-red-300 hover:bg-red-400/10 border border-slate-200/80 dark:border-white/5 transition-all cursor-pointer"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
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
                                color="text-emerald-600"
                                glow="bg-emerald-400/20"
                                iconColor="#059669"
                                iconBg="rgba(16,185,129,0.12)"
                            />
                            <StatsCard
                                title="الطلبات النشطة"
                                value={pendingOrders.toString()}
                                icon={ShoppingBag}
                                color="text-sky-600"
                                glow="bg-sky-400/20"
                                iconColor="#0284c7"
                                iconBg="rgba(14,165,233,0.12)"
                            />
                            <StatsCard
                                title="قاعدة العملاء"
                                value={customers.length.toString()}
                                icon={UserCheck}
                                color="text-violet-600"
                                glow="bg-violet-400/20"
                                iconColor="#7c3aed"
                                iconBg="rgba(139,92,246,0.12)"
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
                                        className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4 h-44 relative overflow-hidden transition-all duration-300"
                                        style={{ borderColor: "rgba(0,0,0,0.07)" }}
                                    >
                                        {/* Card glow on hover */}
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                                            style={{ background: `radial-gradient(ellipse at top, ${module.iconBgColor} 0%, transparent 70%)` }}
                                        />

                                        {/* Icon — fully circular with inline styles (Tailwind-safe) */}
                                        <div
                                            className="w-14 h-14 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                            style={{
                                                borderRadius: "50%",
                                                background: module.iconBgColor,
                                                border: `1.5px solid ${module.iconBorderColor}`,
                                                color: module.iconColor,
                                            }}
                                        >
                                            <module.icon style={{ width: 24, height: 24, strokeWidth: 1.8 }} />
                                        </div>

                                        <div className="space-y-0.5 z-10">
                                            <span className="font-bold text-sm text-slate-800 dark:text-white block">{module.title}</span>
                                            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">System Module</span>
                                        </div>

                                        {/* Bottom accent */}
                                        <div
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 group-hover:w-1/3 transition-all duration-500 rounded-t-full"
                                            style={{ background: module.iconColor }}
                                        />

                                        <div className="absolute top-3 right-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }} />
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

            {/* Share Links Dialog */}
            <AnimatePresence>
                {isShareLinksOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsShareLinksOpen(false)}
                            className="absolute inset-0 bg-black/85 backdrop-blur-md"
                        />
                        
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto no-scrollbar space-y-6 text-right"
                        >
                            <button 
                                onClick={() => setIsShareLinksOpen(false)}
                                className="absolute top-4 left-4 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">🔗 مشاركة روابط المتجر</h3>
                                <p className="text-[10px] text-slate-500">اختر الرابط المناسب لنسخه ومشاركته</p>
                            </div>

                            <div className="space-y-4 pt-2">
                                {/* Customer Link Card */}
                                <div className="p-4 rounded-2xl border border-slate-150 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-white mb-1">🛒 رابط متجر العملاء</h4>
                                        <p className="text-[10px] text-slate-400 truncate dir-ltr text-right">{typeof window !== "undefined" ? window.location.origin : ""}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            try {
                                                const link = window.location.origin
                                                navigator.clipboard.writeText(link)
                                                setCopiedLink("customer")
                                                import("sonner").then(({ toast }) => {
                                                    toast.success("تم نسخ رابط المتجر بنجاح!")
                                                })
                                                setTimeout(() => setCopiedLink(null), 2000)
                                            } catch (e) {
                                                console.error(e)
                                            }
                                        }}
                                        className="p-3 rounded-xl bg-primary hover:bg-primary/95 text-white active:scale-95 transition-all flex-shrink-0"
                                    >
                                        {copiedLink === "customer" ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Admin/Staff Link Card */}
                                <div className="p-4 rounded-2xl border border-slate-150 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-slate-800 dark:text-white mb-1">🔐 رابط لوحة الموظفين والإدارة</h4>
                                        <p className="text-[10px] text-slate-400 truncate dir-ltr text-right">{typeof window !== "undefined" ? `${window.location.origin}/login` : ""}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            try {
                                                const link = `${window.location.origin}/login`
                                                navigator.clipboard.writeText(link)
                                                setCopiedLink("staff")
                                                import("sonner").then(({ toast }) => {
                                                    toast.success("تم نسخ رابط تسجيل دخول الإدارة بنجاح!")
                                                })
                                                setTimeout(() => setCopiedLink(null), 2000)
                                            } catch (e) {
                                                console.error(e)
                                            }
                                        }}
                                        className="p-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white active:scale-95 transition-all flex-shrink-0"
                                    >
                                        {copiedLink === "staff" ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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

function StatsCard({ title, value, icon: Icon, color, glow, iconColor, iconBg }: {
    title: string; value: string; icon: LucideIcon; color: string; glow: string;
    iconColor: string; iconBg: string;
}) {
    return (
        <div className="glass-card p-5 relative overflow-hidden group cursor-default">
            {/* Soft background glow */}
            <div className={cn("absolute -right-6 -top-6 w-28 h-28 rounded-full blur-[40px] opacity-15 group-hover:opacity-30 transition-opacity duration-500", glow)} />

            <div className="flex items-center justify-between relative z-10 mb-4">
                {/* Circular Icon */}
                <div
                    className="w-12 h-12 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                        borderRadius: "50%",
                        background: iconBg,
                        color: iconColor,
                        border: `1.5px solid ${iconColor}30`,
                    }}
                >
                    <Icon size={20} strokeWidth={2} />
                </div>

                {/* Value & Title */}
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mb-0.5">{title}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full w-2/3 rounded-full opacity-70"
                    style={{ background: iconColor }}
                />
            </div>
        </div>
    )
}

