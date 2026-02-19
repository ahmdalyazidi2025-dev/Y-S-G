"use client"

import { useMemo, useState, useEffect } from "react"
import { useOrders, useAuth, Order } from "@/context/store-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { ArrowRight, TrendingUp, DollarSign, Package, ShoppingCart, Calendar, Users, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getVisits, DailyVisit } from "@/lib/analytics"
import { WheelPicker } from "@/components/shared/wheel-picker"


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const { orders } = useOrders()
    const { currentUser } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (currentUser && currentUser.role !== 'admin' && !currentUser.permissions?.includes('sales')) {
            router.push('/admin')
        }
    }, [currentUser, router])

    const [timeRange, setTimeRange] = useState<"all" | "day" | "week" | "month" | "year" | "custom">("week")
    const [customStart, setCustomStart] = useState("")
    const [customEnd, setCustomEnd] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [visits, setVisits] = useState<DailyVisit[]>([])

    useEffect(() => {
        const fetchVisits = async () => {
            const now = new Date()
            let start = new Date()
            let end = new Date()

            // Reset start to begin of today by default for relative ranges
            // However, for 'day', 'week' etc logic:

            switch (timeRange) {
                case "all": start.setFullYear(2020); break;
                case "day": start.setHours(0, 0, 0, 0); break;
                case "week": start.setDate(now.getDate() - 7); break;
                case "month": start.setMonth(now.getMonth() - 1); break;
                case "year": start.setFullYear(now.getFullYear() - 1); break;
                case "custom":
                    if (customStart) start = new Date(customStart)
                    if (customEnd) end = new Date(customEnd)
                    break;
            }

            // Adjust end of day
            end.setHours(23, 59, 59, 999)
            // Adjust start to beginning of day if not 'custom' or if custom logic needs it
            if (timeRange !== 'custom') {
                // Logic above sets start correctly for relative
            } else {
                start.setHours(0, 0, 0, 0)
            }

            const data = await getVisits(start, end)
            setVisits(data)
        }

        fetchVisits()
    }, [timeRange, customStart, customEnd])

    const totalVisits = visits.reduce((acc, v) => acc + v.count, 0)

    const filteredOrders = useMemo(() => {
        const now = new Date()
        const start = new Date()
        let end = new Date()

        switch (timeRange) {
            case "all": start.setFullYear(2000); break; // All time
            case "day": start.setHours(0, 0, 0, 0); break;
            case "week": start.setDate(now.getDate() - 7); break;
            case "month": start.setMonth(now.getMonth() - 1); break;
            case "year": start.setFullYear(now.getFullYear() - 1); break;
            case "custom":
                if (customStart) {
                    start.setTime(new Date(customStart).getTime())
                    start.setHours(0, 0, 0, 0)
                }
                if (customEnd) {
                    end = new Date(customEnd)
                    end.setHours(23, 59, 59, 999)
                }
                break;
        }

        // If timeRange is 'all', just return all orders (or filter by start date 2000 which effectively is all)
        return orders.filter((o: Order) => {
            const date = new Date(o.createdAt)
            let matchesTime = true
            if (timeRange === "custom") {
                matchesTime = date >= start && date <= end
            } else {
                matchesTime = date >= start
            }

            const matchesSearch = searchQuery
                ? o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toString().includes(searchQuery)
                : true

            return matchesTime && matchesSearch
        })
    }, [orders, timeRange, customStart, customEnd, searchQuery])

    // 1. Calculate Revenue Over Time
    const revenueData = useMemo(() => {
        let periods = 7
        let timeUnit: 'hour' | 'day' | 'month' = 'day'

        const now = new Date()
        const endDate = timeRange === "custom" && customEnd ? new Date(customEnd) : now
        if (timeRange === "custom" && customEnd) endDate.setHours(23, 59, 59, 999)

        if (timeRange === "all") { periods = 12; timeUnit = 'month' }
        if (timeRange === "month") periods = 30
        if (timeRange === "year") { periods = 12; timeUnit = 'month' }
        if (timeRange === "day") { periods = 24; timeUnit = 'hour' }

        if (timeRange === "custom" && customStart && customEnd) {
            const start = new Date(customStart)
            const end = new Date(customEnd)
            const diffTime = Math.abs(end.getTime() - start.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            periods = diffDays + 1 // Inclusive
            if (periods > 60) timeUnit = 'month'
        }

        const dataPoints = []

        for (let i = 0; i < periods; i++) {
            const d = new Date(endDate)

            if (timeUnit === 'month') {
                d.setMonth(endDate.getMonth() - i)
                d.setDate(1)
            } else if (timeUnit === 'hour') {
                d.setHours(endDate.getHours() - i)
            } else {
                d.setDate(endDate.getDate() - i)
            }

            dataPoints.push(d)
        }

        // Reverse to show oldest to newest
        dataPoints.reverse()

        return dataPoints.map(date => {
            let label = ""
            let periodOrders = []

            if (timeUnit === 'hour') {
                label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
                periodOrders = orders.filter((o: Order) => {
                    const od = new Date(o.createdAt)
                    return od.getDate() === date.getDate() && od.getHours() === date.getHours() && od.getFullYear() === date.getFullYear() && od.getMonth() === date.getMonth()
                })
            } else if (timeUnit === 'month') {
                label = date.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' })
                periodOrders = orders.filter((o: Order) => {
                    const od = new Date(o.createdAt)
                    return od.getMonth() === date.getMonth() && od.getFullYear() === date.getFullYear()
                })
            } else {
                label = date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
                periodOrders = orders.filter((o: Order) => {
                    const od = new Date(o.createdAt)
                    return od.toDateString() === date.toDateString()
                })
            }

            return {
                date: label,
                revenue: periodOrders.reduce((sum: number, o: Order) => sum + o.total, 0),
                orders: periodOrders.length
            }
        })
    }, [orders, timeRange, customStart, customEnd])

    // 2. Top Selling Products (Filtered)
    const topProductsData = useMemo(() => {
        const productSales: Record<string, number> = {}
        filteredOrders.forEach((order: Order) => {
            order.items.forEach(item => {
                productSales[item.name] = (productSales[item.name] || 0) + item.quantity
            })
        })
        return Object.entries(productSales)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)
    }, [filteredOrders])

    // 3. Order Status Distribution (Filtered)
    const statusData = useMemo(() => {
        const stats: Record<string, number> = {}
        filteredOrders.forEach((o: Order) => {
            stats[o.status] = (stats[o.status] || 0) + 1
        })
        return Object.entries(stats).map(([name, value]) => ({
            name: name === 'delivered' ? 'مكتمل' : name === 'processing' ? 'جاري' : name === 'pending' ? 'جديد' : 'ملغي',
            value
        }))
    }, [filteredOrders])

    const totalRevenue = filteredOrders.reduce((sum: number, o: Order) => sum + o.total, 0)
    const uniqueCustomers = new Set(filteredOrders.map((o: Order) => o.customerId)).size

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-foreground" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-foreground">تحليل البيانات</h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">لوحة التحليلات البيانية</p>
                </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="بحث باسم العميل..."
                    className="bg-background border-border pr-10 text-right h-12 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Time Filter */}
            <div className="flex flex-col md:flex-row justify-end p-1 gap-4">
                {timeRange === "custom" && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 w-full md:w-auto">
                        <div className="w-full md:w-[160px]">
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
                        <span className="text-slate-500 text-xs">إلى</span>
                        <div className="w-full md:w-[160px]">
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
                )}

                <div className="bg-muted p-1 rounded-xl border border-border flex gap-1 self-end">
                    {(["all", "day", "week", "month", "year", "custom"] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                                timeRange === r ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            {r === "all" && "الكل"}
                            {r === "day" && "اليوم"}
                            {r === "week" && "الأسبوع"}
                            {r === "month" && "الشهر"}
                            {r === "year" && "السنة"}
                            {r === "custom" && (
                                <>
                                    <span>مخصص</span>
                                    <Calendar className="w-3 h-3" />
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="glass-card border-border bg-emerald-500/10 col-span-2">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-500 font-bold">إجمالي الإيرادات</CardDescription>
                        <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            {totalRevenue.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass-card border-border bg-blue-500/10 col-span-2 md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-500 font-bold">الطلبات النشطة</CardDescription>
                        <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            {filteredOrders.filter((o: Order) => o.status === "processing" || o.status === "pending").length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass-card border-border bg-violet-500/10 col-span-2 md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-violet-500 font-bold">قاعدة العملاء</CardDescription>
                        <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            {uniqueCustomers}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass-card border-border bg-purple-500/10 col-span-1">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-purple-500 font-bold">المنتجات المباعة</CardDescription>
                        <CardTitle className="text-lg text-foreground">
                            {filteredOrders.reduce((sum: number, o: Order) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass-card border-border bg-pink-500/10 col-span-1">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-pink-500 font-bold">الزيارات</CardDescription>
                        <CardTitle className="text-lg text-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {totalVisits.toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="glass-card border-border bg-orange-500/10 col-span-1">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-orange-500 font-bold">متوسط السلة</CardDescription>
                        <CardTitle className="text-lg text-foreground">
                            {filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length).toFixed(0) : 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Visits Chart */}
            <Card className="glass-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">الزيارات</CardTitle>
                    <CardDescription>عدد الزوار خلال الفترة المحددة</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={visits}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="currentColor"
                                strokeOpacity={0.5}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => {
                                    // Format YYYY-MM-DD to simpler display
                                    const d = new Date(value);
                                    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
                                }}
                            />
                            <YAxis stroke="currentColor" strokeOpacity={0.5} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number | string) => `${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            />
                            <Bar dataKey="count" name="الزوار" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="glass-card border-border col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-foreground">إيرادات آخر 7 أيام</CardTitle>
                        <CardDescription>نمو المبيعات اليومي</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                                <XAxis dataKey="date" stroke="currentColor" strokeOpacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="currentColor" strokeOpacity={0.5} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number | string) => `${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="glass-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">المنتجات الأكثر مبيعاً</CardTitle>
                        <CardDescription>أفضل 5 منتجات طلباً</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProductsData} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} horizontal={false} />
                                <XAxis type="number" stroke="currentColor" strokeOpacity={0.5} hide />
                                <YAxis dataKey="name" type="category" stroke="currentColor" strokeOpacity={0.5} fontSize={11} width={100} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.2)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                                <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card className="glass-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">حالات الطلبات</CardTitle>
                        <CardDescription>توزيع الطلبات حسب الحالة</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-4 justify-center absolute bottom-4">
                            {statusData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {entry.name} ({entry.value})
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
