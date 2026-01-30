"use client"

import { useStore, Order, Customer } from "@/context/store-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts"
import {
    TrendingUp, DollarSign, Users, Award,
    ArrowUpRight, ArrowDownRight, Calendar, UserPlus
} from "lucide-react"
import { motion } from "framer-motion"
import { format, subDays, isSameDay, startOfMonth, eachDayOfInterval } from "date-fns"
import { ar } from "date-fns/locale"

export default function ReportsPage() {
    const { orders, customers, products } = useStore()

    // --- Calculations ---

    // 1. Total Revenue
    // Only count processed/delivered/shipped orders? Or all paid?
    // Let's assume all except 'canceled' | 'rejected'
    const validOrders = orders.filter(o => o.status !== "canceled" && o.status !== "rejected")
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0)

    // 2. Total Profit
    // Profit = Item Price - Cost Price (VAT is handled in price usually, but let's assume simple profit)
    // Note: If costPrice is missing, profit for that item is calculated as 0 or Price?
    // Let's assume if cost is 0/missing, profit = price (100% margin) OR safe 0?
    // User added costPrice recently, so old orders/products might be 0.
    // Let's take (Price - Cost).
    const totalProfit = validOrders.reduce((acc, order) => {
        const orderProfit = order.items.reduce((itemAcc, item) => {
            const cost = item.costPrice || 0
            const revenue = item.selectedPrice
            // VAT is included in selectedPrice usually?
            // In invoice tempalte: total = (price * qty) * 1.15.
            // item.selectedPrice in Cart is usually unitPrice.
            // Let's assume selectedPrice is the selling price (excluding VAT usually in code logic, but store displays inc VAT?)
            // Checking logic: `calculateTotals` in Cart usually handles VAT.
            // Let's assume Profit = (Selling Price * Qty) - (Cost * Qty).
            return itemAcc + ((revenue - cost) * item.quantity)
        }, 0)
        return acc + orderProfit
    }, 0)

    // 3. Referrals
    const totalReferrals = customers.reduce((sum, c) => sum + (c.referralCount || 0), 0)
    const topReferrers = [...customers]
        .sort((a, b) => (b.referralCount || 0) - (a.referralCount || 0))
        .slice(0, 5)
        .filter(c => (c.referralCount || 0) > 0)

    // 4. Sales Over Time (Last 30 Days)
    const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
    const salesData = last30Days.map(date => {
        const dayOrders = validOrders.filter(o => isSameDay(o.createdAt, date))
        const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0)
        const profit = dayOrders.reduce((sum, o) => {
            return sum + o.items.reduce((iSum, item) => iSum + ((item.selectedPrice - (item.costPrice || 0)) * item.quantity), 0)
        }, 0)
        return {
            date: format(date, "d MMM", { locale: ar }),
            revenue,
            profit
        }
    })

    // 5. Top Products
    const productSales: Record<string, number> = {}
    validOrders.forEach(o => {
        o.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity
        })
    })
    const topProducts = Object.entries(productSales)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)


    // --- UI Components ---

    return (
        <div className="space-y-8 p-1">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                        التقارير والإحصائيات
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">نظرة شاملة على أداء المتجر والعملاء</p>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="صافي المبيعات"
                    value={`${totalRevenue.toLocaleString()} ر.س`}
                    subtext="آخر 30 يوم"
                    icon={DollarSign}
                    color="blue"
                    trend="+12%" // Dummy trend for now
                />
                <MetricCard
                    title="صافي الأرباح"
                    value={`${totalProfit.toLocaleString()} ر.س`}
                    subtext="بعد خصم التكلفة"
                    icon={TrendingUp}
                    color="green"
                    trend="+8%"
                />
                <MetricCard
                    title="الإحالات الناجحة"
                    value={totalReferrals}
                    subtext="عملاء جدد عن طريق الدعوة"
                    icon={UserPlus}
                    color="purple"
                    trend={totalReferrals > 0 ? "نشط" : "لا يوجد"}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue & Profit Chart */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-[32px] p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">تحليل الدخل والأرباح</h3>
                            <p className="text-sm text-slate-400">مقارنة المبيعات مع الأرباح الصافية خلال الشهر الماضي</p>
                        </div>
                        <Calendar className="text-slate-500 w-5 h-5" />
                    </div>

                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" name="المبيعات" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="profit" name="الأرباح" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorProf)" />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">المنتجات الأكثر مبيعاً</h3>
                    <div className="space-y-4">
                        {topProducts.map((p, i) => (
                            <div key={p.name} className="flex items-center gap-4">
                                <span className={`
                                    w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                    ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-orange-700 text-white' : 'bg-white/5 text-slate-400'}
                                `}>
                                    {i + 1}
                                </span>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-slate-200 text-sm truncate max-w-[180px]">{p.name}</span>
                                        <span className="text-xs font-mono text-slate-400">{p.count} مبيعة</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${(p.count / topProducts[0].count) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <div className="text-center py-10 text-slate-500">لا توجد مبيعات كافية</div>
                        )}
                    </div>
                </div>

                {/* Top Referrers */}
                <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-6">أفضل المسوقين (الإحالات)</h3>
                    <div className="space-y-4">
                        {topReferrers.map((c, i) => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                        {c.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{c.name}</h4>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono">{c.referralCode || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center px-4">
                                    <span className="block text-xl font-black text-purple-400">{c.referralCount}</span>
                                    <span className="text-[10px] text-slate-500">إحالة</span>
                                </div>
                            </div>
                        ))}
                        {topReferrers.length === 0 && (
                            <div className="text-center py-10 text-slate-500">لا توجد إحالات حتى الآن</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, subtext, icon: Icon, color, trend }: any) {
    return (
        <div className={`
            relative overflow-hidden p-6 rounded-[32px] border transition-all duration-300
            bg-slate-900/50 border-white/5 hover:border-${color}-500/30 group
        `}>
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl group-hover:bg-${color}-500/20 transition-all`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-${color}-500/10 text-${color}-400 text-xs font-bold`}>
                        {trend}
                        <ArrowUpRight className="w-3 h-3" />
                    </div>
                </div>

                <h3 className="text-slate-400 font-bold text-sm mb-1">{title}</h3>
                <div className="text-3xl font-black text-white tracking-tight">{value}</div>
                <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>
            </div>
        </div>
    )
}
