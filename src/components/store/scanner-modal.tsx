"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library"
import { Button } from "@/components/ui/button"
import { X, ImageIcon, Zap, AlertTriangle, Layers, ScanLine, Keyboard } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/context/store-context"
import { hapticFeedback } from "@/lib/haptics"
// import { extractBarcodeAI } from "@/app/actions/ai" // Disabled for "Radical No-AI" mode

interface ScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onRequestProduct?: () => void
    onScan?: (code: string) => void
}

// Native BarcodeDetector Interface
interface BarcodeDetector {
    detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
}
declare global {
    var BarcodeDetector: {
        new(options?: { formats: string[] }): BarcodeDetector;
        getSupportedFormats(): Promise<string[]>;
    };
}

export default function ScannerModal({ isOpen, onClose, onRequestProduct, onScan }: ScannerModalProps) {
    const { scanProduct, addToCart, storeSettings } = useStore() // Added storeSettings
    const [error, setError] = useState<string | null>(null)
    const [isFlashOn, setIsFlashOn] = useState(false)
    const [isBatchMode, setIsBatchMode] = useState(false)
    const [showNotFound, setShowNotFound] = useState(false)
    const [lastScanned, setLastScanned] = useState("")
    const [currentZoom, setCurrentZoom] = useState(1)
    const [useNative, setUseNative] = useState(false)

    // Hardware Mode State
    const [hardwareMode, setHardwareMode] = useState(false)
    const hardwareBuffer = useRef<string>("")
    const lastKeyTime = useRef<number>(0)

    const videoRef = useRef<HTMLVideoElement>(null)
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
    const nativeDetectorRef = useRef<BarcodeDetector | null>(null)
    const frameLoopRef = useRef<number>(0)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const playBeep = useCallback((type: 'success' | 'error') => {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime); // Higher pitch for professional feel
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
    }, []);

    const stopCamera = useCallback(() => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset()
            codeReaderRef.current = null
        }
        if (frameLoopRef.current) {
            cancelAnimationFrame(frameLoopRef.current)
            frameLoopRef.current = 0
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }
        setIsFlashOn(false)
    }, [])

    const handleScanResult = useCallback((decodedText: string) => {
        if (decodedText === lastScanned || !decodedText || decodedText.length < 3) return

        // Ignore common partial reads
        if (decodedText.length === 1) return;

        hapticFeedback('heavy') // Stronger feedback
        playBeep('success')

        setLastScanned(decodedText)

        // Cooldown
        setTimeout(() => setLastScanned(""), 2500)

        if (onScan) {
            onScan(decodedText)
            if (!isBatchMode) onClose()
            else toast.success(`تم مسح: ${decodedText}`)
            return
        }

        const product = scanProduct(decodedText)
        if (product) {
            if (isBatchMode) {
                addToCart(product)
                toast.success(`تم إضافة ${product.name}`)
            } else {
                onClose()
            }
        } else {
            if (isBatchMode) {
                playBeep('error')
                toast.error("غير موجود بالنظام")
            } else {
                setShowNotFound(true)
                stopCamera()
            }
        }
    }, [lastScanned, onScan, onClose, stopCamera, scanProduct, isBatchMode, addToCart, playBeep])

    // --------------------------------------------------------------------------------
    // HARDWARE SCANNER LISTENERS (Keyboard Emulation)
    // --------------------------------------------------------------------------------
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return

            // If keys come in very fast (standard scanners < 50ms)
            const now = Date.now()
            if (now - lastKeyTime.current > 100) {
                hardwareBuffer.current = "" // Reset if pause is too long
            }
            lastKeyTime.current = now

            if (e.key === "Enter") {
                if (hardwareBuffer.current.length > 2) {
                    handleScanResult(hardwareBuffer.current)
                    hardwareBuffer.current = ""
                }
            } else if (e.key.length === 1) {
                hardwareBuffer.current += e.key
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, handleScanResult])

    // --------------------------------------------------------------------------------
    // NATIVE BARCODE DETECTOR LOOP
    // --------------------------------------------------------------------------------
    const startNativeScanLoop = useCallback(() => {
        if (!nativeDetectorRef.current || !videoRef.current) return

        const scanFrame = async () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                frameLoopRef.current = requestAnimationFrame(scanFrame)
                return
            }

            try {
                const barcodes = await nativeDetectorRef.current!.detect(videoRef.current)
                if (barcodes.length > 0) {
                    handleScanResult(barcodes[0].rawValue)
                }
            } catch (err) {
                // Silently fail frame
            }
            frameLoopRef.current = requestAnimationFrame(scanFrame)
        }
        frameLoopRef.current = requestAnimationFrame(scanFrame)
    }, [handleScanResult])

    const startCamera = useCallback(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        setError(null)
        setLastScanned("")

        try {
            // 1. Check for Native Support
            let hasNativeSupport = false
            if ('BarcodeDetector' in window) {
                try {
                    const formats = await window.BarcodeDetector.getSupportedFormats()
                    if (formats.includes('code_128') || formats.includes('code_39')) {
                        nativeDetectorRef.current = new window.BarcodeDetector({
                            formats: ['code_128', 'code_39', 'ean_13', 'itf', 'data_matrix', 'qr_code']
                        });
                        hasNativeSupport = true;
                        setUseNative(true);
                    }
                } catch (e) {
                    console.log("Native detector failed init", e)
                }
            }

            // 2. Setup Video Stream (Common for both)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 }, // Full HD for precision
                    height: { ideal: 1080 },
                    focusMode: "continuous"
                } as any
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                // Wait for metadata to load to ensure dimensions are correct
                await new Promise((resolve) => {
                    videoRef.current!.onloadedmetadata = () => {
                        videoRef.current!.play().then(resolve)
                    }
                })

                // Track Setup (Zoom/Focus)
                const track = stream.getVideoTracks()[0];
                if (track) {
                    const capabilities = (track as any).getCapabilities?.() || {}
                    const advanced: any = {}

                    if (capabilities.focusMode?.includes('continuous')) advanced.focusMode = 'continuous'
                    // Apply slight zoom if supported for density
                    if (capabilities.zoom) {
                        // Default 1.5x zoom for industrial labels
                        const targetZoom = Math.min(1.5, capabilities.zoom.max || 1)
                        advanced.zoom = targetZoom
                        setCurrentZoom(targetZoom)
                    }
                    if (Object.keys(advanced).length > 0) {
                        track.applyConstraints({ advanced: [advanced] }).catch(() => { })
                    }
                }
            }

            // 3. Start Scanning Logic
            if (hasNativeSupport) {
                startNativeScanLoop()
                toast.success("تم تفعيل ماسح الأجهزة (Native Engine)")
            } else {
                // FALLBACK: ZXing
                const hints = new Map();
                const formats = [BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.EAN_13, BarcodeFormat.ITF];
                hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
                hints.set(DecodeHintType.TRY_HARDER, true);

                const reader = new BrowserMultiFormatReader(hints);
                codeReaderRef.current = reader;
                // Since we already have the stream running in the video element, pass it to ZXing
                reader.decodeFromVideoElement(videoRef.current!)
                    .then((result) => {
                        if (result) handleScanResult(result.getText())
                    })
                    .catch((err) => {
                        if (err && err.name !== 'NotFoundException') {
                            console.error("ZXing Decode Error", err)
                        }
                    })
            }

        } catch (err) {
            console.error("Camera Init Failed", err);
            setError("تعذر الوصول للكاميرا. يرجى استخدام جهاز مسح خارجي أو صورة.");
        }
    }, [handleScanResult, startNativeScanLoop])

    useEffect(() => {
        if (isOpen && !showNotFound) {
            startCamera()
        }
        return () => stopCamera()
    }, [isOpen, showNotFound, startCamera, stopCamera])

    const captureAndScanFrame = useCallback(async () => {
        if (!videoRef.current || (!nativeDetectorRef.current && !codeReaderRef.current)) return;

        hapticFeedback('light');
        toast.info("جاري التقاط صورة عالية الدقة...");

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 1920;
            canvas.height = videoRef.current.videoHeight || 1080;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Apply contrast filter for better readability
                ctx.filter = 'contrast(1.2) brightness(1.1)';
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                // 1. Try Native Detector on the captured frame
                if (nativeDetectorRef.current && 'createImageBitmap' in window) {
                    try {
                        const bitmap = await createImageBitmap(canvas);
                        const results = await nativeDetectorRef.current.detect(bitmap);
                        if (results.length > 0) {
                            handleScanResult(results[0].rawValue);
                            return;
                        }
                    } catch (e) {
                        console.log("Native frame scan failed", e);
                    }
                }

                // 2. Fallback to ZXing on the Captured Frame
                const hints = new Map();
                hints.set(DecodeHintType.TRY_HARDER, true);
                hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.EAN_13]);
                const reader = new BrowserMultiFormatReader(hints);

                try {
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const img = new Image();
                    img.src = imgData;
                    await new Promise(r => img.onload = r);
                    const result = await reader.decodeFromImageElement(img);
                    if (result) {
                        handleScanResult(result.getText());
                        return;
                    }
                } catch (e) {
                    console.log("ZXing frame scan failed");
                }

                toast.error("لم يتم العثور على باركود في الصورة الملتقطة");
            }
        } catch (e) {
            console.error("Frame capture failed", e);
        }
    }, [handleScanResult]);

    const toggleFlash = async () => {
        if (!videoRef.current) return
        try {
            const stream = videoRef.current.srcObject as MediaStream
            const track = stream.getVideoTracks()[0]
            if (track && (track.getCapabilities() as any)?.torch) {
                const nextState = !isFlashOn
                // Cast to any to access advanced torch constraint
                await (track as any).applyConstraints({ advanced: [{ torch: nextState }] })
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
            // Using Native Detector involved here too if possible
            if (nativeDetectorRef.current && 'createImageBitmap' in window) {
                const bitmap = await createImageBitmap(file)
                const results = await nativeDetectorRef.current.detect(bitmap)
                if (results.length > 0) {
                    handleScanResult(results[0].rawValue)
                    toast.success("تم قراءة الصورة بنجاح")
                    return
                }
            }

            // Fallback ZXing Logic
            const hints = new Map();
            hints.set(DecodeHintType.TRY_HARDER, true);
            const reader = new BrowserMultiFormatReader(hints);
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            img.src = imageUrl;
            await new Promise((resolve) => { img.onload = resolve; });
            const result = await reader.decodeFromImageElement(img);
            handleScanResult(result.getText());
            URL.revokeObjectURL(imageUrl);

        } catch (err) {
            toast.error("فشل قراءة الباركود من الصورة")
        } finally {
            e.target.value = ""
        }
    }

    return (
        isOpen ? (
            <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
                {/* Header */}
                <div className="absolute top-0 inset-x-0 p-4 pt-8 z-20 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/10 text-white backdrop-blur-md">
                        <X className="w-6 h-6" />
                    </Button>

                    <div className="flex flex-col items-center">
                        <span className="text-white font-bold text-lg">ماسح احترافي</span>
                        <div className="flex items-center gap-2 mt-1">
                            {useNative ? (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 rounded-full border border-green-500/20">Native API (Ultra Fast)</span>
                            ) : (
                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 rounded-full border border-yellow-500/20">Standard Engine</span>
                            )}
                            {hardwareMode && <Keyboard className="w-3 h-3 text-blue-400" />}
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => setIsBatchMode(!isBatchMode)} className={`rounded-full backdrop-blur-md transition-colors ${isBatchMode ? "bg-primary text-white" : "bg-white/10 text-white"}`}>
                        <Layers className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleFlash} className="rounded-full bg-white/10 text-white backdrop-blur-md">
                        <Zap className={`w-6 h-6 ${isFlashOn ? "text-yellow-400 fill-current" : "text-white"}`} />
                    </Button>
                </div>

                {/* Main View */}
                <div className="flex-1 relative bg-black flex flex-col">
                    <div className="relative flex-1 overflow-hidden">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

                        {/* Overlay */}
                        {!showNotFound && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                                {/* Darken outer areas */}
                                <div className="absolute inset-0 bg-black/40">
                                    {/* Cutout */}
                                    {/* Using CSS masks would be cleaner but absolute divs work for quick layout */}
                                </div>

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-[90%] h-48 border-2 border-primary/60 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br-lg" />

                                        {/* Scan Line */}
                                        <div className="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />

                                        <p className="absolute -bottom-8 inset-x-0 text-center text-white/80 text-xs font-mono">
                                            ضع الباركود داخل الإطار
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-black p-6 pb-10 flex items-center justify-around gap-4 z-20 border-t border-white/10">
                    <Button
                        variant="secondary"
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white h-12 rounded-xl gap-2"
                        onClick={() => document.getElementById("file-upload")?.click()}
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span>من صورة</span>
                    </Button>
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />

                    <Button
                        className="flex-1 bg-primary text-white h-12 rounded-xl gap-2 shadow-lg shadow-primary/20"
                        onClick={captureAndScanFrame}
                    >
                        <ScanLine className="w-4 h-4" />
                        <span>مسح دقيق (صورة)</span>
                    </Button>
                </div>

                {/* Not Found View */}
                {showNotFound && (
                    <div className="absolute bottom-0 inset-x-0 p-6 bg-[#1a1a1a] rounded-t-[32px] border-t border-white/10 z-50">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white">المنتج غير موجود</h3>
                            <p className="text-slate-400 text-sm">الباركود <span className="text-white font-mono bg-white/10 px-2 rounded py-0.5">{lastScanned}</span> غير مسجل</p>

                            <div className="flex gap-3 w-full mt-4">
                                <Button className="flex-1 bg-white/10 hover:bg-white/20 h-12 rounded-xl" onClick={() => {
                                    setShowNotFound(false)
                                    setLastScanned("")
                                    startCamera()
                                }}>
                                    مسح مجدداً
                                </Button>
                                {onRequestProduct && storeSettings.enableProductRequests !== false && (
                                    <Button className="flex-1 bg-primary h-12 rounded-xl" onClick={() => {
                                        onClose()
                                        onRequestProduct()
                                    }}>
                                        طلب توفير
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        ) : null
    )
}
