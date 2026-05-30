"use client"

import { useState } from "react"
import { Drawer } from "vaul"
import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus, FileText, Send, X, User, Phone, ShoppingBag } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart, removeFromCart, createOrder, updateCartQuantity, currentUser, storeSettings } = useStore()
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")

    const total = cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0)

    const handleCreateOrder = (isDraft: boolean) => {
        // Validation if required
        if (storeSettings.requireCustomerInfoOnCheckout) {
            const hasName = customerName.trim().length > 0 || !!currentUser?.name
            const hasPhone = customerPhone.trim().length > 0 || !!currentUser?.phone

            if (!hasName || !hasPhone) {
                toast.error("يرجى إدخال الاسم ورقم الجوال لإكمال الطلب")
                return
            }
        }

        createOrder(isDraft, { name: customerName, phone: customerPhone })
        onClose()
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={onClose}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96%] outline-none z-50 flex flex-col">
                    <div className="bg-white dark:bg-[#121b22] text-slate-900 dark:text-white rounded-t-[32px] p-6 border-t border-slate-200 dark:border-white/10 flex-1 overflow-y-auto no-scrollbar shadow-2xl transition-colors duration-300">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 dark:bg-white/10 mb-8" />

                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">سلة التسوق</h2>
                            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-4">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-slate-200/50 dark:border-white/5">
                                    <ShoppingBag className="w-10 h-10 opacity-30 text-primary" />
                                </div>
                                <p className="font-bold text-sm">السلة فارغة حالياً</p>
                                <p className="text-xs opacity-75 mt-1">تصفح المنتجات وأضف ما تحتاجه للطلب</p>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-48 animate-in fade-in slide-in-from-bottom-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="glass-card p-4 flex gap-4 items-center border border-slate-200 dark:border-white/5 shadow-sm rounded-2xl hover:border-primary/20 transition-all">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden flex-shrink-0 relative">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-black/10">
                                                    <ShoppingBag className="w-6 h-6 opacity-60" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-right">
                                            <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{item.name}</h3>
                                            <p className="text-primary font-black text-sm mt-1">
                                                {item.selectedPrice} ر.س <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">/ {item.selectedUnit}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/40 rounded-full p-1 border border-slate-200/80 dark:border-white/5">
                                                <button
                                                    onClick={() => updateCartQuantity(item.id, item.selectedUnit, -1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/5 text-slate-400 dark:text-slate-350 transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-4 text-center font-bold text-sm text-slate-800 dark:text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateCartQuantity(item.id, item.selectedUnit, 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/5 text-primary transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id, item.selectedUnit)}
                                                className="p-2 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                                                title="حذف من السلة"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-[#121b22] border-t border-slate-200 dark:border-white/10 pb-10 space-y-4 shadow-2xl transition-colors duration-300">
                            {/* Customer Info Inputs (Only if guest or wants to specify) */}
                            <div className="grid grid-cols-2 gap-3 text-right">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 dark:text-slate-400 pr-1 flex items-center gap-1 font-bold">
                                        الاسم
                                        {storeSettings.requireCustomerInfoOnCheckout && <span className="text-red-500 font-extrabold">*</span>}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder={currentUser?.name || "اسم العميل"}
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="h-10 text-right pr-9 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-black/40 focus:ring-primary/50 rounded-xl text-xs font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 dark:text-slate-400 pr-1 flex items-center gap-1 font-bold">
                                        جوال
                                        {storeSettings.requireCustomerInfoOnCheckout && <span className="text-red-500 font-extrabold">*</span>}
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="رقم الجوال"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            className="h-10 text-right pr-9 bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-black/40 focus:ring-primary/50 rounded-xl text-xs font-bold"
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-right border-t border-slate-100 dark:border-white/5 pt-4">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">الإجمالي التقديري</span>
                                <span className="text-2xl font-black text-primary dark:text-white">{total.toFixed(2)} ر.س</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-14 rounded-2xl gap-2 font-bold bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white border-slate-200 dark:border-white/5 transition-all shadow-sm"
                                    onClick={() => handleCreateOrder(true)}
                                >
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <span>حفظ كمسودة</span>
                                </Button>
                                <Button
                                    className="h-14 rounded-2xl gap-2 bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all font-bold"
                                    onClick={() => handleCreateOrder(false)}
                                >
                                    <Send className="w-5 h-5" />
                                    <span>إرسال الطلب</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
