"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Shield, Save, UserPlus, ArrowRight } from "lucide-react"
import Link from "next/link"
// import { toast } from "sonner"
import { StaffManager } from "@/components/admin/staff-manager"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { toast } from "sonner"

const PROTECTED_PIN = "4422707";

export default function EntityManagementPage() {
    const { storeSettings, updateStoreSettings } = useStore()
    const [settings, setSettings] = useState(storeSettings)
    const [isSaving, setIsSaving] = useState(false)

    // Security State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [pin, setPin] = useState("")

    useEffect(() => {
        setSettings(storeSettings)
    }, [storeSettings])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateStoreSettings(settings)
            await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const verifyPin = (e: React.FormEvent) => {
        e.preventDefault()
        if (pin === PROTECTED_PIN) {
            setIsAuthenticated(true)
            toast.success("تم تأكيد الرمز")
        } else {
            toast.error("رمز الدخول غير صحيح")
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">منطقة محمية</h1>
                    <p className="text-slate-400 text-sm">أدخل رمز الحماية الخاص بالإدارة للوصول لهذه الصفحة</p>
                </div>
                <form onSubmit={verifyPin} className="max-w-xs w-full space-y-4">
                    <Input
                        type="password"
                        placeholder="رمز الحماية"
                        className="bg-black/40 border-white/10 text-center text-lg tracking-widest h-12"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" className="w-full bg-primary text-black font-bold h-12">
                        دخول
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        إدارة الكيان
                    </h1>
                    <p className="text-slate-400 text-sm">إدارة الموظفين وصلاحياتهم وإعدادات العملاء</p>
                </div>
                <div className="mr-auto">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Mandatory Info Section */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                        <Shield className="w-5 h-5" />
                        <h2 className="font-bold">سياسات العملاء</h2>
                    </div>

                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label className="text-white font-bold cursor-pointer" onClick={() => setSettings({ ...settings, requireCustomerInfoOnCheckout: !settings.requireCustomerInfoOnCheckout })}>
                                إلزام العميل بالاسم ورقم الجوال
                            </Label>
                            <span className="text-[10px] text-slate-400">لن يتمكن العميل من إتمام الطلب دون تعبئة بياناته</span>
                        </div>
                        <div
                            onClick={() => setSettings({ ...settings, requireCustomerInfoOnCheckout: !settings.requireCustomerInfoOnCheckout })}
                            className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${settings.requireCustomerInfoOnCheckout ? 'bg-primary' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${settings.requireCustomerInfoOnCheckout ? 'left-1' : 'left-6'}`} />
                        </div>
                    </div>
                </div>

                {/* Staff Management Section */}
                <div className="glass-card p-6 space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                        <UserPlus className="w-5 h-5" />
                        <h2 className="font-bold">إدارة الموظفين</h2>
                    </div>

                    <StaffManager />
                </div>
            </div>
        </div>
    )
}
