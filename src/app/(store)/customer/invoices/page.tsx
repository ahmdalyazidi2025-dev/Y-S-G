"use client"

import { useStore, Order } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Clock, Truck, CheckCircle2, XCircle, FileText, X, Plus, Printer, FileDown, Eye, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef, useCallback, ChangeEvent } from "react"
import { cn } from "@/lib/utils"
import { Drawer } from "vaul"
import { OrderStatusProgress } from "@/components/shared/order-status-progress"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { ReceiptInvoice, InvoicePaper } from "@/components/shared/receipt-invoice"
import { generateOrderPDF } from "@/lib/pdf-utils"

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: React.ElementType }> = {
    pending: { label: "مسودة (غير مرسل)", color: "text-orange-400", bg: "bg-orange-400/10", icon: Clock },
    processing: { label: "جاري العمل", color: "text-blue-400", bg: "bg-blue-400/10", icon: Package },
    shipped: { label: "تم الشحن", color: "text-purple-400", bg: "bg-purple-400/10", icon: Truck },
    delivered: { label: "تم التسليم", color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
    canceled: { label: "ملغاة", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
    accepted: { label: "تم القبول", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
    deleted: { label: "المحذوفات", color: "text-slate-400", bg: "bg-slate-400/10", icon: XCircle },
}

export default function InvoicesPage() {
    const { orders, restoreDraftToCart, addToCart, loadMoreOrders, hasMoreOrders, searchCustomerOrders, currentUser, storeSettings } = useStore()
    const [filter, setFilter] = useState<string>("all")
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Order[] | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const observerTarget = useRef<HTMLDivElement>(null)

    // Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 0 && currentUser) {
                setIsSearching(true)
                try {
                    const results = await searchCustomerOrders(currentUser.id, searchQuery)
                    setSearchResults(results)
                } catch (e) {
                    console.error(e)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults(null)
            }
        }, 600)
        return () => clearTimeout(timer)
    }, [searchQuery, searchCustomerOrders, currentUser])

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMoreOrders) return
        setLoadingMore(true)
        await loadMoreOrders()
        setLoadingMore(false)
    }, [loadingMore, hasMoreOrders, loadMoreOrders])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreOrders && !loadingMore) {
                    handleLoadMore()
                }
            },
            { threshold: 0.1 }
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => observer.disconnect()
    }, [handleLoadMore, hasMoreOrders, loadingMore])

    // ... existing ...

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    const handleDownloadPDF = async (order: Order) => {
        hapticFeedback('light')
        const success = await generateOrderPDF('premium-invoice-target', order.id)
        if (success) toast.success("تم تجهيز وتحميل الفاتورة")
        else toast.error("فشل في تجهيز الفاتورة")
    }

    const handleReorder = (order: Order) => {
        order.items.forEach(item => {
            addToCart({
                ...item,
                // Ensure legacy items map correctly
                categoryId: (item as any).categoryId || "general"
            } as any)
        })
        toast.success("تم إضافة المنتجات للسلة", {
            action: {
                label: "الذهاب للسلة",
                onClick: () => document.getElementById("cart-trigger")?.click() // Hacky but works if trigger has ID, or we assume user opens cart manually. Better: just toast.
            }
        })
        hapticFeedback('medium')
        setSelectedOrder(null)
    }

    const baseOrders = searchResults || orders || []
    const filteredOrders = baseOrders.filter(o => {
        if (!o) return false
        return filter === "all" ? o.status !== "deleted" : o.status === filter
    })

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/customer">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                        <ArrowRight className="w-5 h-5 text-foreground rotate-180 rtl:rotate-0 transform" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">سجل الطلبات</h1>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs"
                    onClick={() => {
                        window.location.search = "?request_invoice=true"
                    }}
                >
                    <Plus className="w-4 h-4" />
                    رفع فاتورة
                </Button>
            </div>

            {/* NEW: Search Bar for Scalability */}
            <div className="relative px-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                    placeholder="ابحث برقم الطلب (مثلاً: 1234)..."
                    className="bg-secondary/50 border-white/5 pr-10 text-right h-12 rounded-2xl text-sm"
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                {["all", "pending", "processing", "shipped", "delivered", "canceled", "accepted", "deleted"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                            filter === s
                                ? "bg-primary text-primary-foreground shadow-[0_0_15px_-3px_hsl(var(--primary)/0.4)] border-primary"
                                : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80 hover:text-foreground"
                        )
                        }
                    >
                        {s === "all" ? "الكل" : STATUS_MAP[s as keyof typeof STATUS_MAP].label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {isSearching ? (
                    <div className="py-20 text-center text-slate-500">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p>جاري البحث عن الطلب...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-20 text-center text-slate-500">
                        <p className="mb-4">لا توجد طلبات في هذا القسم</p>
                        {hasMoreOrders && (
                            <div ref={observerTarget} className="py-4 w-full flex flex-col items-center gap-2">
                                {loadingMore ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                        </div>
                                        <p className="text-xs text-slate-500">جاري البحث في الطلبات الأقدم...</p>
                                    </>
                                ) : (
                                    <div className="h-4" />
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {filteredOrders.map((order) => {
                            const status = STATUS_MAP[order.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending
                            return (
                                <div
                                    key={order.id}
                                    onClick={() => { setSelectedOrder(order); hapticFeedback('light') }}
                                    className="glass-card p-5 space-y-4 relative overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer border-gradient"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">رقم الطلب</p>
                                            <p className="font-black text-foreground flex items-center gap-2 text-lg">
                                                <FileText className="w-4 h-4 text-primary" />
                                                #{order.id}
                                            </p>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold", status.bg, status.color)}>
                                            <status.icon className="w-3 h-3" />
                                            {status.label}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-y border-border/50">
                                        <div className="flex -space-x-2 rtl:space-x-reverse">
                                            {order.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-[10px] overflow-hidden relative shadow-sm">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : item.name.charAt(0)}
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#1c2a36] flex items-center justify-center text-[10px] text-slate-400">
                                                    +{order.items.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground font-bold mb-0.5">التاريخ</p>
                                            <p className="text-xs font-bold text-foreground">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xl font-black text-foreground">
                                            {order.total.toFixed(2)} <span className="text-xs font-bold text-muted-foreground">ر.س</span>
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); hapticFeedback('light') }}
                                            className="text-primary hover:text-primary hover:bg-primary/10 text-xs font-black"
                                        >
                                            فتح الفاتورة
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}

                        {hasMoreOrders && (
                            <div ref={observerTarget} className="py-8 w-full flex justify-center">
                                {loadingMore ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                    </div>
                                ) : (
                                    <div className="h-4" />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Details Drawer */}
            <Drawer.Root open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96%] outline-none z-[101] flex flex-col">
                        <div className="bg-slate-100 rounded-t-[32px] p-2 sm:p-6 border-t border-slate-200 flex-1 overflow-y-auto overflow-x-hidden" dir="rtl">
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mb-6" />

                            {selectedOrder && (
                                <div className="space-y-4 max-w-[800px] mx-auto pb-8">
                                    {/* Action Header pinned nicely at top */}
                                    <div className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200">
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                onClick={() => window.print()}
                                                className="bg-black text-white hover:bg-slate-800 font-bold h-10 px-4 rounded-xl flex-1 sm:flex-none"
                                                size="sm"
                                            >
                                                <Printer className="w-4 h-4 ml-1.5" />
                                                <span>طباعة الفاتورة</span>
                                            </Button>
                                            <Button
                                                onClick={() => generateOrderPDF("receipt-invoice-target", selectedOrder.id)}
                                                variant="outline"
                                                className="border-slate-300 hover:bg-slate-50 text-slate-700 font-bold h-10 px-4 rounded-xl flex-1 sm:flex-none"
                                                size="sm"
                                            >
                                                <FileDown className="w-4 h-4 ml-1.5" />
                                                <span>تحميل <span className="hidden sm:inline">PDF</span></span>
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-sm sm:text-base font-black text-slate-800 hidden sm:block">خيارات الفاتورة</h2>
                                            <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* The Authentic Invoice Paper Container */}
                                    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                                        {/* Corner cutouts effect */}
                                        <div className="absolute -left-2 top-10 w-4 h-4 rounded-full bg-slate-100 shadow-inner z-10 hidden sm:block" />
                                        <div className="absolute -right-2 top-10 w-4 h-4 rounded-full bg-slate-100 shadow-inner z-10 hidden sm:block" />
                                        <div className="border-b-2 border-dashed border-slate-200 w-full absolute top-[48px] left-0 z-0 hidden sm:block" />
                                        
                                        {/* The Invoice Content itself */}
                                        <div className="relative z-1 p-2 sm:p-4">
                                            <InvoicePaper 
                                                id="drawer-invoice-paper" 
                                                order={selectedOrder} 
                                                subtotal={selectedOrder.total / 1.15} 
                                                tax={selectedOrder.total - (selectedOrder.total / 1.15)} 
                                                storeSettings={storeSettings} 
                                            />
                                        </div>
                                    </div>

                                    {/* Tracking & Extra Actions underneath the receipt */}
                                    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                                        <div className="space-y-4">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-center">تتبع حالة الطلب والتحديثات</p>
                                            <OrderStatusProgress status={selectedOrder.status} />
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                                            {selectedOrder.status === "pending" && (
                                                <Button
                                                    className="w-full h-12 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 font-black shadow-sm"
                                                    onClick={() => {
                                                        restoreDraftToCart(selectedOrder.id)
                                                        setSelectedOrder(null)
                                                        toast.success("تم استرجاع المسودة للسلة للتعديل")
                                                    }}
                                                >
                                                    <Plus className="w-5 h-5 ml-2" />
                                                    استكمال الطلب (تعديل المسودة)
                                                </Button>
                                            )}
                                            {selectedOrder.status !== "pending" && (
                                                <Button
                                                    className="w-full h-12 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-black shadow-sm"
                                                    onClick={() => handleReorder(selectedOrder)}
                                                >
                                                    <Plus className="w-5 h-5 ml-2" />
                                                    إعادة طلب الأغراض الموجودة في الفاتورة
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {selectedOrder && (
                <ReceiptInvoice
                    order={selectedOrder}
                    id="receipt-invoice-target"
                    isPreview={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </div >
    )
}
