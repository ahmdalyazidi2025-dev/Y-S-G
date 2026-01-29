"use client"

import { useUsageStats } from "@/hooks/use-usage-stats"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Database, HardDrive, ExternalLink, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#ff6b6b', '#845ec2'];

export default function SystemMonitorPage() {
    const stats = useUsageStats()

    const forceUpdateSW = async () => {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations()
            for (let registration of registrations) {
                await registration.update()
            }
            toast.info("تم إرسال طلب تحديث لـ Service Worker. يرجى إغلاق المتصفح وفتحه مجدداً لضمان تفعيل التغييرات.")
        }
    }

    const dbData = Object.entries(stats.db.breakdown)
        .map(([name, bytes]) => ({ name, value: bytes }))
        .sort((a, b) => b.value - a.value)

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6 pb-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-white">حالة النظام والموارد</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">System Health & Billing</p>
                </div>
                <Link href="https://console.firebase.google.com/u/0/project/y-s-g-7c463/usage/details" target="_blank">
                    <Button className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl">
                        <ExternalLink className="w-4 h-4" />
                        <span>إدارة الاشتراك (Google)</span>
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Database Usage */}
                <Card className="glass-card border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Database className="w-32 h-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-400" />
                            <span>قاعدة البيانات (Firestore)</span>
                        </CardTitle>
                        <CardDescription>مساحة النصوص والبيانات المجانية: 1 جيجا (1000 ميجا)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-white">
                                {stats.db.usedMB.toFixed(3)}
                            </span>
                            <span className="text-sm text-slate-400 mb-1">/ 1000 ميجا</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/5">
                            <div
                                className={`h-full transition-all duration-1000 ${stats.db.percentage > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.max(stats.db.percentage, 1)}%` }}
                            />
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                            {stats.db.percentage > 80 ? (
                                <span className="text-red-400 flex items-center gap-1 font-bold">
                                    <AlertTriangle className="w-3 h-3" />
                                    اقتربت من الحد المسموح!
                                </span>
                            ) : (
                                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    أنت في المنطقة الآمنة
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Storage Usage */}
                <Card className="glass-card border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <HardDrive className="w-32 h-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-orange-400" />
                            <span>مساحة التخزين (Storage)</span>
                        </CardTitle>
                        <CardDescription>مساحة الصور والملفات المجانية: 5 جيجا (5000 ميجا)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-white">
                                {stats.storage.usedMB.toFixed(2)}
                            </span>
                            <span className="text-sm text-slate-400 mb-1">/ 5000 ميجا</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/5">
                            <div
                                className={`h-full transition-all duration-1000 ${stats.storage.percentage > 80 ? 'bg-red-500' : 'bg-orange-500'}`}
                                style={{ width: `${Math.max(stats.storage.percentage, 1)}%` }}
                            />
                        </div>

                        <div className="text-xs text-slate-400">
                            تم تقدير المساحة بناءً على {stats.storage.imageCount} صورة (متوسط 250kb للصورة)
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Breakdown Chart */}
                <Card className="glass-card border-white/5 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white">توزيع البيانات</CardTitle>
                        <CardDescription>أكثر العناصر استهلاكاً لقاعدة البيانات</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dbData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {dbData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c2a36', border: 'none', borderRadius: '8px' }}
                                    formatter={(value: any) => formatBytes(value)}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Legend / Details */}
                <Card className="glass-card border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">تفاصيل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dbData.slice(0, 6).map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-slate-300 capitalize">
                                        {entry.name === 'products' ? 'المنتجات' :
                                            entry.name === 'orders' ? 'الطلبات' :
                                                entry.name === 'customers' ? 'العملاء' :
                                                    entry.name === 'banners' ? 'اللافتات' :
                                                        entry.name === 'requests' ? 'الطلبات الخاصة' :
                                                            entry.name === 'notifications' ? 'الإشعارات' :
                                                                entry.name === 'categories' ? 'الأقسام' :
                                                                    entry.name}
                                    </span>
                                </div>
                                <span className="font-mono text-slate-500">{formatBytes(entry.value)}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Notification Debug */}
            <Card className="glass-card border-white/5 relative overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-emerald-400" />
                        <span>تحديث النظام</span>
                    </CardTitle>
                    <CardDescription>تحديث ملفات الموقع للحصول على آخر النسخ</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={forceUpdateSW}
                        className="bg-white/5 hover:bg-white/10 text-white border-white/10 gap-2 h-16 rounded-2xl w-full"
                    >
                        <div className="flex flex-col items-center">
                            <RefreshCw className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs mt-1">تحديث ملفات الموقع (V10)</span>
                        </div>
                    </Button>
                </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4 items-start">
                <InfoIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="space-y-1">
                    <h4 className="font-bold text-blue-400">ملاحظة هامة</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        هذه الأرقام هي تقديرات تقريبية بناءً على البيانات المحملة في المتصفح. لمعرفة الاستهلاك الفعلي بدقة 100% وإدارة الفواتير، يرجى زيارة لوحة تحكم Google Firebase الرسمية عبر الزر في الأعلى.
                    </p>
                </div>
            </div>
        </div>
    )
}

function InfoIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )
}
