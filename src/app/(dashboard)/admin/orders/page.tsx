"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Clock, Truck, CheckCircle2, XCircle, ChevronLeft, User, Calendar, CreditCard, Search, Printer, Share2, FileDown, MapPin, Eye, Loader2, Phone } from "lucide-react"
import Link from "next/link"
import { useOrders, useCustomers, useSettings, Order } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { isToday, isWithinInterval, startOfWeek, startOfMonth, startOfYear, endOfDay, startOfDay } from "date-fns"
import { printOrderInvoice, downloadOrderPDF } from "@/lib/print-utils"
import { hapticFeedback } from "@/lib/haptics"
import { toast } from "sonner"
import { PremiumInvoice } from "@/components/shared/premium-invoice"
import { WheelPicker } from "@/components/shared/wheel-picker"


const STATUS_CONFIG = {
    pending: { label: "تم رفع طلبك", color: "text-muted-foreground", bg: "bg-muted", icon: Clock },
    processing: { label: "جاري العمل", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", icon: Package },
    shipped: { label: "تم الشحن", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", icon: Truck },
    delivered: { label: "تم التسليم", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
    canceled: { label: "ملغاة", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: XCircle },
    accepted: { label: "تم القبول", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
    deleted: { label: "المحذوفات", color: "text-slate-500", bg: "bg-slate-500/10", icon: XCircle },
}

export default function AdminOrdersPage() {
    const { orders, updateOrderStatus, loadMoreOrders, hasMoreOrders, searchOrders, markOrderAsRead } = useOrders()
    const { customers } = useCustomers()
    const { storeSettings, settingsLoaded } = useSettings()
    const loading = !settingsLoaded // Simplified loading for this page
    const [filter, setFilter] = useState<string>("all")
    const [regionFilter, setRegionFilter] = useState<string>("all")
    const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "year" | "custom">("all")
    const [customStart, setCustomStart] = useState("")
    const [customEnd, setCustomEnd] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    // Server Search State
    const [serverSearchResults, setServerSearchResults] = useState<Order[] | null>(null)
    const [isSearching, setIsSearching] = useState(false)

    // NEW: Grouping & View Mode state
    const [viewMode, setViewMode] = useState<"all" | "by-customer">("all")
    const [selectedCustomerForGroup, setSelectedCustomerForGroup] = useState<string | null>(null)

    // Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 0) {
                setIsSearching(true)
                try {
                    // If matches ID format or just search text
                    const results = await searchOrders(searchQuery)
                    setServerSearchResults(results)
                } catch (e) {
                    console.error(e)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setServerSearchResults(null)
            }
        }, 600)
        return () => clearTimeout(timer)
    }, [searchQuery, searchOrders])

    // Infinite Scroll Observer
    const observerTarget = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                // Only load more if:
                // 1. Not searching (serverSearchResults is null)
                // 2. Search query is empty
                // 3. Has more orders to load
                // 4. Not currently loading
                const first = entries[0]
                if (first.isIntersecting && hasMoreOrders && !loading && !searchQuery) {
                    loadMoreOrders()
                }
            },
            { threshold: 0.1 } // Trigger when 10% visible
        )

        const currentTarget = observerTarget.current
        if (currentTarget) {
            observer.observe(currentTarget)
        }

        return () => {
            if (currentTarget) observer.unobserve(currentTarget)
        }
    }, [hasMoreOrders, loading, loadMoreOrders, searchQuery])


    // ... existing code ...

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [invoicePreviewOrder, setInvoicePreviewOrder] = useState<Order | null>(null) // State for invoice preview

    const categories = {
        all: "الكل",
        active: "نشطة",
        finished: "منتهية",
        received: "استلام"
    }
    const [activeCategory, setActiveCategory] = useState<keyof typeof categories>("all")

    const handleShareWhatsApp = (order: Order) => {
        const text = `*طلب جديد #${order.id}*\n\n` +
            `العميل: ${order.customerName}\n` +
            `التاريخ: ${order.createdAt.toLocaleString('ar-SA')}\n\n` +
            `*المنتجات:*\n` +
            order.items.map(item => `- ${item.name} (${item.quantity} x ${item.price})`).join('\n') +
            `\n\n*الإجمالي: ${order.total.toFixed(2)} ر.س*`

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
        hapticFeedback('success')
    }

    const allOrders = serverSearchResults || orders // Use server results if active, otherwise loaded buffer

    const filteredOrders = React.useMemo(() => {
        return allOrders.filter((o: Order) => {
            const date = new Date(o.createdAt)
            const now = new Date()

            let matchesDate = true
            if (dateRange === "today") matchesDate = isToday(date)
            else if (dateRange === "week") matchesDate = isWithinInterval(date, { start: startOfWeek(now), end: endOfDay(now) })
            else if (dateRange === "month") matchesDate = isWithinInterval(date, { start: startOfMonth(now), end: endOfDay(now) })
            else if (dateRange === "year") matchesDate = isWithinInterval(date, { start: startOfYear(now), end: endOfDay(now) })
            else if (dateRange === "custom" && customStart && customEnd) {
                matchesDate = isWithinInterval(date, {
                    start: startOfDay(new Date(customStart)),
                    end: endOfDay(new Date(customEnd))
                })
            }

            if (filter !== "deleted" && o.status === "deleted") return false

            let matchesCategory = true
            if (activeCategory === "active") matchesCategory = ["processing", "shipped"].includes(o.status)
            else if (activeCategory === "finished") matchesCategory = ["delivered", "canceled"].includes(o.status)
            else if (activeCategory === "received") matchesCategory = o.status === "delivered"

            const matchesStatus = filter === "all" ? o.status !== "deleted" : o.status === filter
            const matchesRegion = regionFilter === "all" || o.customerLocation === regionFilter

            const matchesCustomerGroup = !selectedCustomerForGroup ||
                o.customerId === selectedCustomerForGroup ||
                o.customerName === selectedCustomerForGroup

            const matchesNameClient = !serverSearchResults ? o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) : true

            let matchesCustomer = true
            if (selectedCustomer !== "all") {
                matchesCustomer = o.customerId === selectedCustomer || o.customerName === selectedCustomer
            }

            return matchesDate && matchesCategory && matchesStatus && matchesRegion && matchesCustomerGroup && matchesNameClient && matchesCustomer
        })
    }, [allOrders, dateRange, customStart, customEnd, filter, activeCategory, regionFilter, selectedCustomerForGroup, searchQuery, serverSearchResults, selectedCustomer])

    const regions = React.useMemo(() => {
        return Array.from(new Set(orders.map((o: Order) => o.customerLocation).filter(Boolean))) as string[]
    }, [orders])

    const customerGroups = React.useMemo(() => {
        return orders.reduce((acc: Record<string, { id: string, name: string, count: number, total: number }>, order: Order) => {
            const id = order.customerId || order.customerName
            if (!acc[id]) {
                acc[id] = { id, name: order.customerName, count: 0, total: 0 }
            }
            acc[id].count++
            acc[id].total += order.total
            return acc
        }, {})
    }, [orders])

    const sortedCustomerGroups = React.useMemo(() => {
        return Object.values(customerGroups).sort((a, b) => b.count - a.count)
    }, [customerGroups])

    // Progressive rendering: only show 10 at a time visually
    const [visibleCount, setVisibleCount] = useState(10)
    useEffect(() => {
        setVisibleCount(10)
    }, [filter, activeCategory, searchQuery])

    const displayedOrders = React.useMemo(() => {
        return filteredOrders.slice(0, visibleCount)
    }, [filteredOrders, visibleCount])

    return (
        <div className="flex flex-col min-h-screen bg-background p-4 md:p-8 space-y-6 pb-24">
            {/* Header Area */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                        <ArrowRight className="w-5 h-5 text-foreground" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-foreground">متابعة الطلبات</h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Order Management</p>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-muted p-1 rounded-2xl border border-border">
                <button
                    onClick={() => { setViewMode("all"); setFilter("all"); setSelectedCustomerForGroup(null); hapticFeedback('light') }}
                    className={cn(
                        "flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
                        viewMode === "all" && filter !== "deleted" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Package className="w-4 h-4" />
                    الكل
                </button>
                <button
                    onClick={() => { setViewMode("by-customer"); setFilter("all"); hapticFeedback('light') }}
                    className={cn(
                        "flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
                        viewMode === "by-customer" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <User className="w-4 h-4" />
                    حسب العميل
                </button>
                <button
                    onClick={() => { setViewMode("all"); setFilter("deleted"); setSelectedCustomerForGroup(null); hapticFeedback('light') }}
                    className={cn(
                        "flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
                        filter === "deleted" ? "bg-red-500/10 text-red-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <XCircle className="w-4 h-4" />
                    المحذوفة
                </button>
            </div>

            {/* Global Search */}
            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                <Input
                    placeholder="ابحث باسم العميل أو رقم الطلب..."
                    className="bg-background border-border pr-10 text-right h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="relative">
                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="w-full bg-background border border-border pr-10 text-right h-10 rounded-xl text-xs appearance-none outline-none focus:border-primary/50 text-foreground"
                    >
                        <option value="all" className="bg-background text-foreground">كل المناطق</option>
                        {regions.map(r => <option key={r} value={r} className="bg-background text-foreground">{r}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="w-full bg-background border border-border pr-10 text-right h-10 rounded-xl text-xs appearance-none outline-none focus:border-primary/50 text-foreground"
                    >
                        <option value="all" className="bg-background text-foreground">كل الأوقات</option>
                        <option value="today" className="bg-background text-foreground">اليوم</option>
                        <option value="week" className="bg-background text-foreground">هذا الأسبوع</option>
                        <option value="month" className="bg-background text-foreground">هذا الشهر</option>
                        <option value="year" className="bg-background text-foreground">هذا العام</option>
                        <option value="custom" className="bg-background text-foreground">فترة مخصصة</option>
                    </select>
                </div>
                <div className="relative">
                    <User className="absolute right-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                    <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full bg-background border border-border pr-10 text-right h-10 rounded-xl text-xs appearance-none outline-none focus:border-primary/50 text-foreground"
                    >
                        <option value="all" className="bg-background text-foreground">كل العملاء المسجلين</option>
                        {customers.map(c => <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>)}
                    </select>
                </div>
                {dateRange === "custom" && (
                    <div className="md:col-span-3 grid grid-cols-2 gap-2">
                        <WheelPicker
                            date={customStart ? new Date(customStart) : undefined}
                            setDate={(d) => setCustomStart(d ? d.toISOString().split('T')[0] : '')}
                            placeholder="من تاريخ"
                        />
                        <WheelPicker
                            date={customEnd ? new Date(customEnd) : undefined}
                            setDate={(d) => setCustomEnd(d ? d.toISOString().split('T')[0] : '')}
                            placeholder="إلى تاريخ"
                        />
                    </div>
                )}
            </div>

            {/* Status Categories */}
            {filter !== "deleted" && (
                <div className="flex bg-muted p-1 rounded-2xl border border-border">
                    {(Object.entries(categories) as [keyof typeof categories, string][]).map(([id, label]) => (
                        <button
                            key={id}
                            onClick={() => setActiveCategory(id)}
                            className={cn(
                                "flex-1 py-2 text-[10px] font-bold rounded-xl transition-all",
                                activeCategory === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Quick Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["all", "processing", "shipped", "delivered", "canceled", "accepted", "deleted"].map((s) => (
                    <button
                        key={s}
                        onClick={() => { setFilter(s); hapticFeedback('light') }}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap border border-transparent",
                            filter === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground border-border"
                        )}
                    >
                        {s === "all" ? "الكل" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
                {viewMode === "by-customer" && !selectedCustomerForGroup ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedCustomerGroups.map(group => (
                            <div
                                key={group.id}
                                onClick={() => setSelectedCustomerForGroup(group.id)}
                                className="p-5 rounded-3xl bg-muted/20 border border-border/50 hover:border-primary/50 transition-all cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                                        {group.name.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground group-hover:text-primary transition-colors">{group.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">{group.count} طلبات | {group.total.toFixed(2)} ر.س</p>
                                    </div>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {selectedCustomerForGroup && (
                            <div className="flex items-center justify-between py-2 mb-2 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedCustomerForGroup(null)}
                                    className="text-primary gap-2 font-black"
                                >
                                    <ArrowRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
                                    <span>العودة لجميع العملاء</span>
                                </Button>
                                <div className="text-right">
                                    <p className="text-sm font-black text-primary">{selectedCustomerForGroup}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold">عرض طلبات العميل المحددة</p>
                                </div>
                            </div>
                        )}

                        {filteredOrders.length === 0 ? (
                            <div className="p-20 text-center text-muted-foreground border border-dashed border-border rounded-3xl bg-muted/10">
                                <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold">لا توجد طلبات في هذا التصنيف</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {displayedOrders.map((order: Order) => {
                                    const status = STATUS_CONFIG[order.status]
                                    return (
                                        <div
                                            key={order.id}
                                            className={cn(
                                                "glass-card p-4 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all border border-border group relative overflow-hidden",
                                                order.status === "deleted" && filter !== "deleted" && "opacity-60 grayscale-[0.5] border-red-500/20",
                                                !order.isRead && "border-red-500/30 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                            )}
                                            onClick={() => {
                                                setSelectedOrder(order)
                                                if (!order.isRead) markOrderAsRead(order.id)
                                            }}
                                        >
                                            {/* New Badge Pulse Indicator */}
                                            {!order.isRead && order.status !== "deleted" && (
                                                <div className="absolute top-0 right-0 p-1">
                                                    <div className="flex items-center gap-1.5 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-xl animate-pulse shadow-lg">
                                                        <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                                        جديد
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                                    status.bg,
                                                    status.color,
                                                    !order.isRead && "ring-2 ring-red-500/20 ring-offset-2 ring-offset-background"
                                                )}>
                                                    <status.icon className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors flex flex-wrap items-center gap-x-2">
                                                        #{order.id} - {order.accountName || order.customerName}
                                                        {order.accountName && order.accountName !== order.customerName && (
                                                            <span className="text-[10px] text-primary/70 font-bold bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                                                                لـ: {order.customerName}
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-[10px] text-muted-foreground">{order.createdAt.toLocaleString('ar-SA')}</p>
                                                </div>
                                            </div>
                                            <div className="text-left flex items-center gap-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold text-foreground">{order.total.toFixed(2)} ر.س</p>
                                                    <p className="text-[10px] text-muted-foreground">{order.items.length} منتجات</p>
                                                </div>
                                                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    )
                                })}
                                {displayedOrders.length < filteredOrders.length && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-2xl border-dashed border-primary/30 text-primary hover:bg-primary/5 font-black mt-4"
                                        onClick={() => setVisibleCount(prev => prev + 10)}
                                    >
                                        عرض المزيد من الطلبات ({filteredOrders.length - displayedOrders.length})
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Infinite Scroll & Loading */}
                {!searchQuery && hasMoreOrders && (
                    <div ref={observerTarget} className="flex justify-center p-6">
                        {loading && (
                            <div className="flex items-center gap-2 text-muted-foreground bg-muted/20 px-4 py-2 rounded-full text-xs animate-pulse">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري تحميل المزيد من الطلبات...</span>
                            </div>
                        )}
                    </div>
                )}
                {isSearching && (
                    <div className="flex justify-center p-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto border border-border flex flex-col gap-6"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <Package className="w-6 h-6 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-bold">طلب #{selectedOrder.id}</h2>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", STATUS_CONFIG[selectedOrder.status].bg, STATUS_CONFIG[selectedOrder.status].color)}>
                                            {STATUS_CONFIG[selectedOrder.status].label}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full">
                                    <XCircle className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Actions Bar */}
                            <div className="flex flex-wrap gap-2 pb-4 border-b border-border">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/10 gap-2 px-3 border border-white/5"
                                    onClick={() => setInvoicePreviewOrder(selectedOrder)}
                                >
                                    <Eye className="w-4 h-4" />
                                    <span className="text-xs">المعاينة</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-400 hover:bg-blue-400/10 gap-2 px-3 border border-blue-400/5"
                                    onClick={() => printOrderInvoice(selectedOrder, storeSettings)}
                                >
                                    <Printer className="w-4 h-4" />
                                    <span className="text-xs">طباعة</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-400 hover:bg-emerald-400/10 gap-2 px-3 border border-emerald-400/5"
                                    onClick={() => handleShareWhatsApp(selectedOrder)}
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-xs">واتساب</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:bg-primary/10 gap-2 px-3 border border-primary/5"
                                    onClick={() => downloadOrderPDF(selectedOrder, storeSettings)}
                                >
                                    <FileDown className="w-4 h-4" />
                                    <span className="text-xs">تحميل PDF</span>
                                </Button>

                                {/* ARCHIVE / RESTORE BUTTON */}
                                {selectedOrder.status === 'deleted' ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-emerald-400 hover:bg-emerald-400/10 gap-2 px-3 border border-emerald-500/20"
                                        onClick={() => {
                                            updateOrderStatus(selectedOrder.id, 'pending')
                                            setSelectedOrder(null)
                                            toast.success('تمت استعادة الفاتورة بنجاح')
                                        }}
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs">استعادة الفاتورة</span>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:bg-red-400/10 gap-2 px-3 border border-red-500/20"
                                        onClick={() => {
                                            updateOrderStatus(selectedOrder.id, 'deleted')
                                            setSelectedOrder(null)
                                            toast.error('تم نقل الفاتورة للمحذوفات')
                                        }}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span className="text-xs">حذف الفاتورة</span>
                                    </Button>
                                )}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                                    <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <User className="w-2.5 h-2.5" />
                                        صاحب الحساب
                                    </p>
                                    <p className="font-bold text-sm">{selectedOrder.accountName || "زائر / Guest"}</p>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <Phone className="w-2.5 h-2.5" />
                                        بيانات المستلم
                                    </p>
                                    <div>
                                        <p className="text-xs font-bold">{selectedOrder.customerName}</p>
                                        <p className="text-[10px] font-mono text-primary">{selectedOrder.customerPhone || "---"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">محتويات الطلب</h4>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border border-border/50 text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">📦</div>
                                                <div className="font-bold">{item.name}</div>
                                            </div>
                                            <div className="text-muted-foreground">{item.quantity} x {item.price}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between p-4 bg-primary/10 rounded-2xl border border-primary/20 mt-4">
                                    <span className="font-black">الإجمالي</span>
                                    <span className="font-black text-primary text-xl">{selectedOrder.total.toFixed(2)} ر.س</span>
                                </div>
                            </div>

                            {/* Status Change Grid */}
                            {selectedOrder.status !== 'deleted' && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">تحديث حالة الطلب</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>)
                                            .filter(key => !['accepted', 'rejected', 'deleted'].includes(key))
                                            .map((statusKey) => (
                                                <Button
                                                    key={statusKey}
                                                    variant="glass"
                                                    className={cn(
                                                        "h-12 text-[10px] font-bold rounded-xl transition-all border border-white/5",
                                                        selectedOrder.status === statusKey
                                                            ? STATUS_CONFIG[statusKey].bg + " " + STATUS_CONFIG[statusKey].color + " border-primary/30"
                                                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                                    )}
                                                    onClick={() => {
                                                        updateOrderStatus(selectedOrder.id, statusKey)
                                                        setSelectedOrder(null)
                                                        toast.success('تم تحديث الحالة')
                                                    }}
                                                >
                                                    {STATUS_CONFIG[statusKey].label}
                                                </Button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Preview */}
            {invoicePreviewOrder && (
                <PremiumInvoice
                    order={invoicePreviewOrder}
                    isPreview={true}
                    onClose={() => setInvoicePreviewOrder(null)}
                />
            )}
        </div>
    )
}
