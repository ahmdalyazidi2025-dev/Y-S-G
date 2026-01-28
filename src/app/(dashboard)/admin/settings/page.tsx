"use client"

import { useState, useEffect } from "react"
import { useStore, StoreSettings } from "@/context/store-context"
import { CouponManager } from "@/components/admin/coupon-manager"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, ArrowRight, Truck, Info, Phone, FileText, Download, BarChart3, ShoppingBag, Music, Volume2, RotateCcw, Upload } from "lucide-react"
import Link from "next/link"
import { useSounds, SoundEvent } from "@/hooks/use-sounds"
import { exportToCSV, exportComprehensiveReport, exportFullSystemBackup } from "@/lib/export-utils"
import { hapticFeedback } from "@/lib/haptics"
import { sendPushNotification, broadcastPushNotification, getRegisteredTokensCount } from "@/app/actions/notifications"
import { useFcmToken } from "@/hooks/use-fcm-token"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function AdminSettingsPage() {
    const { storeSettings, updateStoreSettings, orders, customers, products, categories, staff, currentUser } = useStore()
    const { fcmToken, notificationPermissionStatus } = useFcmToken()
    const [formData, setFormData] = useState<StoreSettings>(storeSettings)
    const [totalDevices, setTotalDevices] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'identity' | 'logistics' | 'alerts' | 'coupons' | 'data'>('identity')

    const TABS = [
        { id: 'identity', label: 'هوية المتجر', icon: <ShoppingBag className="w-5 h-5" />, color: 'text-blue-400' },
        { id: 'logistics', label: 'اللوجستيات', icon: <Truck className="w-5 h-5" />, color: 'text-orange-400' },
        { id: 'alerts', label: 'التنبيهات', icon: <Music className="w-5 h-5" />, color: 'text-purple-400' },
        { id: 'coupons', label: 'القسائم', icon: <FileText className="w-5 h-5" />, color: 'text-pink-400' },
        { id: 'data', label: 'النظام والبيانات', icon: <BarChart3 className="w-5 h-5" />, color: 'text-emerald-400' },
    ] as const

    useEffect(() => {
        getRegisteredTokensCount().then(res => {
            if (res.success) setTotalDevices(res.count)
        })
    }, [])

    // Sync state when storeSettings loads from Firebase
    useEffect(() => {
        setFormData(storeSettings)
    }, [storeSettings])

    const handleTestNotification = async () => {
        if (!currentUser?.id) {
            toast.error("حدث خطأ: لم يتم العثور على بيانات المستخدم")
            return
        }

        toast.promise(
            sendPushNotification(
                currentUser.id,
                "تجربة الإشعارات 🔔",
                "نظام الإشعارات يعمل بنجاح! شكلك ومضمونك 10/10 ✨",
                "/admin/settings"
            ),
            {
                loading: "جاري إرسال الإشعار...",
                success: (data) => {
                    if (data.success) return `تم الإرسال بنجاح إلى ${data.sentCount} جهاز! 📱`
                    return `فشل الإرسال: ${data.error}`
                },
                error: (err) => {
                    console.error("Test Notification Error:", err)
                    return "حدث خطأ أثناء الإرسال"
                }
            }
        )
    }

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

    const { playSound } = useSounds()

    const handleSoundUpload = (event: SoundEvent, file: File) => {
        if (!file.type.startsWith('audio/')) {
            toast.error("يرجى اختيار ملف صوتي صحيح")
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const base64 = e.target?.result as string
            setFormData(prev => ({
                ...prev,
                sounds: {
                    ...prev.sounds,
                    [event]: base64
                }
            }))
            toast.success("تم تجهيز الصوت المخصص، تذكر الضغط على حفظ.")
        }
        reader.readAsDataURL(file)
    }

    const resetSound = (event: SoundEvent) => {
        setFormData(prev => {
            const newSounds = { ...prev.sounds }
            delete newSounds[event]
            return { ...prev, sounds: newSounds }
        })
        toast.info("تم العودة للصوت الافتراضي لهذه المهمة.")
    }

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="group rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                            <ArrowRight className="w-5 h-5 text-white group-hover:-translate-x-1" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                            إعدادات المتجر
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse">V2.0 PREMIUM</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">LAST_SYNC: 2026.01.28.14.50</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-yellow-500/60 hover:text-yellow-400 gap-1 h-10 rounded-2xl border border-yellow-500/10 hover:border-yellow-500/30 transition-all font-bold"
                        onClick={() => {
                            if (confirm("سيتم تصفير المخزن المؤقت وإعادة تحميل الصفحة. هل أنت متأكد؟")) {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.reload();
                            }
                        }}
                    >
                        إعادة تهيئة النظام ⚡
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-2xl h-12 px-10 shadow-lg shadow-primary/20 transition-all active:translate-y-0.5 font-black uppercase tracking-wider"
                    >
                        <Save className="w-5 h-5" />
                        <span>حفظ الإعدادات</span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-2 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id)
                            hapticFeedback('light')
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 relative group",
                            activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5"
                        )}
                    >
                        <div className={cn("transition-colors duration-300", activeTab === tab.id ? "text-white" : tab.color)}>
                            {tab.icon}
                        </div>
                        <span className="text-sm font-bold whitespace-nowrap">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-glow"
                                className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl -z-10"
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="relative min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="space-y-6"
                    >
                        {activeTab === 'identity' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Section icon={<Info className="w-5 h-5" />} title="من نحن (أسفل المتجر)">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>العنوان الرئيسي</Label>
                                            <Input
                                                value={formData.aboutTitle}
                                                onChange={(e) => handleChange("aboutTitle", e.target.value)}
                                                className="bg-black/20 border-white/10 h-12 rounded-xl"
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

                                <Section icon={<Phone className="w-5 h-5" />} title="معلومات التواصل">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>رقم الهاتف</Label>
                                                <Input
                                                    value={formData.contactPhone}
                                                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                                                    className="bg-black/20 border-white/10 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>العنوان الفعلي</Label>
                                                <Input
                                                    value={formData.contactAddress}
                                                    onChange={(e) => handleChange("contactAddress", e.target.value)}
                                                    className="bg-black/20 border-white/10 h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <Label>رابط واتساب</Label>
                                                <Input
                                                    value={formData.socialWhatsapp}
                                                    onChange={(e) => handleChange("socialWhatsapp", e.target.value)}
                                                    className="bg-black/20 border-white/10 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رابط تيوتير (X)</Label>
                                                <Input
                                                    value={formData.socialTwitter}
                                                    onChange={(e) => handleChange("socialTwitter", e.target.value)}
                                                    className="bg-black/20 border-white/10 h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>رابط انستقرام</Label>
                                                <Input
                                                    value={formData.socialInstagram}
                                                    onChange={(e) => handleChange("socialInstagram", e.target.value)}
                                                    className="bg-black/20 border-white/10 h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رابط فيسبوك</Label>
                                                <Input
                                                    value={formData.socialFacebook}
                                                    onChange={(e) => handleChange("socialFacebook", e.target.value)}
                                                    className="bg-black/20 border-white/10 h-11"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Section>

                                <Section icon={<FileText className="w-5 h-5" />} title="روابط قانونية">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>شروط الاستخدام</Label>
                                            <Input
                                                value={formData.footerTerms}
                                                onChange={(e) => handleChange("footerTerms", e.target.value)}
                                                className="bg-black/20 border-white/10 h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>الشروط والأحكام</Label>
                                            <Input
                                                value={formData.footerPrivacy}
                                                onChange={(e) => handleChange("footerPrivacy", e.target.value)}
                                                className="bg-black/20 border-white/10 h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>سياسة الاسترجاع</Label>
                                            <Input
                                                value={formData.footerReturns}
                                                onChange={(e) => handleChange("footerReturns", e.target.value)}
                                                className="bg-black/20 border-white/10 h-11"
                                            />
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'logistics' && (
                            <Section icon={<Truck className="w-5 h-5" />} title="مميزات المتجر (الخدمات)">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Truck className="w-5 h-5" />
                                            <h4 className="font-bold">خدمة الشحن</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>العنوان</Label>
                                            <Input
                                                value={formData.shippingTitle}
                                                onChange={(e) => handleChange("shippingTitle", e.target.value)}
                                                className="bg-black/40 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>الوصف</Label>
                                            <Input
                                                value={formData.shippingDesc}
                                                onChange={(e) => handleChange("shippingDesc", e.target.value)}
                                                className="bg-black/40 border-white/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <ShoppingBag className="w-5 h-5" />
                                            <h4 className="font-bold">طريقة الدفع</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>العنوان</Label>
                                            <Input
                                                value={formData.paymentTitle}
                                                onChange={(e) => handleChange("paymentTitle", e.target.value)}
                                                className="bg-black/40 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>الوصف</Label>
                                            <Input
                                                value={formData.paymentDesc}
                                                onChange={(e) => handleChange("paymentDesc", e.target.value)}
                                                className="bg-black/40 border-white/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-black/20 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <Phone className="w-5 h-5" />
                                            <h4 className="font-bold">والدعم الفني</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>العنوان</Label>
                                            <Input
                                                value={formData.supportTitle}
                                                onChange={(e) => handleChange("supportTitle", e.target.value)}
                                                className="bg-black/40 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>الوصف</Label>
                                            <Input
                                                value={formData.supportDesc}
                                                onChange={(e) => handleChange("supportDesc", e.target.value)}
                                                className="bg-black/40 border-white/10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Section>
                        )}

                        {activeTab === 'alerts' && (
                            <div className="space-y-6">
                                <Section icon={<Info className="w-5 h-5" />} title="اختبار النظام وتنبيهات الإشعارات">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-black/20 p-5 rounded-2xl border border-white/5 gap-4">
                                        <div>
                                            <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                                                تجربة الإشعارات 🔔
                                                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">FCM Test</span>
                                            </h3>
                                            <p className="text-sm text-slate-400">أرسل إشعار تجريبي لهاتفك الآن للتأكد من وصول التنبيهات.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleTestNotification}
                                                className="border-primary/30 text-primary hover:bg-primary/10 h-12 px-8 rounded-2xl font-bold"
                                            >
                                                إرسال لجهازي
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={async () => {
                                                    toast.promise(
                                                        broadcastPushNotification("تنبيه عام 🚨", "هذا إشعار تجريبي مرسل لجميع الأجهزة المسجلة."),
                                                        {
                                                            loading: "جاري بث الإشعار للكل...",
                                                            success: (res: any) => `تم الإرسال لـ ${res.sentCount} جهاز! 📢`,
                                                            error: "فشل البث"
                                                        }
                                                    )
                                                }}
                                                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 h-12 px-8 rounded-2xl font-bold"
                                            >
                                                بث للجميع
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <h4 className="text-sm font-bold text-primary mb-3">إرسال لعميل محدد:</h4>
                                            <select
                                                className="w-full bg-black/40 border-white/10 rounded-xl text-sm px-4 h-12 text-white outline-none focus:ring-1 focus:ring-primary"
                                                onChange={(e) => {
                                                    const cid = e.target.value;
                                                    if (cid) {
                                                        const customer = customers.find(c => c.id === cid);
                                                        toast.promise(
                                                            sendPushNotification(cid, "تجربة إشعار عميل 🔔", `مرحباً ${customer?.name || ''}، هذا إشعار تجريبي من الإدارة.`, "/customer/invoices"),
                                                            {
                                                                loading: "جاري الإرسال للعميل...",
                                                                success: (res: any) => res.success ? `وصلت لـ ${res.sentCount} من أجهزة العميل! ✅` : `فشل: ${res.error}`,
                                                                error: "حدث خطأ"
                                                            }
                                                        )
                                                    }
                                                }}
                                            >
                                                <option value="">اختر عميلاً للإرسال له...</option>
                                                {customers.map(c => {
                                                    const tokenCount = (c as any).fcmTokens?.length || 0;
                                                    return (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name} ({c.phone}) - {tokenCount === 0 ? 'لا يوجد أجهزة ❌' : `${tokenCount} أجهزة ✅`}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">حالة الإذن:</span>
                                                <span className={cn("font-bold", notificationPermissionStatus === 'granted' ? 'text-emerald-400' : 'text-rose-400')}>
                                                    {notificationPermissionStatus === 'granted' ? 'مسموح ✅' : 'مرفوض/غير نشط ⚠️'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">إجمالي الأجهزة المسجلة:</span>
                                                <span className="text-primary font-bold">{totalDevices || '...'}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (fcmToken && currentUser?.id) {
                                                        const collectionName = currentUser.role === "admin" || currentUser.role === "staff" ? "staff" : "customers"
                                                        import('firebase/firestore').then(async ({ doc, setDoc, arrayUnion, getFirestore }) => {
                                                            const app = (await import('@/lib/firebase')).app;
                                                            const db = getFirestore(app);
                                                            toast.promise(
                                                                setDoc(doc(db, collectionName, currentUser.id), {
                                                                    fcmTokens: arrayUnion(fcmToken)
                                                                }, { merge: true }),
                                                                {
                                                                    loading: "جاري المزامنة...",
                                                                    success: "تم الربط بنجاح! ✅",
                                                                    error: "فشلت المزامنة"
                                                                }
                                                            )
                                                        })
                                                    }
                                                }}
                                                className="w-full h-10 border border-primary/20 rounded-xl text-primary hover:bg-primary/10 transition-colors font-bold"
                                            >
                                                ربط جهازي الحالي يدوياً ⚡
                                            </button>
                                        </div>
                                    </div>
                                </Section>

                                <Section icon={<Music className="w-5 h-5" />} title="إدارة نغمات التنبيه">
                                    <div className="space-y-4">
                                        <p className="text-xs text-slate-500">تخصيص الأصوات لكل حدث مهم في المتجر والمشار إليها في لوحة العميل.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <SoundRow
                                                title="طلب جديد 💰"
                                                description="أصوات لوحة التحكم للإداريين"
                                                event="newOrder"
                                                currentSound={formData.sounds?.newOrder}
                                                onUpload={(file) => handleSoundUpload('newOrder', file)}
                                                onPlay={() => {
                                                    if (formData.sounds?.newOrder) {
                                                        new Audio(formData.sounds.newOrder).play()
                                                    } else {
                                                        playSound('newOrder')
                                                    }
                                                }}
                                                onReset={() => resetSound('newOrder')}
                                            />
                                            <SoundRow
                                                title="رسالة شات 💬"
                                                description="تنبيه الدردشة الجماعية والخاصة"
                                                event="newMessage"
                                                currentSound={formData.sounds?.newMessage}
                                                onUpload={(file) => handleSoundUpload('newMessage', file)}
                                                onPlay={() => {
                                                    if (formData.sounds?.newMessage) {
                                                        new Audio(formData.sounds.newMessage).play()
                                                    } else {
                                                        playSound('newMessage')
                                                    }
                                                }}
                                                onReset={() => resetSound('newMessage')}
                                            />
                                            <SoundRow
                                                title="تحديث الحالة 📦"
                                                description="صوت يصل للعميل عند تغير حالة طلبه"
                                                event="statusUpdate"
                                                currentSound={formData.sounds?.statusUpdate}
                                                onUpload={(file) => handleSoundUpload('statusUpdate', file)}
                                                onPlay={() => {
                                                    if (formData.sounds?.statusUpdate) {
                                                        new Audio(formData.sounds.statusUpdate).play()
                                                    } else {
                                                        playSound('statusUpdate')
                                                    }
                                                }}
                                                onReset={() => resetSound('statusUpdate')}
                                            />
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'coupons' && (
                            <div className="glass-card p-2 rounded-3xl overflow-hidden">
                                <CouponManager />
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <Section icon={<BarChart3 className="w-5 h-5" />} title="التقارير واستخراج البيانات">
                                <div className="space-y-6">
                                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
                                        <div className="flex items-center gap-3 text-emerald-400">
                                            <FileText className="w-6 h-6" />
                                            <div>
                                                <h4 className="font-bold">التقرير الشامل للمتجر</h4>
                                                <p className="text-xs text-slate-500">تحميل ملف CSV يحتوي على كافة العملاء وطلباتهم وتفاصيلها مرتبة زمنياً.</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => exportComprehensiveReport(customers, orders)}
                                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg gap-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            استخراج ملف Excel (CSV)
                                        </Button>
                                    </div>

                                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-3 text-yellow-500">
                                            <ShoppingBag className="w-6 h-6" />
                                            <div>
                                                <h4 className="font-bold">الصندوق الأسود (Full Backup)</h4>
                                                <p className="text-xs text-slate-500">نسخة احتياطية كاملة للنظام (JSON) تتضمن المنتجات، العملاء، والطلبات.</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => exportFullSystemBackup({
                                                settings: storeSettings,
                                                products,
                                                categories,
                                                staff,
                                                customers,
                                                orders
                                            })}
                                            className="w-full h-14 bg-slate-800 hover:bg-slate-700 border-white/5 text-slate-200 rounded-2xl font-bold gap-2"
                                        >
                                            <Save className="w-5 h-5" />
                                            تحميل نسخة احتياطية Offline
                                        </Button>
                                    </div>
                                </div>
                            </Section>
                        )}
                    </motion.div>
                </AnimatePresence>
            </form>
        </div>
    )
}

function SoundRow({ title, description, event, currentSound, onUpload, onPlay, onReset }: {
    title: string,
    description: string,
    event: SoundEvent,
    currentSound?: string,
    onUpload: (file: File) => void,
    onPlay: () => void,
    onReset: () => void
}) {
    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{title}</h4>
                    {currentSound && <span className="px-2 py-0.5 bg-primary/20 text-primary text-[8px] rounded-full">مخصص ✨</span>}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onPlay}
                    className="h-10 w-10 border border-white/5 hover:bg-white/10"
                >
                    <Volume2 className="w-4 h-4 text-primary" />
                </Button>

                <div className="relative">
                    <input
                        type="file"
                        id={`file-${event}`}
                        className="hidden"
                        accept="audio/*"
                        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => document.getElementById(`file-${event}`)?.click()}
                        className="h-10 w-10 border border-white/5 hover:bg-white/10"
                    >
                        <Upload className="w-4 h-4 text-slate-400" />
                    </Button>
                </div>

                {currentSound && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onReset}
                        className="h-10 w-10 border border-white/5 hover:bg-rose-500/10"
                    >
                        <RotateCcw className="w-4 h-4 text-rose-400" />
                    </Button>
                )}
            </div>
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

