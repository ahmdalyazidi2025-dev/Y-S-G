"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Camera, Clock, CheckCircle2, XCircle, User, Calendar, MessageSquare, ChevronDown, ChevronLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, ProductRequest } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const REQUEST_STATUS = {
    pending: { label: "قيد المراجعة", color: "text-orange-500", bg: "bg-orange-500/10", icon: Clock },
    fulfilled: { label: "تم توفيره", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
    rejected: { label: "مرفوض", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
}

const formatRequestDate = (d: any, format: "date" | "datetime" = "datetime"): string => {
    if (!d) return ""
    try {
        let dateObj: Date
        if (d instanceof Date) dateObj = d
        else if (d && typeof d === 'object' && 'toDate' in d && typeof d.toDate === 'function') dateObj = d.toDate()
        else if (d && typeof d === 'object' && 'seconds' in d) dateObj = new Date(d.seconds * 1000)
        else dateObj = new Date(d)
        if (isNaN(dateObj.getTime())) return ""
        return format === "date" ? dateObj.toLocaleDateString('ar-SA') : dateObj.toLocaleString('ar-SA')
    } catch { return "" }
}

export default function AdminRequestsPage() {
    const { productRequests, updateProductRequestStatus, deleteProductRequest } = useStore()
    const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null)
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>("all")

    // Filter requests by status
    const filteredRequests = useMemo(() =>
        productRequests.filter(r => statusFilter === "all" || r.status === statusFilter),
        [productRequests, statusFilter]
    )

    // Group requests by customer
    const requestsByCustomer = useMemo(() => {
        const groups: Record<string, ProductRequest[]> = {}
        filteredRequests.forEach(req => {
            const key = req.customerName || "عميل غير معروف"
            if (!groups[key]) groups[key] = []
            groups[key].push(req)
        })
        return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
    }, [filteredRequests])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1 text-slate-900 dark:text-white">طلبات التوفير</h1>
                <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">
                    {productRequests.length} طلب
                </span>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                {[
                    { key: "all", label: "الكل" },
                    { key: "pending", label: "قيد المراجعة" },
                    { key: "fulfilled", label: "تم توفيره" },
                    { key: "rejected", label: "مرفوض" },
                ].map(({ key, label }) => (
                    <button key={key} onClick={() => setStatusFilter(key)}
                        className={cn("flex-1 py-2 text-[10px] font-bold rounded-xl transition-all",
                            statusFilter === key ? "bg-primary text-white shadow-lg" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        )}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Customer-Grouped List */}
            {requestsByCustomer.length === 0 ? (
                <div className="p-20 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-white/5">
                    <Camera className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    لا توجد طلبات لتوفير منتجات حالياً
                </div>
            ) : (
                <div className="space-y-3">
                    {requestsByCustomer.map(([customerName, customerRequests]) => {
                        const isExpanded = expandedCustomer === customerName
                        const pendingCount = customerRequests.filter(r => r.status === "pending").length
                        const latestRequest = customerRequests[0]

                        return (
                            <div key={customerName} className="glass-card overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                                {/* Customer Card Header */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer"
                                    onClick={() => setExpandedCustomer(isExpanded ? null : customerName)}
                                >
                                    {/* Avatar / Latest Image */}
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 relative">
                                        {latestRequest?.image ? (
                                            <Image src={latestRequest.image} alt="product" fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-7 h-7 text-primary/40" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white truncate">{customerName}</h3>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                                {customerRequests.length} طلب
                                            </span>
                                            {pendingCount > 0 && (
                                                <span className="text-[10px] bg-orange-500/10 text-orange-500 font-bold px-2 py-0.5 rounded-full">
                                                    {pendingCount} قيد المراجعة
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expand icon */}
                                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-transform duration-300 flex-shrink-0", isExpanded && "rotate-180")}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Expandable Requests */}
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
                                                {customerRequests.map((request) => {
                                                    const status = REQUEST_STATUS[request.status || "pending"]
                                                    return (
                                                        <div
                                                            key={request.id}
                                                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                                                            onClick={() => setSelectedRequest(request)}
                                                        >
                                                            {/* Request Image */}
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/5 relative">
                                                                {request.image ? (
                                                                    <Image src={request.image} alt="product" fill className="object-cover" unoptimized />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Camera className="w-5 h-5 text-slate-400" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Description */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                                                    {request.description || "بدون وصف"}
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">{formatRequestDate(request.createdAt, "date")}</p>
                                                            </div>

                                                            {/* Status */}
                                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0", status.bg, status.color)}>
                                                                {status.label}
                                                            </span>

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
                    })}
                </div>
            )}

            {/* Request Details Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedRequest(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-md p-6 relative">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">تفاصيل طلب التوفير</h2>
                                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                    <XCircle className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Image */}
                                <div className="aspect-square bg-slate-100 dark:bg-black/40 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 relative">
                                    {selectedRequest.image ? (
                                        <Image src={selectedRequest.image} alt="product" fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Camera className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                                        </div>
                                    )}
                                </div>

                                {/* Customer & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px]"><User className="w-3 h-3" />العميل</div>
                                        <p className="font-bold text-slate-900 dark:text-white text-xs">{selectedRequest.customerName || "عميل غير معروف"}</p>
                                        {selectedRequest.customerPhone && (
                                            <a href={`tel:${selectedRequest.customerPhone}`} className="text-[10px] text-primary hover:underline font-bold block mt-0.5">
                                                📞 {selectedRequest.customerPhone}
                                            </a>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-slate-400 text-[10px]"><Calendar className="w-3 h-3" />التاريخ</div>
                                        <p className="font-bold text-slate-900 dark:text-white text-xs">{formatRequestDate(selectedRequest.createdAt, "datetime")}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px]"><MessageSquare className="w-3 h-3" />الوصف</div>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                        {selectedRequest.description || "لا يوجد وصف متوفر لهذا المنتج"}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="pt-2 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 gap-2"
                                            onClick={() => { updateProductRequestStatus(selectedRequest.id, "fulfilled"); setSelectedRequest(null) }}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>تم التوفير</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl h-12 gap-2"
                                            onClick={() => { updateProductRequestStatus(selectedRequest.id, "rejected"); setSelectedRequest(null) }}
                                        >
                                            <XCircle className="w-4 h-4" />
                                            <span>رفض</span>
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-500/20 rounded-xl h-12 gap-2 mt-1"
                                        onClick={() => {
                                            if (confirm("هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟")) {
                                                deleteProductRequest(selectedRequest.id);
                                                setSelectedRequest(null);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>حذف الطلب نهائياً</span>
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
