"use client"
import React, { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Download, X, Share, PlusSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hapticFeedback } from "@/lib/haptics"

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)
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
            e.preventDefault()
            setDeferredPrompt(e)
            if (!isStandaloneMode) {
                setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
            }
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // Fallback for Android/Desktop Chrome if event doesn't fire quickly
        const fallbackTimer = setTimeout(() => {
            if (!isStandaloneMode && !ios && !deferredPrompt) {
                const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen')
                if (!hasSeenPrompt) {
                    setShowPrompt(true)
                }
            }
        }, 8000)

        // For iOS, show prompt manually if not standalone
        if (ios && !isStandaloneMode) {
            const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen')
            if (!hasSeenPrompt) {
                setTimeout(() => setShowPrompt(true), 5000)
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            clearTimeout(fallbackTimer)
        }
    }, [isStandalone, isIOS])

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            const promptEvent = deferredPrompt as any
            promptEvent.prompt()
            const { outcome } = await promptEvent.userChoice
            if (outcome === 'accepted') {
                setDeferredPrompt(null)
                setShowPrompt(false)
            }
            hapticFeedback('success')
        }
    }

    const closePrompt = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-prompt-seen', 'true')
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
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                <img src="/pwa-icon.jpg" alt="Y S G Logo" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-white text-2xl tracking-tight flex items-center justify-center gap-2">
                                    تثبيت <span className="text-primary">Y S G</span> 📱
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed max-w-[250px] mx-auto font-medium">
                                    حوّل المتجر إلى تطبيق على هاتفك الآن للوصول السريع والآمن بضغطة واحدة.
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
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleInstallClick}
                                        className="flex-1 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 text-xs py-2"
                                    >
                                        تثبيت الآن
                                    </Button>
                                    <Button
                                        onClick={closePrompt}
                                        variant="glass"
                                        className="rounded-xl text-[10px] py-2"
                                    >
                                        لاحقاً
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
