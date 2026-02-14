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
import { PremiumInvoice } from "@/components/shared/premium-invoice"
import { WheelPicker } from "@/components/shared/wheel-picker"


const STATUS_CONFIG = {
    pending: { label: "تم رفع طلبك", color: "text-muted-foreground", bg: "bg-muted", icon: Clock },
    processing: { label: "جاري العمل", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", icon: Package },
    shipped: { label: "تم الشحن", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", icon: Truck },
    delivered: { label: "تم التسليم", color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", icon: CheckCircle2 },
    canceled: { label: "ملغاة", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: XCircle },
    accepted: { label: "تم القبول", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
    rejected: { label: "مرفوض", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: XCircle },
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
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                        <ArrowRight className="w-5 h-5 text-foreground" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-foreground">متابعة الطلبات</h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Order Management</p>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="ابحث باسم العميل..."
                    className="bg-background border-border pr-10 text-right h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                        <option value="all" className="bg-background text-foreground">كل العملاء</option>
                        {customers.map(c => <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>)}
                    </select>
                </div>
                {dateRange === "custom" && (
                    <div className="md:col-span-2 relative">
                        <div className="md:col-span-2 flex items-center gap-2">
                            <div className="w-full">
                                <WheelPicker
                                    date={customStart ? new Date(customStart) : undefined}
                                    setDate={(d: Date | undefined) => {
                                        if (d) {
                                            const offset = d.getTimezoneOffset()
                                            const localDate = new Date(d.getTime() - (offset * 60 * 1000))
                                            setCustomStart(localDate.toISOString().split('T')[0])
                                        } else {
                                            setCustomStart('')
                                        }
                                    }}
                                    placeholder="من تاريخ"
                                />
                            </div>
                            <div className="w-full">
                                <WheelPicker
                                    date={customEnd ? new Date(customEnd) : undefined}
                                    setDate={(d: Date | undefined) => {
                                        if (d) {
                                            const offset = d.getTimezoneOffset()
                                            const localDate = new Date(d.getTime() - (offset * 60 * 1000))
                                            setCustomEnd(localDate.toISOString().split('T')[0])
                                        } else {
                                            setCustomEnd('')
                                        }
                                    }}
                                    placeholder="إلى تاريخ"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

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

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {["all", "processing", "shipped", "delivered", "canceled"].map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setFilter(s)
                            hapticFeedback('light')
                        }}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap border border-transparent",
                            filter === s
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 border-border"
                        )}
                    >
                        {s === "all" ? "الكل" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="p-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/10">
                        لا توجد طلبات في هذا التصنيف
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const status = STATUS_CONFIG[order.status]
                        return (
                            <div
                                key={order.id}
                                className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-all border border-border group"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", status.bg, status.color)}>
                                        <status.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">#{order.id} - {order.customerName}</h3>
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
                            className="glass-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto border border-border"
                        >
                            <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
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
                                        className="text-white hover:bg-white/10 gap-2 h-9 px-3 rounded-lg border border-transparent hover:border-white/20"
                                        onClick={() => setInvoicePreviewOrder(selectedOrder)}
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span className="text-xs">معاينة الفاتورة</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-400 hover:bg-blue-400/10 gap-2 h-9 px-3 rounded-lg border border-transparent hover:border-blue-400/20"
                                        onClick={() => printOrderInvoice(selectedOrder, storeSettings)}
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span className="text-xs">طباعة</span>
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
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                        <User className="w-3 h-3" />
                                        العميل
                                    </div>
                                    <p className="font-bold text-foreground text-sm">{selectedOrder.customerName}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                        <Calendar className="w-3 h-3" />
                                        التاريخ
                                    </div>
                                    <p className="font-bold text-foreground text-sm">{selectedOrder.createdAt.toLocaleString('ar-SA')}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase">قائمة المنتجات</h4>
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">📦</div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{item.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{item.quantity} x {item.price} ر.س</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-primary">{(item.quantity * item.price).toFixed(2)} ر.س</p>
                                    </div>
                                ))}
                                <div className="flex justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-2 font-bold text-foreground">
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
                                                    "h-12 text-xs font-bold rounded-xl border border-white/5 transition-all",
                                                    selectedOrder.status === statusKey
                                                        ? STATUS_CONFIG[statusKey].bg + " " + STATUS_CONFIG[statusKey].color + " border-" + STATUS_CONFIG[statusKey].color.split(' ')[0].replace('text-', '') + "/20 shadow-lg"
                                                        : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
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
