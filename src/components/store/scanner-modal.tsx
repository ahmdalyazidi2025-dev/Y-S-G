"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library"
import { Button } from "@/components/ui/button"
import { X, ImageIcon, Zap, AlertTriangle, Layers } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/context/store-context"
import { hapticFeedback } from "@/lib/haptics"
import { extractBarcodeAI } from "@/app/actions/ai"

interface ScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onRequestProduct?: () => void
    onScan?: (code: string) => void
}

export default function ScannerModal({ isOpen, onClose, onRequestProduct, onScan }: ScannerModalProps) {
    const { scanProduct, storeSettings, addToCart } = useStore()
    const [error, setError] = useState<string | null>(null)
    const [isFlashOn, setIsFlashOn] = useState(false)
    const [isBatchMode, setIsBatchMode] = useState(false)
    const [showNotFound, setShowNotFound] = useState(false)
    const [lastScanned, setLastScanned] = useState("")
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])

    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    const playBeep = (type: 'success' | 'error') => {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } else {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        }
    };

    const stopCamera = useCallback(async () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset()
            codeReaderRef.current = null
            setIsFlashOn(false)
        }
    }, [])

    const handleScanResult = useCallback((decodedText: string) => {
        if (decodedText === lastScanned) return

        setTimeout(() => setLastScanned(""), 2000)
        setLastScanned(decodedText)

        if (onScan) {
            hapticFeedback('medium')
            playBeep('success')
            onScan(decodedText)
            if (!isBatchMode) onClose()
            else toast.success("تم مسح الباركود")
            return
        }

        const product = scanProduct(decodedText)
        if (product) {
            hapticFeedback('medium')
            playBeep('success')

            if (isBatchMode) {
                addToCart(product)
                toast.success(`تم إضافة ${product.name} للسلة`)
            } else {
                onClose()
            }
        } else {
            if (isBatchMode) {
                playBeep('error')
                toast.error("المنتج غير موجود")
                hapticFeedback('error')
            } else {
                setShowNotFound(true)
                hapticFeedback('warning')
                stopCamera()
            }
        }
    }, [lastScanned, onScan, onClose, stopCamera, scanProduct, isBatchMode, addToCart])

    const startCamera = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const hints = new Map();
            const formats = [
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.CODE_128,
                BarcodeFormat.CODE_39,
                BarcodeFormat.UPC_A,
                BarcodeFormat.UPC_E,
                BarcodeFormat.QR_CODE,
                BarcodeFormat.DATA_MATRIX,
                BarcodeFormat.ITF,
                BarcodeFormat.RSS_14,
                BarcodeFormat.PDF_417
            ];
            hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            hints.set(DecodeHintType.TRY_HARDER, true);

            const reader = new BrowserMultiFormatReader(hints);
            codeReaderRef.current = reader;

            const devices = await reader.listVideoInputDevices();
            setVideoDevices(devices);

            if (devices.length === 0) {
                throw new Error("No video devices found");
            }

            // Select environment camera (back) if possible
            const backCam = devices.find((d: MediaDeviceInfo) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('خلفي')
            ) || devices[0];

            await reader.decodeFromVideoDevice(
                backCam.deviceId,
                videoRef.current!,
                (result) => {
                    if (result) {
                        handleScanResult(result.getText());
                    }
                }
            );

            setError(null);
        } catch (err) {
            console.error("Failed to start ZXing scanner:", err);
            setError("فشل في تشغيل الكاميرا. تأكد من منح الأذونات اللازمة.");
        }
    }, [handleScanResult])

    useEffect(() => {
        if (isOpen && !showNotFound) {
            startCamera()
        }
        return () => {
            stopCamera()
        }
    }, [isOpen, showNotFound, startCamera, stopCamera])

    const toggleFlash = async () => {
        if (!videoRef.current) return
        try {
            const stream = videoRef.current.srcObject as MediaStream
            const track = stream.getVideoTracks()[0]
            if (track && (track.getCapabilities() as any)?.torch) {
                const nextState = !isFlashOn
                // @ts-expect-error - torch is valid in Chromium but not in standard types
                await track.applyConstraints({ advanced: [{ torch: nextState }] })
                setIsFlashOn(nextState)
            } else {
                toast.error("الفلاش غير مدعوم على هذا الجهاز")
            }
        } catch (e) {
            console.error(e)
            toast.error("خطأ في تشغيل الفلاش")
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const hints = new Map();
            hints.set(DecodeHintType.TRY_HARDER, true);
            const reader = new BrowserMultiFormatReader(hints);

            // Convert file to image element
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            img.src = imageUrl;

            await new Promise((resolve) => { img.onload = resolve; });

            try {
                const result = await reader.decodeFromImageElement(img);
                handleScanResult(result.getText());
            } catch (err) {
                console.log("ZXing image scan failed, trying AI...", err);

                // Fallback to Gemini AI
                const readerBase64 = new FileReader();
                readerBase64.readAsDataURL(file);
                readerBase64.onloadend = async () => {
                    const base64data = readerBase64.result as string;

                    const validKeys = storeSettings.aiApiKeys?.filter(k => k.key && k.status !== "invalid") || []
                    if (validKeys.length === 0) {
                        toast.error("لم يتم العثور على باركود (تأكد من إضاءة الصورة)")
                        return
                    }

                    toast.info("جاري استخدام الذكاء الاصطناعي لقراءة الباركود...")
                    const aiResult = await extractBarcodeAI(
                        storeSettings.aiApiKeys || [],
                        base64data
                    )

                    if (aiResult.found && aiResult.code) {
                        toast.success("تم قراءة الباركود بالذكاء الاصطناعي!")
                        handleScanResult(aiResult.code)
                    } else {
                        toast.error("حتى الذكاء الاصطناعي لم يستطع قراءة الباركود! تأكد من وضوح الصورة")
                        hapticFeedback('error')
                    }
                }
            } finally {
                URL.revokeObjectURL(imageUrl);
            }
        } catch (err) {
            console.error(err)
            toast.error("فشل في قراءة الصورة")
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
                        <span className="text-sm font-bold text-white">ماسح الباركود الفائق</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsBatchMode(!isBatchMode)} className={`rounded-full backdrop-blur-md transition-colors ${isBatchMode ? "bg-primary text-white" : "bg-black/20 text-white"}`}>
                        <Layers className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleFlash} className="rounded-full bg-black/20 text-white backdrop-blur-md">
                        <Zap className={`w-6 h-6 ${isFlashOn ? "text-yellow-400 fill-current" : "text-white"}`} />
                    </Button>
                </div>

                {/* Batch Mode Indicator */}
                {isBatchMode && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-primary/90 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg animate-pulse border border-white/20">
                            وضع الجرد السريع (مفعل)
                        </div>
                    </div>
                )}

                {/* Scanner View */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    {/* The Video Element - ZXing uses this directly */}
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                    />

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
