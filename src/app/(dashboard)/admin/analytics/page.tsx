"use client"

import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, TrendingUp, DollarSign, ShoppingBag, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { isToday, isWithinInterval, startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns"

export default function AnalyticsPage() {
    const { orders } = useStore()
    const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "year" | "all">("all")

    const filteredOrders = useMemo(() => {
        const now = new Date()
        return orders.filter(o => {
            const date = new Date(o.createdAt)
            if (timeRange === "today") return isToday(date)
            if (timeRange === "week") return isWithinInterval(date, { start: startOfWeek(now), end: endOfDay(now) })
            if (timeRange === "month") return isWithinInterval(date, { start: startOfMonth(now), end: endOfDay(now) })
            if (timeRange === "year") return isWithinInterval(date, { start: startOfYear(now), end: endOfDay(now) })
            return true
        })
    }, [orders, timeRange])

    const stats = useMemo(() => {
        const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0)
        const orderCount = filteredOrders.length
        const avgOrder = orderCount > 0 ? totalSales / orderCount : 0

        // Group by location
        const locationMap: Record<string, number> = {}
        filteredOrders.forEach(o => {
            const loc = o.customerLocation || "غير محدد"
            locationMap[loc] = (locationMap[loc] || 0) + o.total
        })
        const topLocations = Object.entries(locationMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)

        return { totalSales, orderCount, avgOrder, topLocations }
    }, [filteredOrders])

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">إحصائيات المبيعات</h1>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {[
                        { id: "today", label: "اليوم" },
                        { id: "week", label: "أسبوع" },
                        { id: "month", label: "شهر" },
                        { id: "all", label: "الكل" },
                    ].map((range) => (
                        <button
                            key={range.id}
                            onClick={() => setTimeRange(range.id as typeof timeRange)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                                timeRange === range.id
                                    ? "bg-primary text-white shadow-lg"
                                    : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-b-2 border-green-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500 opacity-50" />
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">إجمالي المبيعات</p>
                    <h2 className="text-3xl font-black text-white">
                        {stats.totalSales.toLocaleString()} <small className="text-sm font-bold text-slate-500">ر.س</small>
                    </h2>
                </div>

                <div className="glass-card p-6 border-b-2 border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">عدد الطلبات</p>
                    <h2 className="text-3xl font-black text-white">{stats.orderCount}</h2>
                </div>

                <div className="glass-card p-6 border-b-2 border-orange-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">متوسط الطلب</p>
                    <h2 className="text-3xl font-black text-white">
                        {Math.round(stats.avgOrder).toLocaleString()} <small className="text-sm font-bold text-slate-500">ر.س</small>
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        أعلى المناطق مبيعاً
                    </h3>
                    <div className="space-y-4">
                        {stats.topLocations.map(([loc, total], idx) => (
                            <div key={loc} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400">{loc}</span>
                                    <span className="text-white">{total.toLocaleString()} ر.س</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(total / stats.totalSales) * 100}%` }}
                                        className={cn(
                                            "h-full rounded-full transition-all",
                                            idx === 0 ? "bg-primary" : idx === 1 ? "bg-blue-500" : "bg-slate-700"
                                        )}
                                    />
                                </div>
                            </div>
                        ))}
                        {stats.topLocations.length === 0 && (
                            <p className="text-center py-10 text-slate-500 italic">لا توجد بيانات متاحة</p>
                        )}
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-400" />
                        أحدث العمليات
                    </h3>
                    <div className="space-y-3">
                        {filteredOrders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex flex-col">
                                    <span className="font-bold text-xs text-white">{order.customerName}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                                </div>
                                <span className="text-sm font-bold text-green-500">{order.total} ر.س</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
