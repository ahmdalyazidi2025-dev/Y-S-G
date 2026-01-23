"use client"

import { useState, useEffect } from "react"
import { useStore, StoreSettings } from "@/context/store-context"
import { CouponManager } from "@/components/admin/coupon-manager"
// import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, ArrowRight, Truck, Info, Phone, FileText, Download, BarChart3, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { exportToCSV, exportComprehensiveReport, exportFullSystemBackup } from "@/lib/export-utils"
import { hapticFeedback } from "@/lib/haptics"

export default function AdminSettingsPage() {
    const { storeSettings, updateStoreSettings, orders, customers, products, categories, staff } = useStore()
    const [formData, setFormData] = useState<StoreSettings>(storeSettings)

    // Sync state when storeSettings loads from Firebase
    useEffect(() => {
        setFormData(storeSettings)
    }, [storeSettings])

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

                {/* Coupon Management */}
                <div className="col-span-1 lg:col-span-2">
                    <CouponManager />
                </div>

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



                {/* Checkout Settings */}
                <Section icon={<ShoppingBag className="w-5 h-5" />} title="إعدادات إتمام الطلب">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-base">إلزام العميل بالاسم ورقم الجوال</Label>
                            <p className="text-xs text-slate-400">عند التفعيل، لن يتمكن العميل من إتمام الطلب دون إدخال بياناته.</p>
                        </div>
                        <div
                            onClick={() => setFormData({ ...formData, requireCustomerInfoOnCheckout: !formData.requireCustomerInfoOnCheckout })}
                            className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${formData.requireCustomerInfoOnCheckout ? 'bg-primary' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.requireCustomerInfoOnCheckout ? 'left-1' : 'left-6'}`} />
                        </div>
                    </div>
                </Section>

                {/* Reports & Exports */}
                <Section icon={<BarChart3 className="w-5 h-5" />} title="التقارير واستخراج البيانات">
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500">
                            زر واحد لتحميل تقرير شامل يحتوي على قائمة العملاء وطلباتهم وتفاصيلها مرتبة زمنياً، بصيغة Excel (CSV).
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 gap-2 h-14 rounded-xl text-base font-bold"
                            onClick={() => exportComprehensiveReport(customers, orders)}
                        >
                            <Download className="w-5 h-5" />
                            <span>تحميل التقرير الشامل (العملاء + الطلبات)</span>
                        </Button>

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-xs text-slate-500 mb-4">
                                "الصندوق الأسود": نسخة احتياطية كاملة (Offline Black Box) تحتوي على كل شيء (المنتجات، الأقسام، العملاء، الطلبات، الإعدادات، والموظفين) بصيغة JSON. احفظها في مكان آمن لاسترجاع النظام يدوياً عند الضرورة.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 gap-2 h-14 rounded-xl text-base font-bold"
                                onClick={() => exportFullSystemBackup({
                                    settings: storeSettings,
                                    products,
                                    categories,
                                    staff,
                                    customers,
                                    orders
                                })}
                            >
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-yellow-500" />
                                    <span>تحميل الصندوق الأسود (Black Box Backup)</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </Section>



                {/* Security Section */}
                <Section icon={<Save className="w-5 h-5" />} title="الأمان وبيانات الدخول">
                    <SecuritySettings />
                </Section>
            </form>
        </div >
    )
}



function SecuritySettings() {
    const { updateAdminCredentials } = useStore()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const handleUpdate = async () => {
        if (!username || !password) return
        await updateAdminCredentials(username, password)
        setUsername("")
        setPassword("")
    }

    return (
        <div className="space-y-6">
            {/* Gemini API Key Section - ADDED HERE */}
            <div className="space-y-2 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">✨</span>
                    <Label className="text-primary font-bold">مفتاح الذكاء الاصطناعي (Google Gemini)</Label>
                </div>
                <p className="text-xs text-slate-400 mb-2">ضع المفتاح هنا لتفعيل مميزات "المساعد الذكي" وتحليل صور المنتجات.</p>
                <div className="flex gap-2">
                    <ApiKeyInput />
                </div>
            </div>

            <hr className="border-white/5" />

            {/* Admin Credentials */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>اسم المستخدم الجديد</Label>
                    <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/20 border-white/10"
                        placeholder="ادخل اسم مستخدم جديد"
                    />
                </div>
                <div className="space-y-2">
                    <Label>كلمة المرور الجديدة</Label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black/20 border-white/10"
                        placeholder="ادخل كلمة مرور جديدة"
                    />
                </div>
                <Button
                    type="button"
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleUpdate}
                    disabled={!username || !password}
                >
                    تحديث بيانات الدخول
                </Button>
            </div>
        </div>
    )
}

function ApiKeyInput() {
    const { storeSettings, updateStoreSettings } = useStore()
    const [key, setKey] = useState(storeSettings.googleGeminiApiKey || "")
    const [show, setShow] = useState(false)

    const handleSaveKey = () => {
        updateStoreSettings({ ...storeSettings, googleGeminiApiKey: key })
        // hapticFeedback('success') - handled in store
    }

    return (
        <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
                <Input
                    type={show ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="bg-black/20 border-white/10 pr-10 font-mono text-xs"
                    placeholder="AIzaSy..."
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                    {show ? "إخفاء" : "عرض"}
                </button>
            </div>
            <Button type="button" onClick={handleSaveKey} variant="secondary" className="px-6">
                حفظ المفتاح
            </Button>
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

