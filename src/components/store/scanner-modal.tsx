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
    const [isAiScanning, setIsAiScanning] = useState(false)
    const [currentZoom, setCurrentZoom] = useState(1)
    const autoOCRTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

    const triggerAutoOCR = useCallback(async () => {
        if (!videoRef.current || isAiScanning || showNotFound) return;

        try {
            setIsAiScanning(true);
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const base64data = canvas.toDataURL('image/jpeg', 0.8);
                const validKeys = storeSettings.aiApiKeys?.filter(k => k.key && k.status !== "invalid") || [];

                if (validKeys.length > 0) {
                    const aiResult = await extractBarcodeAI(storeSettings.aiApiKeys || [], base64data);
                    if (aiResult.found && aiResult.code) {
                        handleScanResult(aiResult.code);
                    }
                }
            }
        } catch (e) {
            console.error("Auto OCR failed", e);
        } finally {
            setIsAiScanning(false);
            // Schedule next attempt in 4 seconds if still open
            autoOCRTimeoutRef.current = setTimeout(triggerAutoOCR, 4000);
        }
    }, [isAiScanning, showNotFound, storeSettings.aiApiKeys, handleScanResult]);

    const applySmartZoom = useCallback(async (zoomLevel: number) => {
        const stream = videoRef.current?.srcObject as MediaStream;
        const track = stream?.getVideoTracks()[0];
        if (track && track.applyConstraints) {
            try {
                const capabilities = (track as any).getCapabilities?.() || {};
                if (capabilities.zoom) {
                    const target = Math.min(zoomLevel, capabilities.zoom.max || zoomLevel);
                    await track.applyConstraints({ advanced: [{ zoom: target }] } as any);
                    setCurrentZoom(target);
                }
            } catch (e) {
                console.warn("Zoom failed", e);
            }
        }
    }, []);

    const startCamera = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const hints = new Map();
            const formats = [
                BarcodeFormat.CODE_128, // Primary for automotive
                BarcodeFormat.CODE_39,  // Common for OEM
                BarcodeFormat.ITF,      // Used in logistics
                BarcodeFormat.EAN_13,
                BarcodeFormat.EAN_8,
                BarcodeFormat.UPC_A,
                BarcodeFormat.QR_CODE,
                BarcodeFormat.DATA_MATRIX
            ];
            hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            hints.set(DecodeHintType.TRY_HARDER, true); // Vital for small barcodes
            hints.set(DecodeHintType.CHARACTER_SET, 'utf-8');

            const reader = new BrowserMultiFormatReader(hints);
            codeReaderRef.current = reader;

            const devices = await reader.listVideoInputDevices();
            setVideoDevices(devices);

            if (devices.length === 0) {
                throw new Error("No video devices found");
            }

            const backCam = devices.find((d: MediaDeviceInfo) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('environment') ||
                d.label.toLowerCase().includes('خلفي')
            ) || devices[0];

            const videoConstraints: any = {
                deviceId: { exact: backCam.deviceId },
                width: { min: 640, ideal: 1920, max: 3840 },
                height: { min: 480, ideal: 1080, max: 2160 },
                facingMode: "environment",
                frameRate: { ideal: 30 }
            };

            setLastScanned(""); // Reset scanner state for clean start
            await reader.decodeFromConstraints(
                { video: videoConstraints },
                videoRef.current!,
                (result) => {
                    if (result) {
                        handleScanResult(result.getText());
                    }
                }
            );

            // 1. Auto AI Fallback (If Enabled)
            const validKeys = storeSettings.aiApiKeys?.filter(k => k.key && k.status !== "invalid") || [];
            if (validKeys.length > 0) {
                autoOCRTimeoutRef.current = setTimeout(triggerAutoOCR, 3000);
            }

            // 2. Precision Auto-Zoom (Help resolve small barcodes without user manually clicking)
            zoomTimeoutRef.current = setTimeout(() => {
                applySmartZoom(2.0); // Automatically zoom in if nothing found
            }, 3500);

            // Enable continuous focus immediately
            try {
                const stream = videoRef.current?.srcObject as MediaStream;
                const track = stream?.getVideoTracks()[0];
                if (track && track.applyConstraints) {
                    const capabilities = (track as any).getCapabilities?.() || {};
                    const advanced: any = {};
                    if (capabilities.focusMode?.includes('continuous')) advanced.focusMode = 'continuous';
                    if (Object.keys(advanced).length > 0) {
                        await track.applyConstraints({ advanced: [advanced] } as any);
                    }
                }
            } catch (e) {
                console.warn("Advanced constraints failed", e);
            }

            setError(null);
        } catch (err) {
            console.error("Failed to start ZXing scanner:", err);
            setError("فشل في تشغيل الكاميرا. تأكد من منح الأذونات اللازمة.");
        }
    }, [handleScanResult, triggerAutoOCR, storeSettings.aiApiKeys, applySmartZoom])

    useEffect(() => {
        if (isOpen && !showNotFound) {
            startCamera()
        }
        return () => {
            stopCamera()
            if (autoOCRTimeoutRef.current) clearTimeout(autoOCRTimeoutRef.current)
            if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <div className="w-72 h-48 border-2 border-primary/50 rounded-2xl relative bg-primary/5">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[90%] h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-scan" />
                                </div>
                            </div>

                            <div className="mt-8">
                                <p className="text-white/90 text-sm font-bold bg-black/60 px-8 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                                    وجه الكاميرا نحو الباركود أو رقم القطعة
                                </p>
                            </div>

                            {/* AI Scanning Status Indicator */}
                            {isAiScanning && (
                                <div className="absolute top-24 flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full backdrop-blur-sm border border-primary/20 animate-pulse">
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                    <span className="text-[10px] text-primary-foreground font-bold uppercase tracking-widest">AI Scanning</span>
                                </div>
                            )}

                            {/* Zoom Indicator */}
                            {currentZoom > 1 && (
                                <div className="absolute top-24 flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm border border-white/20">
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">{currentZoom.toFixed(1)}x Zoom</span>
                                    <button
                                        className="ml-2 pointer-events-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full hover:bg-white/40"
                                        onClick={() => applySmartZoom(1)}
                                    >
                                        إلغاء التقريب
                                    </button>
                                </div>
                            )}
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
                            className="pointer-events-auto h-12 rounded-full px-8 gap-2 bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 shadow-xl"
                            onClick={() => document.getElementById("file-upload")?.click()}
                        >
                            <ImageIcon className="w-5 h-5 text-white" />
                            <span className="text-white font-bold">من معرض الصور</span>
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
