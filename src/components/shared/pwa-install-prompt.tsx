"use client"
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Share, PlusSquare, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hapticFeedback } from "@/lib/haptics"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed"
        platform: string
    }>
    prompt(): Promise<void>
}

// مفاتيح localStorage
const PROMPT_KEY_CUSTOMER = "ysg-pwa-prompt-dismissed-customer"
const PROMPT_KEY_ADMIN    = "ysg-pwa-prompt-dismissed-admin"
const INSTALLED_KEY       = "ysg-pwa-installed"

export function PwaInstallPrompt() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // نعرف أن المستخدم من الإدارة إذا:
    // 1. المسار يبدأ بـ /admin
    // 2. أو صفحة تسجيل الدخول تحمل role=admin أو from يحتوي على /admin
    const fromParam = searchParams?.get("from") || ""
    const roleParam = searchParams?.get("role") || ""
    const isAdmin = pathname?.startsWith("/admin")
        || roleParam === "admin"
        || fromParam.includes("/admin")

    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    // هل سبق رفض/إغلاق هذا النوع من النافذة؟
    const getPromptKey = () => isAdmin ? PROMPT_KEY_ADMIN : PROMPT_KEY_CUSTOMER

    const hasSeenPrompt = () => {
        try { return !!localStorage.getItem(getPromptKey()) } catch { return true }
    }

    const markSeen = () => {
        try { localStorage.setItem(getPromptKey(), "1") } catch {}
    }

    const markInstalled = () => {
        try { localStorage.setItem(INSTALLED_KEY, "1") } catch {}
    }

    useEffect(() => {
        // هل المتصفح في وضع standalone (الموقع مثبت بالفعل)؟
        const nav = window.navigator as Navigator & { standalone?: boolean }
        const standalone = window.matchMedia("(display-mode: standalone)").matches || !!nav.standalone
        setIsStandalone(standalone)
        if (standalone) { markInstalled(); return }

        // هل الجهاز iOS؟
        const ua = window.navigator.userAgent.toLowerCase()
        const ios = /iphone|ipad|ipod/.test(ua)
        setIsIOS(ios)

        // إذا سبق إغلاق النافذة → لا تُظهرها
        if (hasSeenPrompt()) return

        // Android / Chrome — استمع لحدث beforeinstallprompt
        const handlePrompt = (e: Event) => {
            const ev = e as unknown as BeforeInstallPromptEvent
            ev.preventDefault()
            setDeferredPrompt(ev)
            // أظهر النافذة بعد 3 ثواني من فتح الصفحة
            setTimeout(() => setShowPrompt(true), 3000)
        }

        window.addEventListener("beforeinstallprompt" as keyof WindowEventMap, handlePrompt as EventListener)

        // iOS — لا يوجد حدث، أظهرها يدوياً
        if (ios) {
            setTimeout(() => setShowPrompt(true), 4000)
        }

        return () => {
            window.removeEventListener("beforeinstallprompt" as keyof WindowEventMap, handlePrompt as EventListener)
        }
    }, [pathname]) // إعادة التحقق عند تغيير المسار (عميل → إدارة)

    // زر "تثبيت الآن" — Android/Chrome
    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === "accepted") {
                markInstalled()
                markSeen()
                setShowPrompt(false)
                setDeferredPrompt(null)
            }
            hapticFeedback("success")
        }
    }

    // زر "لاحقاً" أو X → لا تُظهر مرة أخرى لهذا النوع
    const handleDismiss = () => {
        markSeen()
        setShowPrompt(false)
        hapticFeedback("light")
    }

    if (isStandalone) return null

    // بيانات العرض حسب النوع (إدارة / عميل)
    const config = isAdmin
        ? {
            icon: "/admin-logo.png?v=3",
            title: "YSG Admin",
            subtitle: "قسم الإدارة",
            description: "ثبّت لوحة الإدارة كتطبيق مستقل للوصول السريع ومتابعة الطلبات والمبيعات.",
            accentColor: "#1e3a5f",
            badgeText: "الإدارة",
        }
        : {
            icon: "/pwa-icon.png",
            title: "Y S G",
            subtitle: "متجر المجموعة",
            description: "حوّل المتجر إلى تطبيق على هاتفك للوصول السريع والآمن بضغطة واحدة.",
            accentColor: "#2563eb",
            badgeText: "العملاء",
        }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) handleDismiss() }}
                >
                    <motion.div
                        initial={{ y: 60, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
                        style={{ background: "rgba(10,14,26,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                        {/* Gradient header accent */}
                        <div
                            className="absolute top-0 left-0 right-0 h-1"
                            style={{ background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)` }}
                        />

                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 left-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors z-10"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                        >
                            <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        {/* Badge */}
                        <div className="absolute top-4 right-4">
                            <span
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ background: `${config.accentColor}99` }}
                            >
                                {config.badgeText}
                            </span>
                        </div>

                        <div className="p-8 pt-10 flex flex-col items-center text-center gap-5">
                            {/* Icon */}
                            <div
                                className="w-24 h-24 rounded-[28px] overflow-hidden shadow-xl flex-shrink-0 relative"
                                style={{ border: `2px solid ${config.accentColor}40` }}
                            >
                                <Image
                                    src={config.icon}
                                    alt={config.title}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                                {/* Gloss overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                            </div>

                            {/* Text */}
                            <div className="space-y-1.5">
                                <h3 className="text-xl font-black text-white tracking-tight">
                                    {config.title}
                                </h3>
                                <p className="text-xs font-bold" style={{ color: config.accentColor === "#1e3a5f" ? "#60a5fa" : "#93c5fd" }}>
                                    {config.subtitle}
                                </p>
                                <p className="text-slate-400 text-xs leading-relaxed max-w-[240px] mx-auto">
                                    {config.description}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="w-full space-y-2.5 mt-1">
                                {isIOS ? (
                                    /* iOS instructions */
                                    <div className="space-y-3">
                                        <div
                                            className="rounded-2xl p-4 space-y-3 text-right"
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                                        >
                                            <p className="text-[10px] text-slate-400 font-bold text-center mb-2">كيفية التثبيت على iPhone</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.15)" }}>
                                                    <Share className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <p className="text-[11px] text-slate-300">اضغط على زر <strong className="text-white">المشاركة</strong> في المتصفح</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>
                                                    <PlusSquare className="w-4 h-4 text-white" />
                                                </div>
                                                <p className="text-[11px] text-slate-300">اختر <strong className="text-white">إضافة إلى الشاشة الرئيسية</strong></p>
                                            </div>
                                        </div>
                                        <Button onClick={handleDismiss} className="w-full h-11 rounded-2xl text-sm font-bold" style={{ background: config.accentColor }}>
                                            حسناً، فهمت ✓
                                        </Button>
                                    </div>
                                ) : (
                                    /* Android / Desktop */
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleInstall}
                                            className="flex-1 h-12 rounded-2xl text-sm font-bold gap-2 text-white"
                                            style={{ background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}cc)` }}
                                        >
                                            <Download className="w-4 h-4" />
                                            تثبيت الآن
                                        </Button>
                                        <Button
                                            onClick={handleDismiss}
                                            className="h-12 px-4 rounded-2xl text-xs text-slate-400 hover:text-white transition-colors"
                                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                                            variant="ghost"
                                        >
                                            لاحقاً
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
