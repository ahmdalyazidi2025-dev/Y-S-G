"use client"
import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

import { motion, AnimatePresence } from "framer-motion"
import { X, Share, PlusSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hapticFeedback } from "@/lib/haptics"
import { toast } from "sonner"

import Image from "next/image"

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed"
        platform: string
    }>
    prompt(): Promise<void>
}

// Component to handle PWA installation
export function PwaInstallPrompt() {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/login')
    const storageKey = isAdmin ? 'pwa-admin-prompt-seen' : 'pwa-customer-prompt-seen'
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if already in standalone mode
        const navigatorAny = window.navigator as Navigator & { standalone?: boolean }
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || navigatorAny.standalone
        if (isStandaloneMode !== isStandalone) setIsStandalone(!!isStandaloneMode)

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const ios = /iphone|ipad|ipod/.test(userAgent)
        if (ios !== isIOS) setIsIOS(ios)

        // Listen for beforeinstallprompt (Android/Chrome)
        const handleBeforeInstallPrompt = (e: Event) => {
            const ev = e as unknown as BeforeInstallPromptEvent
            ev.preventDefault()
            setDeferredPrompt(ev)
            if (!isStandaloneMode) {
                setTimeout(() => {
                    const hasSeenPrompt = sessionStorage.getItem(storageKey)
                    if (!hasSeenPrompt) setShowPrompt(true)
                }, 3000) // Show after 3 seconds if not seen in session
            }
        }

        window.addEventListener('beforeinstallprompt' as keyof WindowEventMap, handleBeforeInstallPrompt as unknown as EventListener)

        // Fallback for Android/Desktop Chrome if event doesn't fire quickly
        const fallbackTimer = setTimeout(() => {
            if (!isStandaloneMode && !ios) {
                // If deferredPrompt is missing, it might mean the browser already handled it or doesn't support it well,
                // but we still show the UI. We'll handle the click gracefully later.
                const hasSeenPrompt = sessionStorage.getItem(storageKey)
                if (!hasSeenPrompt) {
                    setShowPrompt(true)
                }
            }
        }, 8000)

        // For iOS, show prompt manually if not standalone
        if (ios && !isStandaloneMode) {
            const hasSeenPrompt = sessionStorage.getItem(storageKey)
            if (!hasSeenPrompt) {
                setTimeout(() => setShowPrompt(true), 5000)
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            clearTimeout(fallbackTimer)
        }
    }, [isStandalone, isIOS, deferredPrompt])

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setDeferredPrompt(null)
                setShowPrompt(false)
            }
            hapticFeedback('success')
        } else {
            // Fallback if the browser doesn't provide the deferred prompt natively anymore
            // Instruct user or just close it gracefully if the API is restricted
            toast.info(isIOS ? "يرجى استخدام قائمة المشاركة لاختيار إضافة إلى الشاشة الرئيسية." : "يرجى تثبيت التطبيق من قائمة المتصفح لديك (أعلى الشاشة).");
            closePrompt();
        }
    }

    const closePrompt = () => {
        setShowPrompt(false)
        sessionStorage.setItem(storageKey, 'true')
        hapticFeedback('light')
    }

    if (isStandalone) return null

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, scaleY: 0.5 }}
                    animate={{ scale: 1, opacity: 1, scaleY: 1 }}
                    exit={{ scale: 0.9, opacity: 0, scaleY: 0.5 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                >
                    <div className="glass rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group max-w-sm w-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />

                        <button
                            onClick={closePrompt}
                            className="absolute top-3 left-3 p-1 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-28 h-28 bg-[#080b12] rounded-full flex items-center justify-center flex-shrink-0 shadow-2xl overflow-hidden border-4 border-white/5 p-0 relative transition-transform group-hover:scale-105 duration-500">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-full" />
                                <Image src={isAdmin ? "/admin-logo.png" : "/logo.png"} alt="YSG" className="w-full h-full object-cover rounded-full" width={112} height={112} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-white text-2xl tracking-tight flex items-center justify-center gap-2">
                                    تثبيت <span className="text-primary">{isAdmin ? "إدارة YSG" : "Y S G"}</span> 📱
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed max-w-[250px] mx-auto font-medium">
                                    {isAdmin ? "حوّل لوحة الإدارة إلى تطبيق على هاتفك للوصول السريع والآمن." : "حوّل المتجر إلى تطبيق على هاتفك الآن للوصول السريع والآمن بضغطة واحدة."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            {isIOS ? (
                                <div className="space-y-3">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-300">
                                            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                                                <Share className="w-3 h-3 text-blue-400" />
                                            </div>
                                            <span>اضغط على زر **المشاركة** بالمتصفح</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-300">
                                            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                                                <PlusSquare className="w-3 h-3 text-white" />
                                            </div>
                                            <span>اختر **إضافة إلى الشاشة الرئيسية**</span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={closePrompt}
                                        className="w-full rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs py-2"
                                    >
                                        حسناً، فهمت
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <Button
                                        onClick={closePrompt}
                                        variant="glass"
                                        className="rounded-2xl text-[12px] font-medium py-6 px-6 flex-shrink-0 bg-white/5 hover:bg-white/10"
                                    >
                                        لاحقاً
                                    </Button>
                                    <Button
                                        onClick={handleInstallClick}
                                        className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 text-[14px] font-bold py-6 transition-all active:scale-[0.98]"
                                    >
                                        تثبيت الآن
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
