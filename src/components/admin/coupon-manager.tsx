"use client"

import React, { useState } from "react"
import { useStore } from "@/context/store-context"
import { Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Ticket, Sparkles, Copy, Calendar, Percent } from "lucide-react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { motion, AnimatePresence } from "framer-motion"

export function CouponManager() {
    const { coupons, addCoupon, deleteCoupon } = useStore()
    const [code, setCode] = useState("")
    const [discount, setDiscount] = useState("10")
    const [usageLimit, setUsageLimit] = useState("100")
    const [expiryDays, setExpiryDays] = useState("30")

    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let result = ""
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setCode("SALE" + result)
        hapticFeedback('success')
    }

    const handleAdd = () => {
        if (!code || !discount) return

        const discountValue = parseInt(discount)
        if (discountValue <= 0 || discountValue > 100) {
            toast.error("نسبة الخصم يجب أن تكون بين 1 و 100")
            return
        }

        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays))

        addCoupon({
            code: code.toUpperCase(),
            discount: discountValue,
            type: "percentage",
            usageLimit: parseInt(usageLimit) || 1000,
            active: true,
            // We pass standard Date objects, store-context handles Firestore conversion if needed or we might need Timestamp depending on impl.
            // In store-context we implemented addCoupon using {...coupon, createdAt: Timestamp.now()}.
            // We should ensure expiryDate is handled. The current store-context implementation didn't explicitly convert input dates to Timestamps in 'addCoupon' except 'createdAt'.
            // However, Firestore addDoc handles Date objects automatically by converting them to Timestamps.
            expiryDate: Timestamp.fromDate(expiryDate)
        })

        setCode("")
        hapticFeedback('success')
    }

    const copyCode = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("تم نسخ الكود")
        hapticFeedback('light')
    }

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-white">الكوبونات والخصومات</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Discount Engine</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <Label className="text-white">كود الخصم</Label>
                        <div className="flex gap-2">
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="مثال: OFFER20"
                                className="bg-white/5 border-white/10 text-white font-mono placeholder:text-slate-600"
                            />
                            <Button onClick={generateCode} variant="outline" className="border-white/10 hover:bg-white/5 text-purple-400">
                                <Sparkles className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white">نسبة الخصم (%)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="bg-white/5 border-white/10 text-white pl-10 placeholder:text-slate-600"
                            />
                            <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white">الحد الأقصى للاستخدام</Label>
                        <Input
                            type="number"
                            value={usageLimit}
                            onChange={(e) => setUsageLimit(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white">مدة الصلاحية (بالأيام)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={expiryDays}
                                onChange={(e) => setExpiryDays(e.target.value)}
                                className="bg-white/5 border-white/10 text-white pl-10 placeholder:text-slate-600"
                            />
                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                    </div>

                    <Button onClick={handleAdd} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold col-span-1 md:col-span-2 py-6">
                        إنشاء الكوبون
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {coupons.map((coupon) => (
                        <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card p-4 border-white/5 relative group overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 w-2 h-full bg-purple-500/20" />

                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-xl text-white font-mono tracking-wider">{coupon.code}</h4>
                                        <button onClick={() => copyCode(coupon.code)} className="text-slate-500 hover:text-white transition-colors">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-purple-400 font-bold">{coupon.discount}% خصم</p>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                                        <span>استخدام: {coupon.usedCount}/{coupon.usageLimit}</span>
                                        <span>•</span>
                                        <span>ينتهي: {coupon.expiryDate ? (coupon.expiryDate as unknown as Timestamp).toDate().toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => deleteCoupon(coupon.id)}
                                    variant="ghost"
                                    className="text-red-400 hover:bg-red-400/10 hover:text-red-300 h-8 w-8 p-0 rounded-full"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
