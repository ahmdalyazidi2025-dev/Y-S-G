"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Camera, Clock, CheckCircle2, XCircle, User, Calendar, MessageSquare, Trash2, Folder, Bell, Send } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, ProductRequest } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"

const REQUEST_STATUS = {
    pending: { label: "قيد المراجعة", color: "text-orange-400", bg: "bg-orange-400/10", icon: Clock },
    fulfilled: { label: "تم توفيره", color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
    rejected: { label: "مرفوض", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
}

export default function AdminRequestsPage() {
    const { productRequests, updateProductRequestStatus, deleteProductRequest, storeSettings, updateStoreSettings, sendMessage, products } = useStore()
    const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null)
    const [statusFilter, setStatusFilter] = useState<'pending' | 'fulfilled' | 'rejected'>('pending')
    const [viewMode, setViewMode] = useState<'all' | 'folders'>('all')
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

    // Notify State
    const [isNotifyMode, setIsNotifyMode] = useState(false)
    const [notifyMessage, setNotifyMessage] = useState("")
    const [notifyLink, setNotifyLink] = useState("")
    const [openProductSelect, setOpenProductSelect] = useState(false)
    const [productSearch, setProductSearch] = useState("")

    const handleNotify = async () => {
        if (!selectedRequest || !selectedRequest.customerId) {
            toast.error("لا يمكن إرسال إشعار: هوية العميل غير معروفة")
            return
        }

        if (!notifyMessage) {
            toast.error("الرجاء كتابة رسالة")
            return
        }

        await sendMessage(
            notifyMessage,
            true, // isAdmin
            selectedRequest.customerId,
            selectedRequest.customerName,
            notifyLink,
            notifyLink ? "عرض المنتج" : undefined,
            selectedRequest.image, // Send request image
            true // isSystemNotification: true (Don't show in chat)
        )

        toast.success("تم إرسال الإشعار للعميل")
        setIsNotifyMode(false)
        setNotifyMessage("")
        setNotifyLink("")
    }

    const filteredRequests = productRequests.filter(r => r.status === statusFilter)

    // Group requests by customer name
    const groupedRequests = productRequests.reduce((acc, request) => {
        const name = request.customerName || "غير معروف"
        if (!acc[name]) acc[name] = []
        acc[name].push(request)
        return acc
    }, {} as Record<string, ProductRequest[]>)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-foreground" />
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

            {/* View Toggle & Content */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => { setViewMode('all'); setSelectedCustomer(null); }}
                    className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                        viewMode === 'all' && !selectedCustomer
                            ? "bg-primary text-white shadow-lg"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <Clock className="w-4 h-4" />
                    الكل
                </button>
                <button
                    onClick={() => { setViewMode('folders'); setSelectedCustomer(null); }}
                    className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                        viewMode === 'folders' || selectedCustomer
                            ? "bg-primary text-white shadow-lg"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                    )}
                >
                    <Folder className="w-4 h-4" />
                    المجلدات
                </button>
            </div>

            {selectedCustomer ? (
                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedCustomer(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        <span className="text-sm font-bold">العودة للمجلدات</span>
                    </button>

                    <div className="flex items-center gap-4 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{selectedCustomer}</h2>
                            <p className="text-slate-400 text-xs text-right">
                                {groupedRequests[selectedCustomer]?.length || 0} طلبات
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {productRequests
                            .filter(r => r.customerName === selectedCustomer)
                            .map((request) => {
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
                            })}
                    </div>
                </div>
            ) : viewMode === 'folders' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in zoom-in duration-300">
                    {Object.entries(groupedRequests).map(([name, requests]) => {
                        const pendingCount = requests.filter(r => r.status === 'pending').length
                        const thumbnails = requests
                            .filter(r => r.image)
                            .map(r => r.image!)
                            .slice(0, 4)

                        return (
                            <button
                                key={name}
                                onClick={() => setSelectedCustomer(name)}
                                className="group relative glass-card p-4 flex flex-col items-center gap-4 hover:bg-primary/5 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/10 border-t border-white/10 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                {pendingCount > 0 && (
                                    <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full font-bold animate-pulse shadow-lg shadow-orange-500/20 z-10 text-shadow">
                                        {pendingCount}
                                    </span>
                                )}

                                <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative shadow-inner group-hover:shadow-primary/20 transition-all">
                                    {thumbnails.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-0.5 w-full h-full bg-slate-900/50">
                                            {thumbnails.map((src, idx) => (
                                                <div key={idx} className="relative w-full h-full">
                                                    <Image
                                                        src={src}
                                                        alt="preview"
                                                        fill
                                                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                        unoptimized
                                                    />
                                                </div>
                                            ))}
                                            {thumbnails.length < 4 && Array.from({ length: 4 - thumbnails.length }).map((_, idx) => (
                                                <div key={`empty-${idx}`} className="bg-white/5 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white/10" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                            <Folder className="w-8 h-8 text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-center space-y-1 z-10 w-full">
                                    <h3 className="font-bold text-sm truncate w-full text-foreground px-2">{name}</h3>
                                    <p className="text-[10px] text-muted-foreground font-medium bg-secondary/50 px-2 py-0.5 rounded-full inline-block">
                                        {requests.length} طلبات
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            )}

            {/* Request Details Modal */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setSelectedRequest(null)
                                setIsNotifyMode(false)
                            }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">تفاصيل طلب التوفير</h2>
                                <button onClick={() => {
                                    setSelectedRequest(null)
                                    setIsNotifyMode(false)
                                }} className="p-2 hover:bg-white/5 rounded-full">
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

                                <div className="pt-4 flex flex-col gap-3">
                                    {isNotifyMode ? (
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="font-bold text-sm flex items-center gap-2">
                                                <Bell className="w-4 h-4 text-primary" />
                                                إرسال إشعار توفر المنتج
                                            </h4>
                                            <Textarea
                                                placeholder="اكتب رسالة للعميل (مثلاً: المنتج الذي طلبته توفر الآن!)"
                                                className="bg-black/20 border-white/10 text-right min-h-[80px]"
                                                value={notifyMessage}
                                                onChange={(e) => setNotifyMessage(e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <Popover open={openProductSelect} onOpenChange={setOpenProductSelect}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={openProductSelect}
                                                            className="flex-1 justify-between bg-black/20 border-white/10 text-right h-10 text-xs text-muted-foreground hover:bg-black/30 hover:text-white"
                                                        >
                                                            {notifyLink
                                                                ? (products.find(p => `/customer?product=${p.id}` === notifyLink)?.name || notifyLink)
                                                                : "اختر منتج لربطه..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0 bg-[#1a1f2e] border-white/10">
                                                        <div className="p-2 border-b border-white/10">
                                                            <Input
                                                                placeholder="بحث عن منتج..."
                                                                value={productSearch}
                                                                onChange={(e) => setProductSearch(e.target.value)}
                                                                className="h-8 bg-black/20 border-white/10 text-right text-xs"
                                                            />
                                                        </div>
                                                        <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                                                            {products
                                                                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                                                .map((product) => (
                                                                    <div
                                                                        key={product.id}
                                                                        className={cn(
                                                                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-white/10 hover:text-white cursor-pointer transition-colors",
                                                                            notifyLink === `/customer?product=${product.id}` && "bg-primary/20 text-primary"
                                                                        )}
                                                                        onClick={() => {
                                                                            setNotifyLink(`/customer?product=${product.id}`)
                                                                            setOpenProductSelect(false)
                                                                            // Optional: auto-fill message if empty
                                                                            if (!notifyMessage) {
                                                                                setNotifyMessage(`مرحباً ${selectedRequest?.customerName || 'عزيزي العميل'}، المنتج "${product.name}" الذي طلبته أصبح متوفراً الآن!`)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                notifyLink === `/customer?product=${product.id}` ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <div className="w-6 h-6 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                                                                                <div
                                                                                    className="w-full h-full bg-cover bg-center"
                                                                                    style={{ backgroundImage: `url(${product.images?.[0] || ""})` }}
                                                                                />
                                                                            </div>
                                                                            <span className="truncate">{product.name}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                                                                <div className="p-4 text-center text-xs text-muted-foreground">
                                                                    لا توجد نتائج
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            {/* Hidden Input to store link if needed manually or just display it */}
                                            {/* We can keep manual input as fallback or read-only debug */}
                                            <Input
                                                placeholder="رابط المنتج (أو اختر من القائمة)"
                                                className="bg-black/20 border-white/10 text-right h-10 text-xs hidden" // Hidden for now as user wants selection
                                                value={notifyLink}
                                                onChange={(e) => setNotifyLink(e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleNotify}
                                                    className="flex-1 bg-primary text-primary-foreground h-10 rounded-xl gap-2"
                                                >
                                                    <Send className="w-4 h-4" />
                                                    إرسال
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setIsNotifyMode(false)}
                                                    className="h-10 rounded-xl text-slate-400"
                                                >
                                                    إلغاء
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
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

                                            {/* Notify Button - Only if customerId exists */}
                                            {selectedRequest.customerId && selectedRequest.customerId !== "guest" && (
                                                <Button
                                                    variant="glass"
                                                    className="bg-primary/20 text-primary hover:bg-primary/30 rounded-xl h-12 w-12 px-0 flex items-center justify-center transition-colors"
                                                    onClick={() => {
                                                        setNotifyMessage(`مرحباً ${selectedRequest.customerName}، يسعدنا إخبارك بأن المنتج الذي طلبته قد توفر! 🥳`)
                                                        setIsNotifyMode(true)
                                                    }}
                                                    title="إشعار العميل"
                                                >
                                                    <Bell className="w-5 h-5" />
                                                </Button>
                                            )}

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
