"use client"

import { useState } from "react"
import { Drawer } from "vaul"
import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus, FileText, Send, X, User, Phone, ChevronDown } from "lucide-react"
import { toast } from "sonner"

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart, removeFromCart, createOrder, updateCartQuantity, currentUser, storeSettings, categories, coupons, applyCoupon } = useStore()
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

    const navToCheckout = async () => {
        // Implement coupon validation logic
        if (!couponCode) return

        const coupon = await applyCoupon(couponCode.toUpperCase(), rawTotal, currentUser)

        if (!coupon) {
            setCouponError("الكوبون غير صحيح أو غير مستوفٍ للشروط")
            setAppliedCoupon(null)
            return;
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
            // Check if user is guest or missing info
            const isGuest = !currentUser || currentUser?.role === 'guest' || currentUser?.name === 'زائر' || !currentUser?.phone
            const hasManualInput = customerName.trim().length > 0 && customerPhone.trim().length > 0

            if (isGuest && !hasManualInput) {
                toast.error("الرجاء إكمال بياناتك (الاسم ورقم الهاتف) لإتمام الطلب")
                setView('checkout') // Switch to Checkout View which has the form
                return
            }
        }

        createOrder(currentUser, cart, isDraft, { name: customerName, phone: customerPhone })
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
                            <h2 className="text-2xl font-bold text-foreground">
                                سلة المشتريات
                            </h2>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-background/5 dark:hover:bg-white/5">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </Button>
                        </div>

                        {/* CONTENT: CART VIEW */}
                        {view === 'cart' && (
                            <>
                                {cart.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <Trash2 className="w-10 h-10 text-muted-foreground/20" />
                                        </div>
                                        <p>السلة فارغة حالياً</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 mb-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        {cart.map((item) => (
                                            <div key={item.id} className="glass-card p-4 flex gap-4 items-center">
                                                <div className="w-16 h-16 bg-muted rounded-xl border border-border overflow-hidden flex-shrink-0 relative">
                                                    {(item.image || (item.images && item.images.length > 0)) ? (
                                                        <img
                                                            src={item.image || item.images![0]}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-bold bg-white/5">
                                                            {item.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-foreground break-words">{item.name}</h3>
                                                    <p className="text-primary font-bold text-sm">
                                                        {item.selectedPrice} ر.س <span className="text-[10px] text-muted-foreground font-normal">/ {item.selectedUnit}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-3 bg-muted/50 rounded-full p-1 border border-border">
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.selectedUnit, -1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background text-foreground"
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-4 text-center font-bold text-sm text-foreground">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateCartQuantity(item.id, item.selectedUnit, 1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background text-primary"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id, item.selectedUnit)}
                                                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-400/10 rounded-full transition-colors"
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
                                <div className="glass-card p-4 bg-card/50 flex justify-between items-center">
                                    <span className="text-muted-foreground text-sm">عدد المنتجات</span>
                                    <span className="text-foreground font-bold">{cart.reduce((a, b) => a + b.quantity, 0)} منتج</span>
                                </div>

                                {/* Inputs - Only show if required by settings OR we need them */}
                                {storeSettings.requireCustomerInfoOnCheckout && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs text-muted-foreground font-bold pr-1 flex items-center gap-1">
                                                البيانات الشخصية
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                                                <Input
                                                    placeholder="الاسم"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    className="h-14 text-right pr-10 pl-4 bg-black/20 border-white/5 text-white placeholder:text-slate-500/70 focus:border-primary/50 text-sm font-bold"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10 pointer-events-none" />
                                                <Input
                                                    placeholder="رقم الهاتف الشخصي"
                                                    value={customerPhone}
                                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                                    className="h-14 text-right pr-10 pl-4 bg-black/20 border-white/5 text-white placeholder:text-slate-500/70 focus:border-primary/50 text-sm font-bold"
                                                    inputMode="numeric"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Coupon */}
                                {storeSettings.enableCoupons === true && (
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
                            {/* Totals */}
                            <div className="space-y-3">
                                {/* 1. Subtotal - Always Show */}
                                <div className="flex justify-between items-center text-base text-slate-300 font-medium">
                                    <span>إجمالي المنتجات</span>
                                    <span className="font-bold text-white tracking-wide">{rawTotal.toFixed(2)} ر.س</span>
                                </div>

                                {/* 2. Discount - Show if applied */}
                                {discountAmount > 0 && (
                                    <>
                                        <div className="flex justify-between items-center text-base text-emerald-400 font-bold">
                                            <span>الخصم ({appliedCoupon?.code})</span>
                                            <span className="tracking-wide">-{discountAmount.toFixed(2)} ر.س</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-slate-400 pb-2 border-b border-white/5">
                                            <span>الإجمالي بعد الخصم</span>
                                            <span className="font-bold text-slate-200">{((rawTotal - discountAmount)).toFixed(2)} ر.س</span>
                                        </div>
                                    </>
                                )}

                                {/* 3. Tax - Always Show */}
                                <div className="flex justify-between items-center text-base text-amber-400/90 font-medium">
                                    <span>ضريبة القيمة المضافة (15%)</span>
                                    <span className="font-bold tracking-wide">{((rawTotal - discountAmount) * 0.15).toFixed(2)} ر.س</span>
                                </div>

                                {/* 4. Grand Total */}
                                <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-2 bg-white/5 -mx-6 px-6 py-4">
                                    <span className="text-white text-lg font-bold">الإجمالي النهائي</span>
                                    <span className="text-4xl font-black text-primary drop-shadow-lg">
                                        {((rawTotal - discountAmount) * 1.15).toFixed(2)}
                                        <span className="text-lg font-bold text-slate-400 mr-2">ر.س</span>
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                {view === 'cart' ? (
                                    <>
                                        {/* Draft Button (Left) */}
                                        <Button
                                            variant="secondary"
                                            className="flex-1 h-14 rounded-2xl gap-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                                            onClick={() => handleCreateOrder(true)}
                                        >
                                            <FileText className="w-5 h-5" />
                                            <span>مسودة</span>
                                        </Button>

                                        {/* Submit Button (Right) */}
                                        <Button
                                            className="flex-[2] h-14 rounded-2xl gap-2 bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                                            onClick={() => setView('checkout')}
                                        >
                                            <span>رفع الطلب</span>
                                            <Send className="w-5 h-5 rtl:-scale-x-100" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {/* Back Button */}
                                        <Button
                                            variant="ghost"
                                            className="h-14 w-14 rounded-2xl border border-white/5 hover:bg-white/5 text-slate-400"
                                            onClick={() => setView('cart')}
                                        >
                                            <ChevronDown className="w-6 h-6 rotate-90" />
                                        </Button>

                                        {/* Confirm Button */}
                                        <Button
                                            className="flex-1 h-14 rounded-2xl gap-2 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                            onClick={() => handleCreateOrder(false)}
                                        >
                                            <Send className="w-5 h-5" />
                                            <span>تأكيد وإرسال</span>
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
