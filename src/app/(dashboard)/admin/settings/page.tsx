"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useStore, StoreSettings } from "@/context/store-context"
import { CouponManager } from "@/components/admin/coupon-manager"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Save, ArrowRight, Truck, Info, Phone, FileText, Download, BarChart3, ShoppingBag, Music, Volume2, RotateCcw, Upload, Layers, Printer, Scan, Play, Database
} from "lucide-react"
import Link from "next/link"
// import { useSounds, SoundEvent } from "@/hooks/use-sounds" // Missing hook, using store version
import { exportToCSV, exportComprehensiveReport, exportFullSystemBackup, exportCustomersToWord, exportStaffToWord } from "@/lib/export-utils"
import { hapticFeedback } from "@/lib/haptics"
// import { sendPushNotification, broadcastPushNotification, getRegisteredTokensCount } from "@/app/actions/notifications"
import { useFcmToken } from "@/hooks/use-fcm-token"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { Lock, Shield, UserPlus } from "lucide-react"
import { StaffManager } from "@/components/admin/staff-manager"
import { verifyAIKey } from "@/app/actions/ai"
import { Switch } from "@/components/ui/switch"
import { WheelPicker } from "@/components/shared/wheel-picker"

import { printProductList } from "@/lib/print-product-list"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const PROTECTED_PIN = "4422707";

type SoundEvent = 'newOrder' | 'newMessage' | 'statusUpdate' | 'generalPush' | 'passwordRequest';

export default function AdminSettingsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <AdminSettingsContent />
        </Suspense>
    )
}

