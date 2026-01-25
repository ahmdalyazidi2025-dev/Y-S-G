"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { X, Camera, ImageIcon, Zap, AlertTriangle } from "lucide-react"
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
        // Give the modal a moment to render properly
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const html5QrCode = new Html5Qrcode("reader", {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                ],
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                },
                verbose: false
            })
            scannerRef.current = html5QrCode

            // Try simpler config first
            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    disableFlip: false
                },
                (decodedText) => {
                    handleScan(decodedText)
                },
                () => { }
            )
            setError(null)
        } catch (err) {
            console.error("Failed to start scanner:", err)
            // Fallback: try without explicit facingMode if environment failed
            try {
                if (scannerRef.current) {
                    await scannerRef.current.start(
                        { facingMode: "user" }, // Try front cam as fallback or just default
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => handleScan(decodedText),
                        () => { }
                    )
                    setError(null)
                }
            } catch (fallbackErr) {
                setError("فشل في تشغيل الكاميرا. تأكد من منح الأذونات اللازمة.")
                console.error(fallbackErr)
            }
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
        isOpen ? (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
                {/* Header */}
                <div className="absolute top-0 inset-x-0 p-4 pt-12 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/20 text-white backdrop-blur-md">
                        <X className="w-6 h-6" />
                    </Button>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-full backdrop-blur-md border border-white/10">
                        <Zap className={`w-4 h-4 ${isFlashOn ? "text-yellow-400 fill-current" : "text-slate-400"}`} />
                        <span className="text-sm font-bold text-white">ماسح الباركود</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={toggleFlash} className="rounded-full bg-black/20 text-white backdrop-blur-md">
                        <Zap className={`w-6 h-6 ${isFlashOn ? "text-yellow-400 fill-current" : "text-white"}`} />
                    </Button>
                </div>

                {/* Scanner View */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    {/* The Reader Element - Full Screen */}
                    <div id="reader" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

                    {/* Scanner Guide Overlay */}
                    {!showNotFound && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="w-64 h-40 border-2 border-primary/50 rounded-2xl relative bg-primary/5">
                                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[90%] h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-scan" />
                                </div>
                            </div>
                            <p className="absolute bottom-32 text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                                ضع الباركود داخل الإطار
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                            <div className="text-center p-6">
                                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <p className="text-white font-bold">{error}</p>
                                <Button onClick={() => { setError(null); startCamera(); }} className="mt-4" variant="outline">
                                    إعادة المحاولة
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Not Found / Result Overlay */}
                {showNotFound && (
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-slate-900/90 backdrop-blur-xl rounded-t-[32px] border-t border-white/10 z-30 space-y-4">
                        <div className="flex items-center gap-3 text-orange-500 mb-2">
                            <AlertTriangle className="w-8 h-8" />
                            <h3 className="text-xl font-bold text-white">القطعة غير مسجلة</h3>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                            الباركود <strong>{lastScanned}</strong> غير موجود في النظام.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <Button className="w-full bg-primary text-white font-bold h-12 rounded-xl" onClick={() => {
                                onClose()
                                if (onRequestProduct) onRequestProduct()
                            }}>
                                طلب توفير
                            </Button>
                            <Button className="w-full bg-slate-800 text-white font-bold h-12 rounded-xl border border-white/10 hover:bg-slate-700" onClick={() => {
                                setShowNotFound(false)
                                setLastScanned("")
                                startCamera()
                            }}>
                                مسح مرة أخرى
                            </Button>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                {!showNotFound && (
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20 pointer-events-none">
                        <Button
                            variant="glass"
                            className="pointer-events-auto h-12 rounded-full px-6 gap-2 bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60"
                            onClick={() => document.getElementById("file-upload")?.click()}
                        >
                            <ImageIcon className="w-5 h-5" />
                            <span>من الصور</span>
                        </Button>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>
                )}
            </div>
        ) : null
    )
}
