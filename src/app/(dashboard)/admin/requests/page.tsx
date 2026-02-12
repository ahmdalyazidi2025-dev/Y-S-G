"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Camera, Clock, CheckCircle2, XCircle, User, Calendar, MessageSquare, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, ProductRequest } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const REQUEST_STATUS = {
    pending: { label: "قيد المراجعة", color: "text-orange-400", bg: "bg-orange-400/10", icon: Clock },
    fulfilled: { label: "تم توفيره", color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
    rejected: { label: "مرفوض", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
}

export default function AdminRequestsPage() {
    const { productRequests, updateProductRequestStatus, deleteProductRequest, storeSettings, updateStoreSettings } = useStore()
    const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null)
    const [statusFilter, setStatusFilter] = useState<'pending' | 'fulfilled' | 'rejected'>('pending')

    const filteredRequests = productRequests.filter(r => r.status === statusFilter)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">طلبات المنتجات</h1>

                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <span className={`text-xs font-bold transition-colors ${storeSettings.enableProductRequests !== false ? "text-green-400" : "text-slate-500"}`}>
                        {storeSettings.enableProductRequests !== false ? "استقبال الطلبات مفعل" : "استقبال الطلبات متوقف"}
                    </span>
                    <Switch
                        checked={storeSettings.enableProductRequests !== false}
                        onCheckedChange={(checked) => {
                            updateStoreSettings({ ...storeSettings, enableProductRequests: checked })
                            toast.success(checked ? "تم تفعيل استقبال الطلبات" : "تم إيقاف استقبال الطلبات")
                        }}
                        className="data-[state=checked]:bg-green-500"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/5">
                {(['pending', 'fulfilled', 'rejected'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                            statusFilter === status
                                ? "bg-primary text-white shadow-lg"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        {REQUEST_STATUS[status].label}
                        <span className="mr-2 opacity-50">
                            ({productRequests.filter(r => r.status === status).length})
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        <Camera className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        {statusFilter === 'pending' ? "لا توجد طلبات جديدة حالياً" : "لا توجد طلبات في هذا القسم"}
                    </div>
                ) : (
                    filteredRequests.map((request) => {
                        const status = REQUEST_STATUS[request.status]
                        return (
                            <div
                                key={request.id}
                                className="glass-card p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors group"
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="w-20 h-20 bg-black/40 rounded-xl overflow-hidden flex-shrink-0 relative">
                                    {request.image ? (
                                        <Image
                                            src={request.image}
                                            alt="product"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <Camera className="w-8 h-8 text-slate-700" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-white text-sm">{request.customerName}</h3>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", status.bg, status.color)}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 line-clamp-2">{request.description || "بدون وصف"}</p>
                                    <div className="flex items-center justify-between text-[9px] text-slate-500">
                                        <span>{request.createdAt.toLocaleDateString('ar-SA')}</span>
                                        <span className="font-mono">#{request.id}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Request Details Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRequest(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-md p-6 relative"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">تفاصيل طلب التوفير</h2>
                                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-white/5 rounded-full">
                                    <XCircle className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="aspect-square bg-black/40 rounded-2xl overflow-hidden border border-white/5 relative">
                                    {selectedRequest.image ? (
                                        <Image
                                            src={selectedRequest.image}
                                            alt="product"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                            <Camera className="w-16 h-16 text-muted-foreground/50" />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                                            <User className="w-3 h-3" />
                                            العميل
                                        </div>
                                        <p className="font-bold text-foreground text-xs">{selectedRequest.customerName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                                            <Calendar className="w-3 h-3" />
                                            التاريخ
                                        </div>
                                        <p className="font-bold text-foreground text-xs">{selectedRequest.createdAt.toLocaleString('ar-SA')}</p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                                        <MessageSquare className="w-3 h-3" />
                                        الوصف
                                    </div>
                                    <p className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/50">
                                        {selectedRequest.description || "لا يوجد وصف متوفر لهذا المنتج"}
                                    </p>
                                </div>

                                <div className="pt-4 flex gap-2">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 gap-2"
                                        onClick={() => {
                                            updateProductRequestStatus(selectedRequest.id, "fulfilled")
                                            setSelectedRequest(null)
                                        }}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>تم التوفير</span>
                                    </Button>
                                    <Button
                                        variant="glass"
                                        className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-12 gap-2"
                                        onClick={() => {
                                            updateProductRequestStatus(selectedRequest.id, "rejected")
                                            setSelectedRequest(null)
                                        }}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>رفض</span>
                                    </Button>

                                    {(selectedRequest.status === 'fulfilled' || selectedRequest.status === 'rejected') && (
                                        <Button
                                            variant="glass"
                                            className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl h-12 w-12 p-0 flex items-center justify-center transition-colors"
                                            onClick={() => {
                                                if (confirm("هل أنت متأكد من حذف هذا الطلب نهائياً؟")) {
                                                    deleteProductRequest(selectedRequest.id)
                                                    setSelectedRequest(null)
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >
        </div >
    )
}
