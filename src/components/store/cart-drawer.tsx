"use client"

import { useState } from "react"
import { Drawer } from "vaul"
import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus, FileText, Send, X, User, Phone } from "lucide-react"
import { toast } from "sonner"

export function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart, removeFromCart, createOrder, updateCartQuantity, currentUser, storeSettings } = useStore()
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")

    const total = cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0)

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
    }

    return (
        <Drawer.Root open={isOpen} onOpenChange={onClose}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96%] outline-none z-50 flex flex-col">
                    <div className="bg-[#1c2a36] rounded-t-[32px] p-6 border-t border-white/10 flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />

                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white">سلة التسوق</h2>
                            <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 className="w-10 h-10 opacity-20" />
                                </div>
                                <p>السلة فارغة حالياً</p>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-32">
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
                    </div>

                    {cart.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#1c2a36] border-t border-white/10 pb-10 space-y-4">

                            {/* Customer Info Inputs (Only if guest or wants to specify) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 pr-1 flex items-center gap-1">
                                        الاسم
                                        {storeSettings.requireCustomerInfoOnCheckout && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            placeholder={currentUser?.name || "اسم العميل"}
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="h-10 text-right pr-9 bg-black/20 border-white/5 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 pr-1 flex items-center gap-1">
                                        جوال
                                        {storeSettings.requireCustomerInfoOnCheckout && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            placeholder="رقم الجوال"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            className="h-10 text-right pr-9 bg-black/20 border-white/5 text-sm"
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">الإجمالي التقديري</span>
                                <span className="text-2xl font-bold text-white">{total.toFixed(2)} ر.س</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="glass"
                                    className="h-14 rounded-2xl gap-2"
                                    onClick={() => handleCreateOrder(true)}
                                >
                                    <FileText className="w-5 h-5" />
                                    <span>حفظ كمسودة</span>
                                </Button>
                                <Button
                                    className="h-14 rounded-2xl gap-2 bg-primary text-white shadow-lg shadow-primary/20"
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
