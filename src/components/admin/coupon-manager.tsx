"use client"

import React, { useState } from "react"
import { useStore } from "@/context/store-context"
import { Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Ticket, Sparkles, Copy, Calendar, Percent } from "lucide-react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { motion, AnimatePresence } from "framer-motion"

export function CouponManager() {
    const { coupons, addCoupon, deleteCoupon, categories, storeSettings, updateStoreSettings } = useStore()
    const [code, setCode] = useState("")
    const [discount, setDiscount] = useState("10")
    const [usageLimit, setUsageLimit] = useState("100")
    // Replaced expiryDays with explicit dates
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0])
    const [customerLimit, setCustomerLimit] = useState("1") // New: Limit per customer
    const [minOrderValue, setMinOrderValue] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [selectedCustomerType, setSelectedCustomerType] = useState<string>("all") // New: Customer Type

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

        if (!startDate || !endDate) {
            toast.error("يجب تحديد تاريخ البداية والنهاية")
            return
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (end <= start) {
            toast.error("تاريخ النهاية يجب أن يكون بعد تاريخ البداية")
            return
        }

        // Set End Date to end of day
        end.setHours(23, 59, 59, 999)

        addCoupon({
            code: code.toUpperCase(),
            discount: discountValue,
            type: "percentage",
            usageLimit: parseInt(usageLimit) || 1000,
            active: true,
            minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
            categoryId: selectedCategory || undefined,
            expiryDate: Timestamp.fromDate(end),
            startDate: Timestamp.fromDate(start),
            customerUsageLimit: parseInt(customerLimit) || 1,
            allowedCustomerTypes: selectedCustomerType === "all" ? "all" : [selectedCustomerType]
        })

        setCode("")
        generateCode() // Generate new code for convenience
        hapticFeedback('success')
    }

    const copyCode = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("تم نسخ الكود")
        hapticFeedback('light')
    }

    return (
        <div className="space-y-6">
            <div className="bg-card glass-card p-6 border-border relative overflow-hidden rounded-2xl shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-foreground">الكوبونات والخصومات</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Discount Engine</p>
                    </div>
                    <div className="mr-auto flex items-center gap-2 bg-secondary px-4 py-2 rounded-full border border-border/50 shadow-sm">
                        <Label htmlFor="coupon-toggle" className="text-xs text-muted-foreground cursor-pointer">تفعيل النظام</Label>
                        <Switch
                            id="coupon-toggle"
                            checked={storeSettings.enableCoupons}
                            onCheckedChange={(checked: boolean) => updateStoreSettings({ ...storeSettings, enableCoupons: checked })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <Label className="text-foreground">كود الخصم</Label>
                        <div className="flex gap-2">
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="مثال: OFFER20"
                                className="bg-background border-border text-foreground font-mono placeholder:text-muted-foreground"
                            />
                            <Button onClick={generateCode} variant="outline" className="border-border hover:bg-muted text-purple-500 relative overflow-hidden group">
                                <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">نسبة الخصم (%)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                className="bg-background border-border text-foreground pl-10 placeholder:text-muted-foreground"
                            />
                            <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">الحد الأقصى للاستخدام</Label>
                        <Input
                            type="number"
                            value={usageLimit}
                            onChange={(e) => setUsageLimit(e.target.value)}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">مرات الاستخدام للعميل الواحد</Label>
                        <Input
                            type="number"
                            value={customerLimit}
                            onChange={(e) => setCustomerLimit(e.target.value)}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">تاريخ البداية</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">تاريخ النهاية</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">الحد الأدنى للطلب (اختياري)</Label>
                        <Input
                            type="number"
                            value={minOrderValue}
                            onChange={(e) => setMinOrderValue(e.target.value)}
                            placeholder="0.00"
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">تخصيص لقسم معين (اختياري)</Label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-background border border-border h-10 rounded-md text-foreground px-3 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="" className="bg-background text-foreground">الكل</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id} className="bg-background text-foreground">{cat.nameAr}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-foreground">فئة العملاء</Label>
                        <select
                            value={selectedCustomerType}
                            onChange={(e) => setSelectedCustomerType(e.target.value)}
                            className="w-full bg-background border border-border h-10 rounded-md text-foreground px-3 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="all" className="bg-background text-foreground">جميع العملاء</option>
                            <option value="vip" className="bg-background text-foreground">كبار الشخصيات (VIP)</option>
                            <option value="wholesale" className="bg-background text-foreground">الجملة</option>
                        </select>
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
                            className="bg-card glass-card p-4 border-border relative group overflow-hidden rounded-xl shadow-sm"
                        >
                            <div className="absolute right-0 top-0 w-2 h-full bg-purple-500/20" />

                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-black text-xl text-foreground font-mono tracking-wider">{coupon.code}</h4>
                                        <button onClick={() => copyCode(coupon.code)} className="text-muted-foreground hover:text-foreground transition-colors">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-purple-500 font-bold">{coupon.discount}% خصم</p>
                                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-2">
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
