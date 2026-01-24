"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { X, Camera, ImageIcon, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { useStore } from "@/context/store-context"
import { hapticFeedback } from "@/lib/haptics"

interface ScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onRequestProduct?: () => void
    onScan?: (code: string) => void
}

export default function ScannerModal({ isOpen, onClose, onRequestProduct, onScan }: ScannerModalProps) {
    const { scanProduct } = useStore()
    const [error, setError] = useState<string | null>(null)
    const [isFlashOn, setIsFlashOn] = useState(false)
    const [showNotFound, setShowNotFound] = useState(false)
    const [lastScanned, setLastScanned] = useState("")
    const scannerRef = useRef<Html5Qrcode | null>(null)

    const stopCamera = useCallback(async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop()
            scannerRef.current = null
            setIsFlashOn(false)
        }
    }, [])

    const handleScan = useCallback((decodedText: string) => {
        if (decodedText === lastScanned) return

        if (onScan) {
            hapticFeedback('medium')
            onScan(decodedText)
            onClose()
            return
        }

        const product = scanProduct(decodedText)
        if (product) {
            setLastScanned(decodedText)
            hapticFeedback('medium')
            onClose()
        } else {
            setLastScanned(decodedText)
            setShowNotFound(true)
            hapticFeedback('warning')
            stopCamera()
        }
    }, [lastScanned, onScan, onClose, stopCamera, scanProduct])

    const startCamera = useCallback(async () => {
        try {
            const html5QrCode = new Html5Qrcode("reader", {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.QR_CODE,
                ],
                verbose: false
            })
            scannerRef.current = html5QrCode
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    // aspectRatio: 1.0, // Removed to let it fill container naturally
                    disableFlip: false
                },
                (decodedText) => {
                    handleScan(decodedText)
                },
                () => { }
            )
            setError(null)
        } catch (err) {
            setError("فشل في تشغيل الكاميرا")
            console.error(err)
        }
    }, [handleScan])

    useEffect(() => {
        if (isOpen && !showNotFound) {
            startCamera()
        }
        return () => {
            stopCamera()
        }
    }, [isOpen, showNotFound, startCamera, stopCamera])

    const toggleFlash = async () => {
        if (!scannerRef.current) return
        try {
            // @ts-expect-error - getRunningTrack is not in the type definition but exists at runtime
            const track = scannerRef.current.getRunningTrack()
            if (track && track.getCapabilities()?.torch) {
                const nextState = !isFlashOn
                await track.applyConstraints({ advanced: [{ torch: nextState }] })
                setIsFlashOn(nextState)
            } else {
                toast.error("الفلاش غير مدعوم على هذا الجهاز أو لم يتم تشغيل الكاميرا")
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const html5QrCode = new Html5Qrcode("reader")
        try {
            const decodedText = await html5QrCode.scanFile(file, true)
            handleScan(decodedText)
        } catch {
            toast.error("لم يتم العثور على باركود في الصورة")
            hapticFeedback('error')
        } finally {
            e.target.value = ""
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-card w-full max-w-sm p-6 relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">الماسح الذكي</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {showNotFound ? (
                            <div className="space-y-6 text-center py-4">
                                <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mx-auto">
                                    <Camera className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-2">عذراً، هذه القطعة غير مسجلة</h3>
                                    <p className="text-slate-400 text-sm">هل تريد طلب توفيرها وتصويرها للإدارة؟</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button className="bg-primary hover:bg-primary/80" onClick={() => {
                                        onClose()
                                        if (onRequestProduct) onRequestProduct()
                                    }}>
                                        تصوير وطلب المنتج
                                    </Button>
                                    <Button variant="ghost" onClick={() => {
                                        setShowNotFound(false)
                                        setLastScanned("")
                                    }}>
                                        حاول مرة أخرى
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative aspect-[3/4] sm:aspect-video overflow-hidden rounded-2xl bg-black border border-white/10">
                                    <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />
                                    <div className="absolute inset-0 border-2 border-primary/50 m-6 rounded-lg pointer-events-none">
                                        <div className="absolute inset-0 animate-pulse bg-primary/5 text-center flex items-end justify-center pb-2">
                                            <span className="text-[10px] text-primary/50 uppercase tracking-widest">Bar-code Guide</span>
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 text-center">
                                            <p className="text-red-400 text-sm">{error}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="glass"
                                        className="gap-2 h-12"
                                        onClick={() => document.getElementById("file-upload")?.click()}
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span>من المعرض</span>
                                    </Button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <Button
                                        variant={isFlashOn ? "default" : "glass"}
                                        className="gap-2 h-12"
                                        onClick={toggleFlash}
                                    >
                                        <Zap className={`w-4 h-4 ${isFlashOn ? "fill-current" : ""}`} />
                                        <span>فلاش</span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
