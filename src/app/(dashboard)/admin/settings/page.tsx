"use client"

import { useState } from "react"
import { useStore, StoreSettings } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Save, Truck, Info, Phone, FileText, Download, BarChart3, Shield, UserPlus, Trash2, CheckCircle, Circle, PlusSquare } from "lucide-react"
import Link from "next/link"
import { exportToCSV } from "@/lib/export-utils"
import { hapticFeedback } from "@/lib/haptics"
import { toast } from "sonner"

export default function AdminSettingsPage() {
    const { storeSettings, updateStoreSettings, orders, customers } = useStore()
    const [formData, setFormData] = useState<StoreSettings>(storeSettings)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateStoreSettings(formData)
        hapticFeedback('success')
    }

    const handleChange = (key: keyof StoreSettings, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }))
        // Subtle feedback for typing/changing
        hapticFeedback('light')
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">إعدادات المتجر</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-6"
                    onClick={handleSubmit}
                >
                    <Save className="w-4 h-4" />
                    <span>حفظ الكل</span>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Features Section */}
                <Section icon={<Truck className="w-5 h-5" />} title="مميزات المتجر (المربعات العلوية)">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label>عنوان الشحن</Label>
                            <Input
                                value={formData.shippingTitle}
                                onChange={(e) => handleChange("shippingTitle", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>وصف الشحن</Label>
                            <Input
                                value={formData.shippingDesc}
                                onChange={(e) => handleChange("shippingDesc", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <hr className="border-white/5" />
                        <div className="space-y-2">
                            <Label>عنوان الدفع</Label>
                            <Input
                                value={formData.paymentTitle}
                                onChange={(e) => handleChange("paymentTitle", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>وصف الدفع</Label>
                            <Input
                                value={formData.paymentDesc}
                                onChange={(e) => handleChange("paymentDesc", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <hr className="border-white/5" />
                        <div className="space-y-2">
                            <Label>عنوان الدعم</Label>
                            <Input
                                value={formData.supportTitle}
                                onChange={(e) => handleChange("supportTitle", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>وصف الدعم</Label>
                            <Input
                                value={formData.supportDesc}
                                onChange={(e) => handleChange("supportDesc", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                    </div>
                </Section>

                {/* About Section */}
                <Section icon={<Info className="w-5 h-5" />} title="من نحن (أسفل المتجر)">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>العنوان الرئيسي</Label>
                            <Input
                                value={formData.aboutTitle}
                                onChange={(e) => handleChange("aboutTitle", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>النص التعريفي</Label>
                            <textarea
                                className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                                value={formData.aboutText}
                                onChange={(e) => handleChange("aboutText", e.target.value)}
                            />
                        </div>
                    </div>
                </Section>

                {/* Contact Section */}
                <Section icon={<Phone className="w-5 h-5" />} title="معلومات التواصل">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>رقم الهاتف / الخط الساخن</Label>
                            <Input
                                value={formData.contactPhone}
                                onChange={(e) => handleChange("contactPhone", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>العنوان الفعلي</Label>
                            <Input
                                value={formData.contactAddress}
                                onChange={(e) => handleChange("contactAddress", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <hr className="border-white/5" />
                        <div className="space-y-2">
                            <Label>رابط واتساب</Label>
                            <Input
                                value={formData.socialWhatsapp}
                                onChange={(e) => handleChange("socialWhatsapp", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط تيوتير (X)</Label>
                            <Input
                                value={formData.socialTwitter}
                                onChange={(e) => handleChange("socialTwitter", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط انستقرام</Label>
                            <Input
                                value={formData.socialInstagram}
                                onChange={(e) => handleChange("socialInstagram", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط فيسبوك</Label>
                            <Input
                                value={formData.socialFacebook}
                                onChange={(e) => handleChange("socialFacebook", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط تيك توك</Label>
                            <Input
                                value={formData.socialTiktok}
                                onChange={(e) => handleChange("socialTiktok", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط سناب شات</Label>
                            <Input
                                value={formData.socialSnapchat}
                                onChange={(e) => handleChange("socialSnapchat", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                    </div>
                </Section>

                {/* Footer Links */}
                <Section icon={<FileText className="w-5 h-5" />} title="روابط قانونية">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>شروط الاستخدام</Label>
                            <Input
                                value={formData.footerTerms}
                                onChange={(e) => handleChange("footerTerms", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>الشروط والأحكام</Label>
                            <Input
                                value={formData.footerPrivacy}
                                onChange={(e) => handleChange("footerPrivacy", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>سياسة الاسترجاع</Label>
                            <Input
                                value={formData.footerReturns}
                                onChange={(e) => handleChange("footerReturns", e.target.value)}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                    </div>
                </Section>

                {/* Reports & Exports */}
                <Section icon={<BarChart3 className="w-5 h-5" />} title="التقارير واستخراج البيانات">
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500">يمكنك تحميل نسخ احتياطية من بياناتك بصيغة CSV لفتحها في Excel.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-blue-500/5 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 gap-2 h-12 rounded-xl"
                                onClick={() => exportToCSV(orders, "طلبات_المتجر")}
                            >
                                <Download className="w-4 h-4" />
                                <span>تصدير الطلبات</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-teal-500/5 border-teal-500/20 text-teal-400 hover:bg-teal-500/10 gap-2 h-12 rounded-xl"
                                onClick={() => exportToCSV(customers, "عملاء_المتجر")}
                            >
                                <Download className="w-4 h-4" />
                                <span>تصدير العملاء</span>
                            </Button>
                        </div>
                    </div>
                </Section>
                {/* Entity Management Section */}
                <Section icon={<Shield className="w-5 h-5" />} title="إدارة الكيان (إدارة الكيان)">
                    <div className="space-y-6">
                        {/* Mandatory Info Toggle */}
                        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <Label className="text-white font-bold">إلزام العميل بالاسم ورقم الجوال</Label>
                                <span className="text-[10px] text-slate-400">لن يتمكن العميل من إتمام الطلب دون تعبئة بياناته</span>
                            </div>
                            <div
                                onClick={() => setFormData({ ...formData, requireCustomerInfoOnCheckout: !formData.requireCustomerInfoOnCheckout })}
                                className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${formData.requireCustomerInfoOnCheckout ? 'bg-primary' : 'bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.requireCustomerInfoOnCheckout ? 'left-1' : 'left-6'}`} />
                            </div>
                        </div>

                        <hr className="border-white/5" />

                        {/* Staff Management */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-primary" />
                                إدارة الموظفين
                            </h3>

                            <StaffManager />
                        </div>
                    </div>
                </Section>

            </form>
        </div>
    )
}

function StaffManager() {
    const { staff, addStaff, deleteStaff } = useStore()
    const [isAdding, setIsAdding] = useState(false)
    const [newStaff, setNewStaff] = useState({
        name: "",
        username: "",
        password: "",
        permissions: ["orders"] as string[]
    })

    const handleAdd = () => {
        if (!newStaff.name || !newStaff.username || !newStaff.password) {
            toast.error("يرجى إكمال جميع البيانات")
            return
        }
        addStaff(newStaff)
        setNewStaff({ name: "", username: "", password: "", permissions: ["orders"] })
        setIsAdding(false)
        hapticFeedback('success')
    }

    const togglePermission = (perm: string) => {
        setNewStaff(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }))
        hapticFeedback('light')
    }

    const ALL_PERMS = [
        { id: "orders", label: "الطلبات" },
        { id: "products", label: "المنتجات" },
        { id: "customers", label: "العملاء" },
        { id: "settings", label: "الإعدادات" },
        { id: "chat", label: "المحادثات" },
        { id: "sales", label: "المبيعات" },
    ]

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {staff.map(member => (
                    <div key={member.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group">
                        <div>
                            <p className="text-sm font-bold text-white">{member.name}</p>
                            <p className="text-[10px] text-slate-500">@{member.username} • {member.permissions.length} صلاحيات</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-400/10"
                                onClick={() => deleteStaff(member.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px]">الاسم</Label>
                            <Input
                                placeholder="اسم الموظف"
                                value={newStaff.name}
                                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                className="bg-black/40 h-10 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px]">اليوزر</Label>
                            <Input
                                placeholder="username"
                                value={newStaff.username}
                                onChange={e => setNewStaff({ ...newStaff, username: e.target.value })}
                                className="bg-black/40 h-10 text-xs"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px]">كلمة المرور</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={newStaff.password}
                            onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                            className="bg-black/40 h-10 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px]">الصلاحيات</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {ALL_PERMS.map(perm => (
                                <button
                                    key={perm.id}
                                    type="button"
                                    onClick={() => togglePermission(perm.id)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${newStaff.permissions.includes(perm.id)
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-black/40 border-white/5 text-slate-500 hover:border-white/10"
                                        }`}
                                >
                                    {newStaff.permissions.includes(perm.id) ? (
                                        <CheckCircle className="w-3 h-3" />
                                    ) : (
                                        <Circle className="w-3 h-3" />
                                    )}
                                    {perm.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button className="flex-1 h-10 text-xs" onClick={handleAdd}>إضافة</Button>
                        <Button variant="ghost" className="h-10 text-xs" onClick={() => setIsAdding(false)}>إلغاء</Button>
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 h-12 rounded-xl text-xs gap-2"
                    onClick={() => setIsAdding(true)}
                >
                    <PlusSquare className="w-4 h-4" />
                    <span>إضافة موظف جديد</span>
                </Button>
            )}
        </div>
    )
}

function Section({ children, icon, title }: { children: React.ReactNode, icon: React.ReactNode, title: string }) {
    return (
        <div className="glass-card p-6 space-y-6">
            <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                {icon}
                <h2 className="font-bold">{title}</h2>
            </div>
            {children}
        </div>
    )
}

