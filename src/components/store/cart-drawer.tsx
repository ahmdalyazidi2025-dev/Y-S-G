"use client"

import { useState } from "react"
import { Drawer } from "vaul"
import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus, FileText, Send, X, User, Phone, ChevronDown } from "lucide-react"
import { toast } from "sonner"

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart, removeFromCart, createOrder, updateCartQuantity, currentUser, storeSettings, categories, coupons } = useStore()
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: string } | null>(null)
    const [couponError, setCouponError] = useState("")
    const [view, setView] = useState<'cart' | 'checkout'>('cart') // 'cart' or 'checkout'

    // Reset view when closed
    if (!isOpen && view !== 'cart') {
        setTimeout(() => setView('cart'), 300)
    }

    const rawTotal = cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0)

    // Calculate Discount
    let discountAmount = 0
    if (appliedCoupon) {
        if (appliedCoupon.type === 'percentage') {
            discountAmount = (rawTotal * appliedCoupon.discount) / 100
        }
    }

    const total = rawTotal - discountAmount

    const navToCheckout = () => {
        // Implement coupon validation logic
        if (!couponCode) return
        const coupon = coupons.find(c => c.code === couponCode.toUpperCase() && c.active)

        if (!coupon) {
            setCouponError("الكوبون غير صحيح")
            setAppliedCoupon(null)
            return;
        }

        // Check Expiry
        if (coupon.expiryDate) {
            const now = new Date()
            const expiry = coupon.expiryDate instanceof Date
                ? coupon.expiryDate
                : (coupon.expiryDate as { toDate: () => Date }).toDate()
            if (expiry < now) {
                setCouponError("الكوبون منتهي الصلاحية")
                setAppliedCoupon(null)
                return
            }
        }

        // Check Usage Limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            setCouponError("تم استنفاذ مرات استخدام الكوبون")
            setAppliedCoupon(null)
            return
        }

        // Check Minimum Order
        if (coupon.minOrderValue && rawTotal < coupon.minOrderValue) {
            setCouponError(`الحد الأدنى للطلب هو ${coupon.minOrderValue} ر.س`)
            setAppliedCoupon(null)
            return
        }

        // Check Category Restriction
        if (coupon.categoryId) {
            const category = categories.find(c => c.id === coupon.categoryId)
            if (category) {
                const hasCategoryItem = cart.some(item => item.category === category.nameAr)
                if (!hasCategoryItem) {
                    setCouponError(`هذا الكوبون خاص بقسم ${category.nameAr} فقط`)
                    setAppliedCoupon(null)
                    return
                }
            }
        }

        setAppliedCoupon({ code: coupon.code, discount: coupon.discount, type: coupon.type })
        setCouponError("")
        toast.success(`تم تطبيق خصم ${coupon.discount}% بنجاح`)
    }

    const removeCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode("")
        setCouponError("")
    }

    const handleCreateOrder = (isDraft: boolean) => {
        // Validation if required
        if (storeSettings.requireCustomerInfoOnCheckout && !isDraft) {
            const hasName = customerName.trim().length > 0 || !!currentUser?.name
            const hasPhone = customerPhone.trim().length > 0 || !!currentUser?.phone || (currentUser?.role === 'customer' && false) // simple check

            if (!hasName || !hasPhone) {
                toast.error("يرجى إدخال الاسم ورقم الجوال لإكمال الطلب")
                return
            }
        }

        createOrder(isDraft, { name: customerName, phone: customerPhone })
        onClose()
        setCustomerName("")
        setCustomerPhone("")
        setView('cart')

        // Helpful toast for Drafts
        if (isDraft) {
            toast.success("تم حفظ المسودة في قائمة الفواتير", {
                description: "يمكنك العودة لها لاحقاً لإكمال الطلب",
                duration: 4000
            })
        }
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={onClose}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96%] outline-none z-50 flex flex-col">
                    <div className="bg-[#1c2a36] rounded-t-[32px] p-6 border-t border-white/10 flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />

                        {/* HEADER */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white">
                                {view === 'cart' ? 'سلة التسوق' : 'إتمام الطلب'}
                            </h2>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* CONTENT: CART VIEW */}
                        {view === 'cart' && (
                            <>
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <Trash2 className="w-10 h-10 opacity-20" />
                                        </div>
                                        <p>السلة فارغة حالياً</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 mb-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        {cart.map((item) => (
                                            <div key={item.id} className="glass-card p-4 flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex-shrink-0">
                                                    {/* Image placeholder */}
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">
                                                        {item.name.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white">{item.name}</h3>
                                                    <p className="text-primary font-bold text-sm">
                                                        {item.selectedPrice} ر.س <span className="text-[10px] text-slate-500 font-normal">/ {item.selectedUnit}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-3 bg-black/20 rounded-full p-1 border border-white/5">
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.selectedUnit, -1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.selectedUnit, 1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-primary"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id, item.selectedUnit)}
                                                        className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* CONTENT: CHECKOUT VIEW */}
                        {view === 'checkout' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                {/* Order Summary Mini */}
                                <div className="glass-card p-4 bg-white/5 flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">عدد المنتجات</span>
                                    <span className="text-white font-bold">{cart.reduce((a, b) => a + b.quantity, 0)} منتج</span>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-bold pr-1 flex items-center gap-1">
                                            الاسم
                                            {storeSettings.requireCustomerInfoOnCheckout && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                                            <Input
                                                placeholder={currentUser?.name || "اسم العميل"}
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="h-14 text-right pr-10 pl-4 bg-black/20 border-white/5 text-white placeholder:text-slate-500/70 focus:border-primary/50 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-bold pr-1 flex items-center gap-1">
                                            جوال
                                            {storeSettings.requireCustomerInfoOnCheckout && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                                            <Input
                                                placeholder="رقم الجوال"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                className="h-14 text-right pr-10 pl-4 bg-black/20 border-white/5 text-white placeholder:text-slate-500/70 focus:border-primary/50 text-sm"
                                                inputMode="numeric"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Coupon */}
                                {storeSettings.enableCoupons !== false && (
                                    <div className="space-y-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                                        <label className="text-xs text-slate-400 font-bold">كود الخصم (الكوبون)</label>
                                        <div className="flex gap-2 relative">
                                            <Input
                                                placeholder="أدخل الكود هنا"
                                                value={couponCode}
                                                onChange={(e) => {
                                                    setCouponCode(e.target.value.toUpperCase())
                                                    setCouponError("")
                                                }}
                                                disabled={!!appliedCoupon}
                                                className={`h-10 text-right pr-4 bg-black/20 text-sm font-mono tracking-wider ${couponError ? "border-red-500/50" : "border-white/5"}`}
                                            />
                                            {appliedCoupon ? (
                                                <button onClick={removeCoupon} className="absolute left-2 top-1/2 -translate-y-1/2 text-red-400 hover:bg-red-400/10 p-1 rounded-full">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
                                                    onClick={navToCheckout}
                                                >
                                                    تطبيق
                                                </Button>
                                            )}
                                        </div>
                                        {couponError && <p className="text-[10px] text-red-500 font-bold">{couponError}</p>}
                                        {appliedCoupon && (
                                            <div className="flex justify-between items-center text-xs text-green-400 font-bold px-1">
                                                <span>قسيمة {appliedCoupon.code}</span>
                                                <span>-{discountAmount.toFixed(2)} ر.س</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}
                    {cart.length > 0 && (
                        <div className="w-full p-6 bg-[#1c2a36] border-t border-white/10 pb-10 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50">
                            {/* Totals */}
                            <div className="space-y-1">
                                {view === 'checkout' && (
                                    <div className="flex justify-between items-center text-sm text-slate-400">
                                        <span>المجموع الفرعي</span>
                                        <span>{rawTotal.toFixed(2)} ر.س</span>
                                    </div>
                                )}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-green-400 font-bold">
                                        <span>الخصم</span>
                                        <span>-{discountAmount.toFixed(2)} ر.س</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                                    <span className="text-white font-bold">الإجمالي النهائي</span>
                                    <span className="text-3xl font-black text-primary">{total.toFixed(2)} <span className="text-sm font-medium text-slate-500">ر.س</span></span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                {view === 'cart' ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="h-14 rounded-2xl gap-2 hover:bg-white/5 text-slate-400 border-white/10"
                                            onClick={onClose}
                                        >
                                            <span>متابعة التسوق</span>
                                            <ChevronDown className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            className="h-14 rounded-2xl gap-2 bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                                            onClick={() => setView('checkout')}
                                        >
                                            <span>متابعة الشراء</span>
                                            <Send className="w-5 h-5 rotate-180" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="glass"
                                            className="h-14 rounded-2xl gap-2"
                                            onClick={() => handleCreateOrder(true)}
                                        >
                                            <FileText className="w-5 h-5" />
                                            <span>حفظ كمسودة</span>
                                        </Button>
                                        <Button
                                            className="h-14 rounded-2xl gap-2 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                            onClick={() => handleCreateOrder(false)}
                                        >
                                            <Send className="w-5 h-5" />
                                            <span>تأكيد الطلب</span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
