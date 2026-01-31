"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Clock, Truck, CheckCircle2, XCircle, ChevronLeft, User, Calendar, CreditCard, Search, Printer, Share2, FileDown, MapPin, Eye } from "lucide-react"
import Link from "next/link"
import { useStore, Order } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { isToday, isWithinInterval, startOfWeek, startOfMonth, startOfYear, endOfDay, startOfDay } from "date-fns"
import { printOrderInvoice, downloadOrderPDF } from "@/lib/print-utils"
import { hapticFeedback } from "@/lib/haptics"
import { toast } from "sonner"

const STATUS_CONFIG = {
    pending: { label: "تم رفع طلبك", color: "text-slate-400", bg: "bg-slate-500/10", icon: Clock },
    processing: { label: "جاري العمل", color: "text-blue-400", bg: "bg-blue-400/10", icon: Package },
    shipped: { label: "تم الشحن", color: "text-purple-400", bg: "bg-purple-400/10", icon: Truck },
    delivered: { label: "تم التسليم", color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
    canceled: { label: "ملغاة", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
    accepted: { label: "تم القبول", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
    rejected: { label: "مرفوض", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
}

export default function AdminOrdersPage() {
    const { orders, updateOrderStatus, customers, storeSettings } = useStore()
    const [filter, setFilter] = useState<string>("all")
    const [regionFilter, setRegionFilter] = useState<string>("all")
    const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "year" | "custom">("all")
    const [customStart, setCustomStart] = useState("")
    const [customEnd, setCustomEnd] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    // ... existing code ...

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

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

    const filteredOrders = orders.filter(o => {
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

        let matchesCategory = true
        // Active includes processing, shipped (Drafts/Pending hidden)
        if (activeCategory === "active") matchesCategory = ["processing", "shipped"].includes(o.status)
        else if (activeCategory === "finished") matchesCategory = ["delivered", "canceled"].includes(o.status)
        else if (activeCategory === "received") matchesCategory = o.status === "delivered"

        const matchesStatus = filter === "all" || o.status === filter
        const matchesRegion = regionFilter === "all" || o.customerLocation === regionFilter

        const matchesName = o.customerName.toLowerCase().includes(searchQuery.toLowerCase())

        let matchesCustomer = true
        if (selectedCustomer !== "all") {
            matchesCustomer = o.customerId === selectedCustomer || o.customerName === selectedCustomer
        }

        return matchesDate && matchesCategory && matchesStatus && matchesRegion && matchesName && matchesCustomer
    })

    const regions = Array.from(new Set(orders.map(o => o.customerLocation).filter(Boolean))) as string[]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">متابعة الطلبات</h1>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                    placeholder="ابحث باسم العميل..."
                    className="bg-black/20 border-white/10 pr-10 text-right h-12 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="w-full bg-black/20 border-white/10 pr-10 text-right h-10 rounded-xl text-xs appearance-none outline-none focus:border-primary/50 text-white"
                    >
                        <option value="all">كل المناطق</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <Calendar className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="w-full bg-black/20 border-white/10 pr-10 text-right h-10 rounded-xl text-xs appearance-none outline-none focus:border-primary/50 text-white"
                    >
                        <option value="all">كل الأوقات</option>
                        <option value="today">اليوم</option>
                        <option value="week">هذا الأسبوع</option>
                        <option value="month">هذا الشهر</option>
                        <option value="year">هذا العام</option>
                        <option value="custom">فترة مخصصة</option>
                    </select>
                </div>
                <div className="relative">
                    <User className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                    <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full bg-black/20 border-white/10 pr-10 text-right h-10 rounded-xl text-xs appearance-none outline-none focus:border-primary/50 text-white"
                    >
                        <option value="all">كل العملاء</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                {dateRange === "custom" && (
                    <>
                        <div className="relative">
                            <Input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="bg-black/20 border-white/10 text-right h-10 rounded-xl text-xs text-white"
                            />
                        </div>
                        <div className="relative">
                            <Input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="bg-black/20 border-white/10 text-right h-10 rounded-xl text-xs text-white"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                {(Object.entries(categories) as [keyof typeof categories, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setActiveCategory(id)}
                        className={cn(
                            "flex-1 py-2 text-[10px] font-bold rounded-xl transition-all",
                            activeCategory === id ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-white"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["all", "processing", "shipped", "delivered", "canceled"].map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setFilter(s)
                            hapticFeedback('light')
                        }}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                            filter === s
                                ? "bg-primary text-white"
                                : "bg-white/5 text-slate-400 hover:bg-white/10"
                        )}
                    >
                        {s === "all" ? "الكل" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        لا توجد طلبات في هذا التصنيف
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const status = STATUS_CONFIG[order.status]
                        return (
                            <div
                                key={order.id}
                                className="glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", status.bg, status.color)}>
                                        <status.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold text-white text-sm">#{order.id} - {order.customerName}</h3>
                                        <p className="text-[10px] text-slate-500">{order.createdAt.toLocaleString('ar-SA')}</p>
                                    </div>
                                </div>
                                <div className="text-left flex items-center gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-white">{order.total.toFixed(2)} ر.س</p>
                                        <p className="text-[10px] text-slate-500">{order.items.length} منتجات</p>
                                    </div>
                                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Order Details Modal */}
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
                            className="glass-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Package className="w-6 h-6 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.id}</h2>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", STATUS_CONFIG[selectedOrder.status].bg, STATUS_CONFIG[selectedOrder.status].color)}>
                                            {STATUS_CONFIG[selectedOrder.status].label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-400 hover:bg-blue-400/10 gap-2 h-9 px-3 rounded-lg border border-transparent hover:border-blue-400/20"
                                        onClick={() => printOrderInvoice(selectedOrder, storeSettings)}
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span className="text-xs">طباعة فاتورة</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-emerald-400 hover:bg-emerald-400/10 gap-2 h-9 px-3 rounded-lg border border-transparent hover:border-emerald-400/20"
                                        onClick={() => handleShareWhatsApp(selectedOrder)}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span className="text-xs">واتساب</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-emerald-400 hover:bg-emerald-400/10 gap-2 h-9 px-3 rounded-lg border border-transparent hover:border-emerald-400/20"
                                        onClick={() => downloadOrderPDF(selectedOrder, storeSettings)}
                                    >
                                        <FileDown className="w-4 h-4" />
                                        <span className="text-xs">تحميل PDF</span>
                                    </Button>
                                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full">
                                        <XCircle className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <User className="w-3 h-3" />
                                        العميل
                                    </div>
                                    <p className="font-bold text-white text-sm">{selectedOrder.customerName}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <Calendar className="w-3 h-3" />
                                        التاريخ
                                    </div>
                                    <p className="font-bold text-white text-sm">{selectedOrder.createdAt.toLocaleString('ar-SA')}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <h4 className="text-xs font-bold text-slate-500 uppercase">قائمة المنتجات</h4>
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-black/40 rounded flex items-center justify-center text-xs">📦</div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.name}</p>
                                                <p className="text-[10px] text-slate-500">{item.quantity} x {item.price} ر.س</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-primary">{(item.quantity * item.price).toFixed(2)} ر.س</p>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-2 font-bold text-white">
                                        <CreditCard className="w-4 h-4 text-primary" />
                                        الإجمالي
                                    </div>
                                    <p className="text-lg font-bold text-primary">{selectedOrder.total.toFixed(2)} ر.س</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-500 uppercase">تحديث حالة الطلب</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>)
                                        .filter(key => !['accepted', 'rejected'].includes(key))
                                        .map((statusKey) => (
                                            <Button
                                                key={statusKey}
                                                variant="glass"
                                                className={cn(
                                                    "h-10 text-[10px] font-bold rounded-lg",
                                                    selectedOrder.status === statusKey ? STATUS_CONFIG[statusKey].bg + " " + STATUS_CONFIG[statusKey].color : "hover:bg-white/5"
                                                )}
                                                onClick={() => {
                                                    updateOrderStatus(selectedOrder.id, statusKey)
                                                    setSelectedOrder({ ...selectedOrder, status: statusKey })
                                                    hapticFeedback('medium')
                                                }}
                                            >
                                                {STATUS_CONFIG[statusKey].label}
                                            </Button>
                                        ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Removed InvoiceTemplate and PremiumInvoice */}
        </div>
    )
}
