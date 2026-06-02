"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Clock, Truck, CheckCircle2, XCircle, ChevronLeft, ChevronDown, User, Calendar, CreditCard, Search, Printer, Share2, FileDown, MapPin, LayoutList, Users, Trash2, Undo } from "lucide-react"
import Link from "next/link"
import { useStore, Order } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { InvoiceTemplate } from "@/components/shared/invoice-template"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { PremiumInvoice } from "@/components/shared/premium-invoice"
import { generateOrderPDF } from "@/lib/pdf-utils"

const STATUS_CONFIG = {
    pending: { label: "لم تجهز", color: "text-orange-500", bg: "bg-orange-500/10", icon: Clock },
    processing: { label: "جاري العمل", color: "text-blue-500", bg: "bg-blue-500/10", icon: Package },
    shipped: { label: "تم الشحن", color: "text-purple-500", bg: "bg-purple-500/10", icon: Truck },
    delivered: { label: "تم التسليم", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
    canceled: { label: "ملغاة", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
}

const formatOrderDate = (d: any): string => {
    if (!d) return ""
    try {
        if (d instanceof Date) return d.toLocaleString('ar-SA')
        if (d && typeof d === 'object' && 'toDate' in d && typeof d.toDate === 'function') return d.toDate().toLocaleString('ar-SA')
        if (d && typeof d === 'object' && 'seconds' in d) return new Date(d.seconds * 1000).toLocaleString('ar-SA')
        const parsed = new Date(d)
        return isNaN(parsed.getTime()) ? "" : parsed.toLocaleString('ar-SA')
    } catch {
        return ""
    }
}

export default function AdminOrdersPage() {
    const { orders, updateOrderStatus, deleteOrdersBulk, customers } = useStore()
    const [viewMode, setViewMode] = useState<"all" | "byCustomer">("byCustomer")
    const [filter, setFilter] = useState<string>("all")
    const [regionFilter, setRegionFilter] = useState<string>("all")
    const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)

    // Selection & Deletion Undo mechanism
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [deletionQueue, setDeletionQueue] = useState<string[] | null>(null)
    const [countdown, setCountdown] = useState<number>(0)
    const [countdownTimer, setCountdownTimer] = useState<any>(null)

    // Long press selection system
    const longPressTimeout = useRef<any>(null)
    const isLongPressActive = useRef(false)

    const handlePointerDown = (orderId: string, e: React.PointerEvent) => {
        // Only left click or primary touch contact
        if (e.button !== 0) return
        isLongPressActive.current = false
        
        longPressTimeout.current = setTimeout(() => {
            isLongPressActive.current = true
            toggleSelectOrder(orderId)
            hapticFeedback('medium')
            toast.success("تم تحديد الطلب ودخول وضع التحديد")
        }, 600)
    }

    const handlePointerUp = (orderId: string, e: React.PointerEvent, onClickAction: () => void) => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current)
            longPressTimeout.current = null
        }
        
        if (isLongPressActive.current) {
            e.preventDefault()
            e.stopPropagation()
            isLongPressActive.current = false
        } else {
            onClickAction()
        }
    }

    const handlePointerCancel = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current)
            longPressTimeout.current = null
        }
    }

    const toggleSelectOrder = (orderId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (!isSelectionMode) {
            setIsSelectionMode(true)
        }
        setSelectedOrderIds(prev => {
            const next = prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
            if (next.length === 0) {
                setIsSelectionMode(false)
            }
            return next
        })
        hapticFeedback('light')
    }

    const startUndoTimer = (ids: string[]) => {
        if (countdownTimer) clearInterval(countdownTimer)

        setDeletionQueue(ids)
        setCountdown(5)
        setSelectedOrderIds([]) // Clear selection
        setIsSelectionMode(false) // Exit selection mode

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setCountdownTimer(null)
                    if (deleteOrdersBulk) {
                        deleteOrdersBulk(ids, false)
                    }
                    setDeletionQueue(null)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        setCountdownTimer(timer)
    }

    const handleUndo = () => {
        if (countdownTimer) {
            clearInterval(countdownTimer)
            setCountdownTimer(null)
        }
        if (deletionQueue) {
            setSelectedOrderIds(deletionQueue) // Restore selection
            setIsSelectionMode(true) // Re-enter selection mode
            setDeletionQueue(null)
            toast.success("تم التراجع عن حذف الطلبات ↩️")
        }
        hapticFeedback('success')
    }

    const categories = {
        all: "الكل",
        active: "نشطة",
        finished: "منتهية",
        received: "استلام"
    }
    const [activeCategory, setActiveCategory] = useState<keyof typeof categories>("all")

    const handleShareWhatsApp = (order: Order) => {
        const text = `*طلب جديد #${order.id}*\n\n` +
            `العميل: ${order.customerName || "عميل غير معروف"}\n` +
            `التاريخ: ${formatOrderDate(order.createdAt)}\n\n` +
            `*المنتجات:*\n` +
            (order.items || []).map(item => `- ${item.name || "منتج"} (${(item.quantity || 0)} x ${(item.price || 0)})`).join('\n') +
            `\n\n*الإجمالي: ${(order.total || 0).toFixed(2)} ر.س*`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        hapticFeedback('success')
    }

    const handleDownloadPDF = async (order: Order) => {
        hapticFeedback('light')
        const success = await generateOrderPDF('premium-invoice-target', order.id)
        if (success) toast.success("تم تجهيز وتحميل الفاتورة")
        else toast.error("فشل في تجهيز الفاتورة")
    }

    const filteredOrders = useMemo(() => {
        const list = (orders || []).filter(o => {
            if (!o) return false
            let date: Date
            const rawDate = o.createdAt
            if (rawDate instanceof Date) date = rawDate
            else if (rawDate && typeof rawDate === 'object' && 'toDate' in rawDate && typeof (rawDate as any).toDate === 'function') date = (rawDate as any).toDate()
            else if (rawDate && typeof rawDate === 'object' && 'seconds' in rawDate) date = new Date((rawDate as any).seconds * 1000)
            else date = new Date(rawDate || new Date())
            if (isNaN(date.getTime())) date = new Date()

            const now = new Date()
            let matchesDate = true
            if (dateRange === "today") matchesDate = date.toDateString() === now.toDateString()
            else if (dateRange === "week") { const w = new Date(now.setDate(now.getDate() - now.getDay())); matchesDate = date >= w }
            else if (dateRange === "month") matchesDate = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

            let matchesCategory = true
            if (activeCategory === "active") matchesCategory = ["pending", "processing", "shipped"].includes(o.status)
            else if (activeCategory === "finished") matchesCategory = ["delivered", "canceled"].includes(o.status)
            else if (activeCategory === "received") matchesCategory = o.status === "delivered"

            const matchesStatus = filter === "all" || o.status === filter
            const matchesRegion = regionFilter === "all" || o.customerLocation === regionFilter
            const matchesName = 
                (o.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (o.id || "").toLowerCase().includes(searchQuery.toLowerCase())
            return matchesDate && matchesCategory && matchesStatus && matchesRegion && matchesName
        })

        // Sort: Newest to Oldest
        return list.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return timeB - timeA
        })
    }, [orders, dateRange, activeCategory, filter, regionFilter, searchQuery])

    // Group orders by customer name
    const ordersByCustomer = useMemo(() => {
        const groups: Record<string, Order[]> = {}
        filteredOrders.forEach(order => {
            const key = order.customerName || "عميل غير معروف"
            if (!groups[key]) groups[key] = []
            groups[key].push(order)
        })

        // Sort groups by the date of the newest order in each group (descending)
        return Object.entries(groups).sort((a, b) => {
            const newestA = a[1][0]?.createdAt ? new Date(a[1][0].createdAt).getTime() : 0
            const newestB = b[1][0]?.createdAt ? new Date(b[1][0].createdAt).getTime() : 0
            return newestB - newestA
        })
    }, [filteredOrders])

    const isAllSelected = useMemo(() => {
        return filteredOrders.length > 0 && filteredOrders.every(o => selectedOrderIds.includes(o.id))
    }, [filteredOrders, selectedOrderIds])

    const toggleSelectAll = () => {
        if (isAllSelected) {
            const filteredIds = filteredOrders.map(o => o.id)
            setSelectedOrderIds(prev => prev.filter(id => !filteredIds.includes(id)))
        } else {
            const filteredIds = filteredOrders.map(o => o.id)
            setSelectedOrderIds(prev => Array.from(new Set([...prev, ...filteredIds])))
        }
        hapticFeedback('medium')
    }

    const regions = Array.from(new Set((orders || []).map(o => o?.customerLocation).filter(Boolean))) as string[]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1 text-slate-900 dark:text-white">متابعة الطلبات</h1>

                {isSelectionMode ? (
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={toggleSelectAll}
                            className="bg-primary/15 text-primary text-xs font-bold hover:bg-primary/20 rounded-xl px-4 py-2 border border-primary/30 transition-all shadow-sm shadow-primary/5 active:scale-95"
                        >
                            {isAllSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setSelectedOrderIds([])
                                setIsSelectionMode(false)
                                hapticFeedback('light')
                            }}
                            className="text-slate-500 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl px-3 py-2 active:scale-95"
                        >
                            إلغاء
                        </Button>
                    </div>
                ) : (
                    filteredOrders.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setIsSelectionMode(true)
                                hapticFeedback('medium')
                            }}
                            className="bg-primary/15 text-primary text-xs font-bold hover:bg-primary/20 rounded-xl px-4 py-2 border border-primary/30 transition-all shadow-sm shadow-primary/5 active:scale-95"
                        >
                            تحديد جماعي
                        </Button>
                    )
                )}

                {/* View Toggle */}
                <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1 border border-slate-200 dark:border-white/10">
                    <button
                        onClick={() => setViewMode("byCustomer")}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            viewMode === "byCustomer" ? "bg-primary text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        )}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>حسب العميل</span>
                    </button>
                    <button
                        onClick={() => setViewMode("all")}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            viewMode === "all" ? "bg-primary text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        )}
                    >
                        <LayoutList className="w-3.5 h-3.5" />
                        <span>كل الطلبات</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                    placeholder="ابحث باسم العميل..."
                    className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 pr-10 text-right h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 pr-10 text-right h-10 rounded-xl text-xs appearance-none text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="all">كل المناطق</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                        className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 pr-10 text-right h-10 rounded-xl text-xs appearance-none text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="all">كل الأوقات</option>
                        <option value="today">اليوم</option>
                        <option value="week">هذا الأسبوع</option>
                        <option value="month">هذا الشهر</option>
                    </select>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                {(Object.entries(categories) as [keyof typeof categories, string][]).map(([id, label]) => (
                    <button key={id} onClick={() => setActiveCategory(id)}
                        className={cn("flex-1 py-2 text-[10px] font-bold rounded-xl transition-all",
                            activeCategory === id ? "bg-primary text-white shadow-lg" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        )}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Status Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["all", "pending", "processing", "shipped", "delivered", "canceled"].map((s) => (
                    <button key={s} onClick={() => { setFilter(s); hapticFeedback('light') }}
                        className={cn("px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                            filter === s ? "bg-primary text-white shadow-md" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                        )}>
                        {s === "all" ? "الكل" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                    </button>
                ))}
            </div>

            {/* ===== BY CUSTOMER VIEW ===== */}
            {viewMode === "byCustomer" && (
                <div className="space-y-3">
                    {ordersByCustomer.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-white/5">
                            لا توجد طلبات
                        </div>
                    ) : (
                        ordersByCustomer.map(([customerName, customerOrders]) => {
                            const isExpanded = expandedCustomer === customerName
                            const totalAmount = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                            const lastOrder = customerOrders[0]
                            const statusCounts = customerOrders.reduce((acc, o) => {
                                acc[o.status] = (acc[o.status] || 0) + 1
                                return acc
                            }, {} as Record<string, number>)

                            return (
                                <div key={customerName} className="glass-card overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                                    {/* Customer Card */}
                                    <div
                                        className="flex items-center gap-4 p-4 cursor-pointer"
                                        onClick={() => setExpandedCustomer(isExpanded ? null : customerName)}
                                    >
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-teal-500/10 flex items-center justify-center flex-shrink-0 border border-primary/10">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            {(() => {
                                                const dbCustomer = customers.find(c => c.id === lastOrder?.customerId)
                                                return (
                                                    <h3 className="font-bold text-slate-900 dark:text-white truncate flex flex-wrap items-center gap-1.5">
                                                        <span>{customerName}</span>
                                                        {dbCustomer && (
                                                            <span className="text-[10px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                                المركز: {dbCustomer.name} (@{dbCustomer.username})
                                                            </span>
                                                        )}
                                                    </h3>
                                                )
                                            })()}
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                                    {customerOrders.length} طلب
                                                </span>
                                                {Object.entries(statusCounts).slice(0, 2).map(([s, count]) => {
                                                    const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]
                                                    if (!cfg) return null
                                                    return (
                                                        <span key={s} className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", cfg.bg, cfg.color)}>
                                                            {cfg.label}: {count}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Total */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{totalAmount.toFixed(2)} ر.س</p>
                                            <p className="text-[10px] text-slate-400">الإجمالي</p>
                                        </div>

                                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-transform duration-300 flex-shrink-0", isExpanded && "rotate-180")}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Expandable Orders List */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10 divide-y divide-slate-100 dark:divide-white/5">
                                                    {customerOrders.map((order) => {
                                                        const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || {
                                                            label: order.status, color: "text-slate-500", bg: "bg-slate-100", icon: Clock
                                                        }
                                                        const isSelected = selectedOrderIds.includes(order.id)
                                                        return (
                                                            <div
                                                                key={order.id}
                                                                className={cn("flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-colors select-none",
                                                                    isSelected && "bg-primary/5 dark:bg-primary/10"
                                                                )}
                                                                onPointerDown={(e) => handlePointerDown(order.id, e)}
                                                                onPointerUp={(e) => handlePointerUp(order.id, e, () => {
                                                                    if (isSelectionMode) {
                                                                        toggleSelectOrder(order.id)
                                                                    } else {
                                                                        setSelectedOrder(order)
                                                                    }
                                                                })}
                                                                onPointerLeave={handlePointerCancel}
                                                                onPointerCancel={handlePointerCancel}
                                                            >
                                                                {/* Checkbox */}
                                                                {isSelectionMode && (
                                                                    <div 
                                                                        onClick={(e) => toggleSelectOrder(order.id, e)}
                                                                        className={cn("w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer",
                                                                            isSelected 
                                                                                ? "bg-primary border-primary text-white shadow-sm" 
                                                                                : "border-slate-300 dark:border-white/20 hover:border-primary"
                                                                        )}
                                                                    >
                                                                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                                                    </div>
                                                                )}

                                                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", status.bg, status.color)}>
                                                                    <status.icon className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">#{order.id}</p>
                                                                    <p className="text-[10px] text-slate-400">{formatOrderDate(order.createdAt)}</p>
                                                                </div>
                                                                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0", status.bg, status.color)}>
                                                                    {status.label}
                                                                </span>
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white flex-shrink-0">{(order.total || 0).toFixed(2)} ر.س</p>
                                                                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* ===== ALL ORDERS VIEW ===== */}
            {viewMode === "all" && (
                <div className="space-y-3">
                    {filteredOrders.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-white/5">
                            لا توجد طلبات في هذا التصنيف
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || {
                                label: order.status || "غير معروف", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-400/10", icon: Clock
                            }
                            const isSelected = selectedOrderIds.includes(order.id)
                            return (
                                <div key={order.id}
                                    className={cn("glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-slate-100 dark:border-white/5 select-none",
                                        isSelected && "border-primary/30 bg-primary/5 dark:bg-primary/10"
                                    )}
                                    onPointerDown={(e) => handlePointerDown(order.id, e)}
                                    onPointerUp={(e) => handlePointerUp(order.id, e, () => {
                                        if (isSelectionMode) {
                                            toggleSelectOrder(order.id)
                                        } else {
                                            setSelectedOrder(order)
                                        }
                                    })}
                                    onPointerLeave={handlePointerCancel}
                                    onPointerCancel={handlePointerCancel}>
                                    <div className="flex items-center gap-4">
                                        {/* Checkbox */}
                                        {isSelectionMode && (
                                            <div 
                                                onClick={(e) => toggleSelectOrder(order.id, e)}
                                                className={cn("w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer",
                                                    isSelected 
                                                        ? "bg-primary border-primary text-white shadow-sm" 
                                                        : "border-slate-300 dark:border-white/20 hover:border-primary"
                                                )}
                                            >
                                                {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                            </div>
                                        )}

                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", status.bg, status.color)}>
                                            <status.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            {(() => {
                                                const dbCustomer = customers.find(c => c.id === order.customerId)
                                                return (
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex flex-wrap items-center gap-1.5">
                                                        <span>#{order.id} - {order.customerName || "عميل غير معروف"}</span>
                                                        {dbCustomer && (
                                                            <span className="text-[9px] font-normal text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                                                                المركز: {dbCustomer.name} (@{dbCustomer.username})
                                                            </span>
                                                        )}
                                                    </h3>
                                                )
                                            })()}
                                            <p className="text-[10px] text-slate-400">{formatOrderDate(order.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{(order.total || 0).toFixed(2)} ر.س</p>
                                            <p className="text-[10px] text-slate-400">{(order.items || []).length} منتجات</p>
                                        </div>
                                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Order Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">

                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-white/10 pb-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Package className="w-6 h-6 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">تفاصيل الطلب #{selectedOrder.id}</h2>
                                        {(() => {
                                            const status = STATUS_CONFIG[selectedOrder.status as keyof typeof STATUS_CONFIG] || { label: selectedOrder.status, color: "text-slate-500", bg: "bg-slate-100", icon: Clock }
                                            return <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", status.bg, status.color)}>{status.label}</span>
                                        })()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-400/10 gap-2 h-9 px-3 rounded-lg" onClick={() => window.print()}>
                                        <Printer className="w-4 h-4" /><span className="text-xs">طباعة</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 gap-2 h-9 px-3 rounded-lg" onClick={() => handleShareWhatsApp(selectedOrder)}>
                                        <Share2 className="w-4 h-4" /><span className="text-xs">واتساب</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 gap-2 h-9 px-3 rounded-lg" onClick={() => handleDownloadPDF(selectedOrder)}>
                                        <FileDown className="w-4 h-4" /><span className="text-xs">PDF</span>
                                    </Button>
                                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full">
                                        <XCircle className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-1.5 col-span-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs"><User className="w-3 h-3" />العميل والمركز المسجل</div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedOrder.customerName || "عميل غير معروف"}</p>
                                    {(() => {
                                        const dbCustomer = customers.find(c => c.id === selectedOrder.customerId)
                                        if (!dbCustomer) return null
                                        return (
                                            <div className="text-[10px] text-primary font-bold bg-primary/5 p-2 rounded-xl border border-primary/10 flex flex-wrap items-center justify-between gap-2 mt-1">
                                                <span>🏢 المركز: <span className="text-slate-700 dark:text-slate-350">{dbCustomer.name}</span></span>
                                                <span>👤 اليوزر: <span className="text-slate-700 dark:text-slate-350">@{dbCustomer.username}</span></span>
                                            </div>
                                        )
                                    })()}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs"><Calendar className="w-3 h-3" />التاريخ</div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{formatOrderDate(selectedOrder.createdAt)}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">قائمة المنتجات</h4>
                                {(selectedOrder.items || []).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 dark:bg-black/40 rounded flex items-center justify-center text-xs">📦</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.name || "منتج"}</p>
                                                <p className="text-[10px] text-slate-400">{(item.quantity || 0)} x {(item.price || 0)} ر.س</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-primary">{((item.quantity || 0) * (item.price || 0)).toFixed(2)} ر.س</p>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                        <CreditCard className="w-4 h-4 text-primary" />الإجمالي
                                    </div>
                                    <p className="text-lg font-bold text-primary">{(selectedOrder.total || 0).toFixed(2)} ر.س</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase">تحديث حالة الطلب</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((statusKey) => (
                                        <Button key={statusKey} variant="ghost"
                                            className={cn("h-10 text-[10px] font-bold rounded-lg border transition-all",
                                                selectedOrder.status === statusKey
                                                    ? STATUS_CONFIG[statusKey].bg + " " + STATUS_CONFIG[statusKey].color + " border-current/20"
                                                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                            onClick={() => {
                                                updateOrderStatus(selectedOrder.id, statusKey)
                                                setSelectedOrder({ ...selectedOrder, status: statusKey })
                                                hapticFeedback('medium')
                                            }}>
                                            {STATUS_CONFIG[statusKey].label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {selectedOrder && <InvoiceTemplate order={selectedOrder} />}
            {selectedOrder && <PremiumInvoice order={selectedOrder} id="premium-invoice-target" />}

            {/* Floating Bulk Action Bar */}
            <AnimatePresence>
                {selectedOrderIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-6 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md p-4 rounded-2xl glass-card border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {selectedOrderIds.length}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">تحديد جماعي للطلبات</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">سيتم تطبيق الإجراء على الطلبات المحددة</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrderIds([])}
                                className="text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 font-bold h-9 px-3 rounded-lg"
                            >
                                إلغاء
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    startUndoTimer(selectedOrderIds)
                                    hapticFeedback('medium')
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-red-500/20"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-xs">حذف وإلغاء</span>
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Deletion Undo Banner */}
            <AnimatePresence>
                {deletionQueue !== null && (
                    <motion.div
                        initial={{ y: 100, x: "-50%", opacity: 0 }}
                        animate={{ y: 0, x: "-50%", opacity: 1 }}
                        exit={{ y: 100, x: "-50%", opacity: 0 }}
                        className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-amber-500/30 shadow-2xl flex items-center justify-between gap-4 text-white"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold animate-pulse">
                                {countdown}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">جاري حذف وإلغاء الطلبات ({deletionQueue.length})</h4>
                                <p className="text-[10px] text-amber-400 font-medium">سيتم إشعار العملاء تلقائياً بالإلغاء</p>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            onClick={handleUndo}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all duration-300"
                        >
                            <Undo className="w-3.5 h-3.5" />
                            <span className="text-xs">تراجع</span>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
