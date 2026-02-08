"use client"

import { useStore, Order } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Clock, Truck, CheckCircle2, XCircle, FileText, X, Plus, Printer, FileDown, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Drawer } from "vaul"
import { OrderStatusProgress } from "@/components/shared/order-status-progress"
import { InvoiceTemplate } from "@/components/shared/invoice-template"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { PremiumInvoice } from "@/components/shared/premium-invoice"
import { generateOrderPDF } from "@/lib/pdf-utils"

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: React.ElementType }> = {
    pending: { label: "مسودة (غير مرسل)", color: "text-orange-400", bg: "bg-orange-400/10", icon: Clock },
    processing: { label: "جاري العمل", color: "text-blue-400", bg: "bg-blue-400/10", icon: Package },
    shipped: { label: "تم الشحن", color: "text-purple-400", bg: "bg-purple-400/10", icon: Truck },
    delivered: { label: "تم التسليم", color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle2 },
    canceled: { label: "ملغاة", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
    accepted: { label: "تم القبول", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
    rejected: { label: "مرفوض", color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
}

export default function InvoicesPage() {
    const { orders, restoreDraftToCart, addToCart } = useStore()
    const [filter, setFilter] = useState<string>("all")
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

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

    const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter)

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/customer">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">سجل الطلبات</h1>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                {["all", "pending", "processing", "shipped", "delivered", "canceled", "accepted", "rejected"].map((s) => (
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
                {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center text-slate-500">
                        <p>لا توجد طلبات في هذا القسم</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const status = STATUS_MAP[order.status as keyof typeof STATUS_MAP]
                        return (
                            <div key={order.id} className="glass-card p-5 space-y-4 relative overflow-hidden group active:scale-[0.98] transition-transform cursor-pointer border-gradient">
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
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 text-xs font-black">
                                        فتح الفاتورة
                                    </Button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Order Details Drawer */}
            <Drawer.Root open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96%] outline-none z-50 flex flex-col">
                        <div className="bg-[#1c2a36] rounded-t-[32px] p-6 border-t border-white/10 flex-1 overflow-y-auto">
                            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />

                            {selectedOrder && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">تفاصيل الفاتورة</h2>
                                            <p className="text-slate-400 text-sm">رقم الطلب: #{selectedOrder.id}</p>
                                        </div>
                                        <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/5 rounded-full text-slate-400">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Detailed Status Stepper */}
                                    <div className="space-y-4">
                                        <div className="glass-card p-4 bg-white/5 border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">تتبع حالة الطلب</p>
                                            <OrderStatusProgress status={selectedOrder.status} />
                                        </div>

                                        {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                                            <div className="glass-card p-4 bg-white/5 border-white/5 space-y-3">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">تاريخ التحديثات</p>
                                                <div className="space-y-3">
                                                    {selectedOrder.statusHistory.map((h, i: number) => (
                                                        <div key={i} className="flex items-center justify-between text-[11px]">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                <span className="text-white font-medium">
                                                                    {STATUS_MAP[h.status as keyof typeof STATUS_MAP]?.label || h.status}
                                                                </span>
                                                            </div>
                                                            <span className="text-slate-500">
                                                                {new Date(h.timestamp).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-sm font-bold text-slate-300 px-1">المنتجات المختارة</p>
                                        <div className="space-y-3">
                                            {selectedOrder.items.map((item, idx: number) => (
                                                <div key={idx} className="glass-card p-4 flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center text-xs overflow-hidden relative">
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
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm text-white">{item.name}</p>
                                                        <p className="text-[10px] text-slate-500">{item.quantity} {item.selectedUnit} × {item.selectedPrice} ر.س</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-primary">{(item.quantity * item.selectedPrice).toFixed(2)}</p>
                                                        <p className="text-[10px] text-slate-500">ر.س</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-slate-400">الإجمالي النهائي</span>
                                            <span className="text-2xl font-bold text-primary">{selectedOrder.total.toFixed(2)} ر.س</span>
                                        </div>
                                        {selectedOrder.status === "pending" && (
                                            <Button
                                                className="w-full h-14 rounded-2xl bg-orange-500/10 text-orange-400 gap-2 shadow-lg shadow-orange-500/5 border border-orange-500/20"
                                                onClick={() => {
                                                    restoreDraftToCart(selectedOrder.id)
                                                    setSelectedOrder(null)
                                                    toast.success("تم استرجاع المسودة للسلة للتعديل")
                                                }}
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span>استكمال الطلب (تعديل المسودة)</span>
                                            </Button>
                                        )}
                                        {selectedOrder.status !== "pending" && (
                                            <Button
                                                className="w-full h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 gap-2 shadow-lg shadow-emerald-500/5 border border-emerald-500/20"
                                                onClick={() => handleReorder(selectedOrder)}
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span>إعادة طلب نفس المنتجات</span>
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                className="h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors gap-2"
                                                onClick={() => setIsPreviewOpen(true)}
                                            >
                                                <Eye className="w-5 h-5" />
                                                <span>معاينة الفاتورة</span>
                                            </Button>
                                            <Button
                                                className="h-14 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors gap-2"
                                                onClick={() => window.print()}
                                            >
                                                <Printer className="w-5 h-5" />
                                                <span>طباعة</span>
                                            </Button>
                                            <Button
                                                className="h-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 gap-2"
                                                onClick={() => handleDownloadPDF(selectedOrder)}
                                            >
                                                <FileDown className="w-5 h-5" />
                                                <span>تحميل PDF</span>
                                            </Button>
                                            <Button className="h-14 rounded-2xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors col-span-2" onClick={() => setSelectedOrder(null)}>
                                                إغلاق
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {selectedOrder && <InvoiceTemplate order={selectedOrder} />}
            {selectedOrder && (
                <PremiumInvoice
                    order={selectedOrder}
                    id="premium-invoice-target"
                    isPreview={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </div >
    )
}