function AdminSettingsContent() {
    const { storeSettings, updateStoreSettings, orders, customers, products, categories, staff, currentUser, coupons, banners, productRequests, messages, notifications } = useStore()
    const { fcmToken, notificationPermissionStatus } = useFcmToken()
    const [formData, setFormData] = useState<StoreSettings>(storeSettings)
    const [totalDevices, setTotalDevices] = useState<number | null>(null)
    const [activeTab, setActiveTab] = useState<'identity' | 'alerts' | 'coupons' | 'data' | 'entity'>('identity')

    // Report State
    const [reportStartDate, setReportStartDate] = useState("")
    const [reportEndDate, setReportEndDate] = useState("")
    const [reportCategory, setReportCategory] = useState("all")
    const [reportSort, setReportSort] = useState<"newest" | "oldest" | "price_high" | "price_low" | "name">("newest")

    // Security State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [pin, setPin] = useState("")

    const TABS = [
        { id: 'identity', label: 'هوية المتجر', icon: <ShoppingBag className="w-5 h-5" />, color: 'text-blue-400' },
        { id: 'alerts', label: 'التنبيهات', icon: <Music className="w-5 h-5" />, color: 'text-purple-400' },
        { id: 'entity', label: 'إدارة الكيان', icon: <Shield className="w-5 h-5" />, color: 'text-amber-400' },
        { id: 'coupons', label: 'القسائم', icon: <FileText className="w-5 h-5" />, color: 'text-pink-400' },
        { id: 'data', label: 'النظام والبيانات', icon: <BarChart3 className="w-5 h-5" />, color: 'text-emerald-400' },
    ] as const

    if (!storeSettings || !formData) {
        return <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    }

    // useEffect(() => {
    //     getRegisteredTokensCount().then(res => {
    //         if (res.success) setTotalDevices(res.count)
    //     })
    // }, [])

    const searchParams = useSearchParams()

    // Sync state only on initial load or if explicitly reset
    useEffect(() => {
        if (storeSettings && Object.keys(storeSettings).length > 0) {
            setFormData(prev => {
                // If we haven't touched formData yet (still using mock values)
                // then sync from storeSettings
                if (!prev || (prev.aboutTitle === "مجموعة يحيى سلمان غزواني التجارية" && !prev.logoUrl)) {
                    return storeSettings;
                }
                return prev;
            });
        }
    }, [storeSettings])

    // Load tab from URL
    useEffect(() => {
        const tab = searchParams.get('tab') as any
        if (tab && ['identity', 'alerts', 'coupons', 'data', 'entity'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    const handleRepairAdmin = async () => {
        if (!currentUser?.id) return
        if (!confirm("هل أنت متأكد؟ سيتم تعيين حسابك الحالي كمسؤول بصلاحيات كاملة.")) return
        try {
            await setDoc(doc(db, "users", currentUser.id), {
                role: "admin",
                permissions: ["all"],
                email: currentUser.email || "",
                name: currentUser.name || "Admin",
                updatedAt: new Date()
            }, { merge: true })
            toast.success("تم إصلاح الصلاحيات بنجاح! يرجى تحديث الصفحة.")
            window.location.reload()
        } catch (e: any) {
            console.error("Fix Admin Error:", e)
            toast.error("فشل الإصلاح: " + e.message)
        }
    }

    const handleTestNotification = async () => {
        if (!currentUser?.id) {
            toast.error("حدث خطأ: لم يتم العثور على بيانات المستخدم")
            return
        }

        // toast.promise(
        //     sendPushNotification(
        //         currentUser.id,
        //         "تجربة الإشعارات 🔔",
        //         "نظام الإشعارات يعمل بنجاح! شكلك ومضمونك 10/10 ✨",
        //         "/admin/settings"
        //     ),
        //     {
        //         loading: "جاري إرسال الإشعار...",
        //         success: (data) => {
        //             if (data.success) {
        //                 playSound('newMessage')
        //                 hapticFeedback('success')
        //                 return `تم الإرسال بنجاح إلى ${data.sentCount} جهاز! 📱`
        //             }
        //             return `فشل الإرسال: ${data.error}`
        //         },
        //         error: (err) => {
        //             console.error("Test Notification Error:", err)
        //             return "حدث خطأ أثناء الإرسال"
        //         }
        //     }
        // )
        toast.info("تم تعطيل اختبار الإشعارات مؤقتاً للصيانة")
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateStoreSettings(formData)
        hapticFeedback('success')
    }

    const handleChange = (key: keyof StoreSettings, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }))
        // Subtle feedback for typing/changing
        hapticFeedback('light')
    }

    const { playSound } = useStore()

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

    const verifyPin = (e: React.FormEvent) => {
        e.preventDefault()
        if (pin === PROTECTED_PIN) {
            setIsAuthenticated(true)
            toast.success("تم تأكيد الرمز")
        } else {
            toast.error("رمز الدخول غير صحيح")
        }
    }

    const handlePrintReport = () => {
        let filtered = [...products]

        // 1. Date Filter
        if (reportStartDate) {
            const start = new Date(reportStartDate)
            start.setHours(0, 0, 0, 0)
            filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) >= start)
        }
        if (reportEndDate) {
            const end = new Date(reportEndDate)
            end.setHours(23, 59, 59, 999)
            filtered = filtered.filter(p => p.createdAt && new Date(p.createdAt) <= end)
        }

        // 2. Category Filter
        if (reportCategory !== "all") {
            filtered = filtered.filter(p => p.category === reportCategory)
        }

        // 3. Sort
        filtered.sort((a, b) => {
            if (reportSort === 'name') return a.name.localeCompare(b.name, "ar")
            if (reportSort === 'price_high') return b.pricePiece - a.pricePiece
            if (reportSort === 'price_low') return a.pricePiece - b.pricePiece
            if (reportSort === 'oldest') return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0)
            // newest
            return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        })

        if (filtered.length === 0) {
            toast.error(`لا توجد منتجات تطابق الفلتر! (إجمالي المنتجات: ${products.length})`)
            return
        }

        const filters = []
        if (reportCategory !== 'all') filters.push(`القسم: ${reportCategory}`)
        if (reportStartDate || reportEndDate) filters.push(`الفترة: ${reportStartDate} إلى ${reportEndDate}`)

        printProductList(filtered, "تقرير المنتجات", filters.join(' | '))
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">منطقة محمية</h1>
                    <p className="text-muted-foreground text-sm">أدخل رمز الحماية الخاص بالإدارة للوصول للاعدادات</p>
                </div>
                <form onSubmit={verifyPin} className="max-w-xs w-full space-y-4">
                    <Input
                        type="password"
                        placeholder="رمز الحماية"
                        className="bg-background border-border text-center text-lg tracking-widest h-12 text-foreground"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold h-12">
                        دخول لصفحة الإعدادات
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="group rounded-2xl bg-muted/50 hover:bg-muted transition-all">
                            <ArrowRight className="w-5 h-5 text-foreground group-hover:-translate-x-1 rotate-180 rtl:rotate-0" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
                            إعدادات المتجر
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse">V2.0 PREMIUM</span>
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">LAST_SYNC: 2026.01.28.14.50</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">

                    <Button
                        onClick={handleSubmit}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-2xl h-12 px-10 shadow-lg shadow-primary/20 transition-all active:translate-y-0.5 font-black uppercase tracking-wider"
                    >
                        <Save className="w-5 h-5" />
                        <span>حفظ الإعدادات</span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-2 bg-card rounded-[2.5rem] border border-border shadow-sm">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id)
                            hapticFeedback('light')
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 relative group",
                            activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <div className={cn("transition-colors duration-300", activeTab === tab.id ? "text-primary-foreground" : tab.color)}>
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
                                                className="bg-background border-border h-12 rounded-xl text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>النص التعريفي</Label>
                                            <textarea
                                                className="w-full h-32 bg-background border border-border rounded-xl p-4 text-foreground text-sm focus:ring-1 focus:ring-primary outline-none"
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
                                                    className="bg-background border-border h-11 text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>العنوان الفعلي</Label>
                                                <Input
                                                    value={formData.contactAddress}
                                                    onChange={(e) => handleChange("contactAddress", e.target.value)}
                                                    className="bg-background border-border h-11 text-foreground"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <Label>رابط واتساب</Label>
                                                <Input
                                                    value={formData.socialWhatsapp}
                                                    onChange={(e) => handleChange("socialWhatsapp", e.target.value)}
                                                    className="bg-background border-border h-11 text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رابط تيوتير (X)</Label>
                                                <Input
                                                    value={formData.socialTwitter}
                                                    onChange={(e) => handleChange("socialTwitter", e.target.value)}
                                                    className="bg-background border-border h-11 text-foreground"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>رابط انستقرام</Label>
                                                <Input
                                                    value={formData.socialInstagram}
                                                    onChange={(e) => handleChange("socialInstagram", e.target.value)}
                                                    className="bg-background border-border h-11 text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رابط فيسبوك</Label>
                                                <Input
                                                    value={formData.socialFacebook}
                                                    onChange={(e) => handleChange("socialFacebook", e.target.value)}
                                                    className="bg-background border-border h-11 text-foreground"
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
                                                className="bg-background border-border h-11 text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>الشروط والأحكام</Label>
                                            <Input
                                                value={formData.footerPrivacy}
                                                onChange={(e) => handleChange("footerPrivacy", e.target.value)}
                                                className="bg-background border-border h-11 text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>سياسة الاسترجاع</Label>
                                            <Input
                                                value={formData.footerReturns}
                                                onChange={(e) => handleChange("footerReturns", e.target.value)}
                                                className="bg-background border-border h-11 text-foreground"
                                            />
                                        </div>
                                    </div>
                                </Section>

                                <div className="lg:col-span-2">
                                    <Section icon={<Truck className="w-5 h-5" />} title="مميزات المتجر (الخدمات)">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Shipping */}
                                            <div className="p-6 bg-card rounded-2xl border border-border space-y-4 shadow-sm">
                                                <div className="flex items-center gap-2 text-primary">
                                                    <Truck className="w-5 h-5" />
                                                    <h4 className="font-bold text-foreground">خدمة الشحن</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>العنوان</Label>
                                                    <Input
                                                        value={formData.shippingTitle}
                                                        onChange={(e) => handleChange("shippingTitle", e.target.value)}
                                                        className="bg-background border-border text-foreground"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>الوصف</Label>
                                                    <Input
                                                        value={formData.shippingDesc}
                                                        onChange={(e) => handleChange("shippingDesc", e.target.value)}
                                                        className="bg-background border-border text-foreground"
                                                    />
                                                </div>
                                            </div>

                                            {/* Payment */}
                                            <div className="p-6 bg-card rounded-2xl border border-border space-y-4 shadow-sm">
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <ShoppingBag className="w-5 h-5" />
                                                    <h4 className="font-bold text-foreground">طريقة الدفع</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>العنوان</Label>
                                                    <Input
                                                        value={formData.paymentTitle}
                                                        onChange={(e) => handleChange("paymentTitle", e.target.value)}
                                                        className="bg-background border-border text-foreground"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>الوصف</Label>
                                                    <Input
                                                        value={formData.paymentDesc}
                                                        onChange={(e) => handleChange("paymentDesc", e.target.value)}
                                                        className="bg-background border-border text-foreground"
                                                    />
                                                </div>
                                            </div>

                                            {/* Support */}
                                            <div className="p-6 bg-card rounded-2xl border border-border space-y-4 shadow-sm">
                                                <div className="flex items-center gap-2 text-blue-500">
                                                    <Phone className="w-5 h-5" />
                                                    <h4 className="font-bold text-foreground">والدعم الفني</h4>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>العنوان</Label>
                                                    <Input
                                                        value={formData.supportTitle}
                                                        onChange={(e) => handleChange("supportTitle", e.target.value)}
                                                        className="bg-background border-border text-foreground"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>الوصف</Label>
                                                    <Input
                                                        value={formData.supportDesc}
                                                        onChange={(e) => handleChange("supportDesc", e.target.value)}
                                                        className="bg-background border-border text-foreground"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                    </Section>
                                </div>
                            </div>
                        )}

                        {activeTab === 'alerts' && (
                            <Section icon={<Music className="w-5 h-5" />} title="إدارة نغمات التنبيه">
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-500">تخصيص الأصوات لكل حدث مهم في المتجر والمشار إليها في لوحة العميل.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <SoundRow
                                            title="طلب استعادة كلمة مرور 🔑"
                                            description="تنبيه عند وصول طلب استعادة كلمة مرور جديد"
                                            event="passwordRequest"
                                            currentSound={formData.sounds?.passwordRequest}
                                            onUpload={(file) => handleSoundUpload('passwordRequest', file)}
                                            onPlay={() => {
                                                if (formData.sounds?.passwordRequest) {
                                                    new Audio(formData.sounds.passwordRequest).play()
                                                } else {
                                                    playSound('passwordRequest')
                                                }
                                            }}
                                            onReset={() => resetSound('passwordRequest')}
                                        />
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
                                        <SoundRow
                                            title="إشعار عام للعميل 🔔"
                                            description="الصوت الذي يسمعه العميل عند وصول تنبيه أو عرض"
                                            event="generalPush"
                                            currentSound={formData.sounds?.generalPush}
                                            onUpload={(file) => handleSoundUpload('generalPush', file)}
                                            onPlay={() => {
                                                if (formData.sounds?.generalPush) {
                                                    new Audio(formData.sounds.generalPush).play()
                                                } else {
                                                    playSound('generalPush')
                                                }
                                            }}
                                            onReset={() => resetSound('generalPush')}
                                        />

                                    </div>
                                </div>
                            </Section>
                        )}

                        {activeTab === 'coupons' && (
                            <div className="glass-card p-2 rounded-3xl overflow-hidden">
                                <CouponManager />
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-6">
                                <Section icon={<BarChart3 className="w-5 h-5" />} title="التقارير واستخراج البيانات">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                                        {/* Product Reports Card */}
                                        <div className="p-6 bg-card rounded-2xl border border-border space-y-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground">تقارير المنتجات المخصصة</h4>
                                                    <p className="text-xs text-muted-foreground">تصفية وطباعة قوائم المنتجات حسب الطلب</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Filters Column */}
                                                <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">الفترة الزمنية</Label>
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {(['all', 'today', 'week', 'month'] as const).map(range => (
                                                                <button
                                                                    key={range}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const now = new Date()
                                                                        let start = new Date()
                                                                        const toLocal = (d: Date) => {
                                                                            const offset = d.getTimezoneOffset()
                                                                            return new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
                                                                        }

                                                                        if (range === 'all') {
                                                                            setReportStartDate('')
                                                                            setReportEndDate('')
                                                                            return
                                                                        }

                                                                        if (range === 'today') start.setHours(0, 0, 0, 0)
                                                                        if (range === 'week') start.setDate(now.getDate() - 7)
                                                                        if (range === 'month') start.setMonth(now.getMonth() - 1)

                                                                        setReportStartDate(toLocal(start))
                                                                        setReportEndDate(toLocal(now))
                                                                    }}
                                                                    className="text-[10px] px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                >
                                                                    {range === 'all' && 'الكل'}
                                                                    {range === 'today' && 'اليوم'}
                                                                    {range === 'week' && 'أسبوع'}
                                                                    {range === 'month' && 'شهر'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-muted-foreground">من</Label>
                                                            <div className="bg-background border border-border rounded-lg overflow-hidden">
                                                                <WheelPicker
                                                                    date={reportStartDate ? new Date(reportStartDate) : undefined}
                                                                    setDate={(d: Date | undefined) => {
                                                                        if (d) {
                                                                            const offset = d.getTimezoneOffset()
                                                                            const localDate = new Date(d.getTime() - (offset * 60 * 1000))
                                                                            setReportStartDate(localDate.toISOString().split('T')[0])
                                                                        } else {
                                                                            setReportStartDate('')
                                                                        }
                                                                    }}
                                                                    placeholder="البدء"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-muted-foreground">إلى</Label>
                                                            <div className="bg-background border border-border rounded-lg overflow-hidden">
                                                                <WheelPicker
                                                                    date={reportEndDate ? new Date(reportEndDate) : undefined}
                                                                    setDate={(d: Date | undefined) => {
                                                                        if (d) {
                                                                            const offset = d.getTimezoneOffset()
                                                                            const localDate = new Date(d.getTime() - (offset * 60 * 1000))
                                                                            setReportEndDate(localDate.toISOString().split('T')[0])
                                                                        } else {
                                                                            setReportEndDate('')
                                                                        }
                                                                    }}
                                                                    placeholder="الانتهاء"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sort & Action Column */}
                                                <div className="space-y-3 flex flex-col justify-between h-full">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-muted-foreground">القسم</Label>
                                                            <select
                                                                value={reportCategory}
                                                                onChange={(e) => setReportCategory(e.target.value)}
                                                                className="w-full bg-background border border-border rounded-lg h-9 text-xs text-foreground px-2 outline-none focus:ring-1 focus:ring-emerald-500"
                                                            >
                                                                <option value="all">الكل</option>
                                                                {categories.map(c => <option key={c.nameAr} value={c.nameAr}>{c.nameAr}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] text-muted-foreground">الترتيب</Label>
                                                            <select
                                                                value={reportSort}
                                                                onChange={(e) => setReportSort(e.target.value as any)}
                                                                className="w-full bg-background border border-border rounded-lg h-9 text-xs text-foreground px-2 outline-none focus:ring-1 focus:ring-emerald-500"
                                                            >
                                                                <option value="newest">الأحدث</option>
                                                                <option value="oldest">الأقدم</option>
                                                                <option value="price_high">الأغلى</option>
                                                                <option value="price_low">الأرخص</option>
                                                                <option value="name">أبجدي</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        onClick={handlePrintReport}
                                                        className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold gap-2 shadow-sm"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                        طباعة التقرير
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Actions Grid */}
                                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Comprehensive Report */}
                                            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm group hover:border-emerald-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Download className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">Excel شامل</h4>
                                                        <p className="text-[10px] text-muted-foreground">العملاء والطلبات والتفاصيل</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => exportComprehensiveReport(customers, orders)}
                                                    className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                                                >
                                                    تحميل
                                                </Button>
                                            </div>

                                            {/* Customers Word */}
                                            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm group hover:border-blue-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                                        <UserPlus className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">بيانات العملاء</h4>
                                                        <p className="text-[10px] text-muted-foreground">سجل Word للطباعة</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => exportCustomersToWord(customers)}
                                                    className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                                >
                                                    تحميل
                                                </Button>
                                            </div>

                                            {/* Staff Word */}
                                            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm group hover:border-purple-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Shield className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">سجل الموظفين</h4>
                                                        <p className="text-[10px] text-muted-foreground">الصلاحيات والبيانات</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => exportStaffToWord(staff)}
                                                    className="h-8 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20"
                                                >
                                                    تحميل
                                                </Button>
                                            </div>

                                            {/* Full Backup */}
                                            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm group hover:border-slate-500/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-secondary text-secondary-foreground rounded-xl group-hover:scale-110 transition-transform">
                                                        <Database className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">نسخة احتياطية</h4>
                                                        <p className="text-[10px] text-muted-foreground">JSON كامل للنظام</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => exportFullSystemBackup({
                                                        backupDate: new Date(),
                                                        settings: storeSettings,
                                                        products,
                                                        categories,
                                                        customers,
                                                        orders,
                                                        staff,
                                                        coupons,
                                                        banners,
                                                        productRequests,
                                                        messages,
                                                        notifications
                                                    })}
                                                    className="h-8 border-secondary-foreground/20 text-secondary-foreground hover:bg-secondary/80"
                                                >
                                                    تحميل
                                                </Button>
                                            </div>

                                            {/* Repair Permissions */}
                                            <div className="bg-card border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between shadow-sm group hover:border-rose-500/50 transition-all bg-rose-500/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                                                        <Shield className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-rose-700 dark:text-rose-400">إصلاح الصلاحيات</h4>
                                                        <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70">اضغط هنا إذا واجهت مشاكل</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleRepairAdmin}
                                                    className="h-8 border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                                >
                                                    إصلاح
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )
                        }

                        {
                            activeTab === 'entity' && (
                                <div className="grid grid-cols-1 gap-6">
                                    <Section icon={<Shield className="w-5 h-5" />} title="سياسات العملاء">
                                        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-foreground font-bold cursor-pointer" onClick={() => setFormData({ ...formData, requireCustomerInfoOnCheckout: !formData.requireCustomerInfoOnCheckout })}>
                                                    إلزام العميل بالاسم ورقم الجوال
                                                </Label>
                                                <span className="text-[10px] text-muted-foreground">لن يتمكن العميل من إتمام الطلب دون تعبئة بياناته</span>
                                            </div>
                                            <Switch
                                                checked={formData.requireCustomerInfoOnCheckout}
                                                onCheckedChange={(checked) => setFormData({ ...formData, requireCustomerInfoOnCheckout: checked })}
                                            />
                                        </div>
                                    </Section>

                                    <Section icon={<UserPlus className="w-5 h-5" />} title="إدارة الموظفين">
                                        <StaffManager />
                                    </Section>

                                    <Section icon={<Lock className="w-5 h-5" />} title="الأمان وبيانات الدخول">
                                        <SecuritySettingsPorted formData={formData} handleChange={handleChange} />
                                    </Section>

                                    <Section icon={<Layers className="w-5 h-5" />} title="تحكم الظهور (إخفاء أقسام)">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { id: 'search', label: 'شريط البحث' },
                                                { id: 'offers', label: 'بانر العروض (الأعلى)' },
                                                { id: 'categories', label: 'شريط الأقسام' },
                                                { id: 'products', label: 'قائمة المنتجات' }
                                            ].map((item) => (
                                                <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                                    <Label className="text-foreground font-bold cursor-pointer">{item.label}</Label>
                                                    <Switch
                                                        checked={formData.hiddenSections?.includes(item.id as any) || false}
                                                        onCheckedChange={(checked) => {
                                                            const current = formData.hiddenSections || []
                                                            const updated = checked
                                                                ? [...current, item.id]
                                                                : current.filter(id => id !== item.id)
                                                            handleChange("hiddenSections", updated)
                                                        }}
                                                        className="data-[state=checked]:bg-red-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </Section>

                                    <Section icon={<Scan className="w-5 h-5" />} title="أدوات النظام (الباركود)">
                                        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-foreground font-bold cursor-pointer" onClick={() => handleChange("enableBarcodeScanner", !formData.enableBarcodeScanner as any)}>
                                                    تفعيل الماسح الضوئي
                                                </Label>
                                                <span className="text-[10px] text-muted-foreground">زر عائم في صفحة المنتجات لسهولة البحث</span>
                                            </div>
                                            <Switch
                                                checked={formData.enableBarcodeScanner !== false}
                                                onCheckedChange={(checked) => handleChange("enableBarcodeScanner", checked as any)}
                                            />
                                        </div>
                                    </Section>
                                </div>
                            )
                        }

                    </motion.div >
                </AnimatePresence >
            </form >
        </div >
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-card rounded-2xl border border-border gap-4 shadow-sm">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground text-sm">{title}</h4>
                    {currentSound && <span className="px-2 py-0.5 bg-primary/20 text-primary text-[8px] rounded-full">مخصص ✨</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onPlay}
                    className="h-10 w-10 border border-border hover:bg-muted rounded-full"
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
                        size="sm"
                        onClick={() => document.getElementById(`file-${event}`)?.click()}
                        className="h-10 px-4 border border-border hover:bg-muted rounded-full gap-2"
                    >
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">تغيير</span>
                    </Button>
                </div>

                {currentSound && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onReset}
                        className="h-10 w-10 border border-border hover:bg-rose-500/10 rounded-full"
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
        <div className="bg-card glass-card p-6 space-y-6 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center gap-3 text-primary border-b border-border pb-4">
                {icon}
                <h2 className="font-bold">{title}</h2>
            </div>
            {children}
        </div>
    )
}

function SecuritySettingsPorted({ formData, handleChange }: { formData: StoreSettings, handleChange: (key: keyof StoreSettings, value: any) => void }) {
    const { storeSettings } = useStore()

    return (
        <div className="space-y-6">
            {/* Gemini API Key Section */}
            <div className="space-y-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-lg">✨</span>
                        </div>
                        <div>
                            <Label className="text-foreground font-bold text-base">مفتاح الذكاء الاصطناعي</Label>
                            <p className="text-xs text-muted-foreground mt-1">تفعيل/تعطيل المساعد الذكي (Gemini) في التطبيق</p>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold transition-colors ${formData.enableAIChat !== false ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                    {formData.enableAIChat !== false ? "مفعل" : "معطل"}
                                </span>
                                <Switch
                                    checked={formData.enableAIChat !== false}
                                    onCheckedChange={(checked) => handleChange("enableAIChat", checked)}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {formData.enableAIChat !== false && (
                    <>
                        <p className="text-xs text-muted-foreground mb-2">ضع المفتاح هنا لتفعيل مميزات "المساعد الذكي" وتحليل صور المنتجات.</p>
                        <div className="flex gap-2">
                            <GeminiKeyInput formData={formData} handleChange={handleChange} />
                        </div>
                    </>
                )}

            </div>
        </div>
    )
}

function GeminiKeyInput({ formData, handleChange }: { formData: StoreSettings, handleChange: (key: keyof StoreSettings, value: any) => void }) {
    const [keys, setKeys] = useState<{ key: string, status: "valid" | "invalid" | "unchecked" }[]>([])

    // Sync keys with formData when it changes
    useEffect(() => {
        if (!formData) return
        const existing = Array.isArray(formData.aiApiKeys) ? formData.aiApiKeys : []
        const filled = [...existing]
        while (filled.length < 3) filled.push({ key: "", status: "unchecked" })
        setKeys(filled.slice(0, 3))
    }, [formData?.aiApiKeys])

    const saveToLocalState = (newKeys: typeof keys) => {
        handleChange("aiApiKeys", newKeys)
    }

    const updateKey = (index: number, val: string) => {
        const newKeys = [...keys]
        newKeys[index] = { ...newKeys[index], key: val, status: "unchecked" }
        setKeys(newKeys)
    }

    const handleBlur = () => saveToLocalState(keys)

    const updateStatus = (index: number, status: "valid" | "invalid" | "unchecked") => {
        const newKeys = [...keys]
        newKeys[index] = { ...newKeys[index], status }
        setKeys(newKeys)
        saveToLocalState(newKeys)
    }

    return (
        <div className="w-full">
            <Label className="mb-2 block text-xs text-muted-foreground">مفاتيح الربط (3 مفاتيح احتياطية)</Label>
            {keys.map((k, i) => (
                <SingleAIKeyInput
                    key={i}
                    index={i}
                    keyData={k}
                    onChange={(val: string) => updateKey(i, val)}
                    onBlur={handleBlur}
                    onStatusChange={(status: "valid" | "invalid" | "unchecked") => updateStatus(i, status)}
                />
            ))}
        </div>
    )
}

function SingleAIKeyInput({ index, keyData, onChange, onBlur, onStatusChange }: any) {
    const [show, setShow] = useState(false)
    const [checking, setChecking] = useState(false)

    const handleVerify = async () => {
        if (!keyData.key) return
        setChecking(true)
        try {
            // Use dedicated API route for better reliability and debugging
            const response = await fetch('/api/verify-gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: keyData.key })
            })

            const result = await response.json()

            if (result.success) {
                onStatusChange("valid")
                toast.success(`مفتاح ${index + 1} يعمل بنجاح ✅ (تذكر حفظ الإعدادات!)`)
            } else {
                onStatusChange("invalid")
                toast.error(`خطأ: ${result.error || "المفتاح غير صالح"}`)
            }
        } catch (e) {
            onStatusChange("invalid")
            toast.error("فشل الاتصال بالخادم")
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
                <Input
                    type={show ? "text" : "password"}
                    value={keyData.key}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    className={`bg-background border-border pr-10 font-mono text-xs text-foreground ${keyData.status === "valid" ? "border-emerald-500/50" : keyData.status === "invalid" ? "border-rose-500/50" : ""}`}
                    placeholder={`Key #${index + 1}`}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                    {show ? "إخفاء" : "عرض"}
                </button>
            </div>
            <Button
                type="button"
                onClick={handleVerify}
                disabled={checking || !keyData.key}
                size="sm"
                variant="secondary"
                className="h-10 rounded-xl"
            >
                {checking ? "..." : keyData.status === "valid" ? "✅" : "تحقق"}
            </Button>
        </div>
    )
}
