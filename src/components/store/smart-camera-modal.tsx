"use client"

import React, { useRef, useState, useEffect } from "react"
import { X, Camera, Zap, Image as ImageIcon, Sparkles, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { toast } from "sonner"
import Image from "next/image"
import { analyzeImageWithGemini } from "@/lib/gemini"

interface SmartCameraModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function SmartCameraModal({ isOpen, onClose }: SmartCameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const { storeSettings } = useStore()
    const [analysisResult, setAnalysisResult] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            startCamera()
        } else {
            stopCamera()
            setCapturedImage(null)
            setAnalysisResult(null)
            setIsAnalyzing(false)
        }
    }, [isOpen])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Camera access denied:", err)
            toast.error("لا يمكن الوصول للكاميرا")
            onClose()
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    const captureImage = () => {
        if (!videoRef.current) return

        const canvas = document.createElement("canvas")
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0)
            const image = canvas.toDataURL("image/jpeg")
            setCapturedImage(image)
            analyzeImage(image)
        }
    }



    // ... inside component

    const analyzeImage = async (imageBase64: string) => {
        setIsAnalyzing(true)
        setAnalysisResult(null) // Reset previous result

        // Check if API Key exists
        if (!storeSettings.googleGeminiApiKey) {
            setTimeout(() => {
                setIsAnalyzing(false)
                setAnalysisResult("NO_KEY")
            }, 1000)
            return
        }

        try {
            const result = await analyzeImageWithGemini(
                storeSettings.googleGeminiApiKey,
                imageBase64,
                storeSettings.geminiCustomPrompt,
                storeSettings.geminiReferenceImageUrl
            )
            setAnalysisResult(JSON.stringify(result))
        } catch (error) {
            console.error("Analysis Failed:", error)
            toast.error("حدث خطأ أثناء المحاولة، تأكد من صحة المفتاح")
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black flex flex-col"
                >
                    {/* Header */}
                    <div className="absolute top-0 inset-x-0 p-4 pt-12 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-black/20 text-white backdrop-blur-md">
                            <X className="w-6 h-6" />
                        </Button>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 rounded-full backdrop-blur-md border border-white/10">
                            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span className="text-sm font-bold text-white">المساعد الذكي</span>
                        </div>
                        <div className="w-10" /> {/* Spacer */}
                    </div>

                    {/* Camera/Image View */}
                    <div className="flex-1 relative overflow-hidden bg-black">
                        {!capturedImage ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0">
                                <Image src={capturedImage} alt="Captured" fill className="object-cover" />
                            </div>
                        )}

                        {/* Scanner Overlay */}
                        {!capturedImage && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-purple-500 rounded-tl-xl" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-purple-500 rounded-tr-xl" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-purple-500 rounded-bl-xl" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-purple-500 rounded-br-xl" />
                                    <div className="absolute inset-0 bg-purple-500/10 animate-pulse rounded-3xl" />
                                </div>
                                <p className="absolute bottom-32 text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                                    وجه الكاميرا نحو السيارة أو القطعة
                                </p>
                            </div>
                        )}

                        {/* Analysis Overlay */}
                        {isAnalyzing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                                <div className="w-20 h-20 relative">
                                    <div className="absolute inset-0 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin" />
                                    <div className="absolute inset-2 border-4 border-t-transparent border-r-blue-500 border-b-transparent border-l-blue-500 rounded-full animate-spin reverse" />
                                    <Sparkles className="absolute inset-0 m-auto text-white w-8 h-8 animate-pulse" />
                                </div>
                                <p className="mt-4 text-white font-bold text-lg animate-pulse">جاري تحليل الصورة...</p>
                            </div>
                        )}

                        {/* Result Overlay: No Key (Feature Locked) */}
                        {analysisResult === "NO_KEY" && (
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-slate-900/90 backdrop-blur-xl rounded-t-[32px] border-t border-white/10 z-30 space-y-4">
                                <div className="flex items-center gap-3 text-amber-500 mb-2">
                                    <Sparkles className="w-8 h-8" />
                                    <h3 className="text-xl font-bold text-white">ميزة حصرية 🔒</h3>
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                    خدمة المساعد الذكي تتطلب تفعيلاً خاصاً. يرجى التواصل مع الإدارة لفتح هذه الميزة والاستمتاع بتحليل صور المنتجات والسيارات ذكياً.
                                </p>
                                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold h-12 rounded-xl" onClick={onClose}>
                                    حسناً، فهمت
                                </Button>
                            </div>
                        )}

                        {/* Result Overlay: Real Success */}
                        {analysisResult && analysisResult !== "NO_KEY" && (
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-slate-900/90 backdrop-blur-xl rounded-t-[32px] border-t border-white/10 z-30 space-y-4">
                                <div className="flex items-center gap-3 text-emerald-500 mb-2">
                                    <Sparkles className="w-8 h-8" />
                                    <h3 className="text-xl font-bold text-white">تم التحليل بنجاح!</h3>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <h4 className="text-white font-bold text-lg mb-1">{JSON.parse(analysisResult).title}</h4>
                                    <p className="text-slate-400 text-sm">{JSON.parse(analysisResult).description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button className="w-full bg-primary text-white font-bold h-12 rounded-xl" onClick={() => {
                                        // TODO: Implement Search Logic
                                        toast.info("جاري البحث في المتجر...")
                                    }}>
                                        بحث في المتجر
                                    </Button>
                                    <Button className="w-full bg-slate-800 text-white font-bold h-12 rounded-xl border border-white/10 hover:bg-slate-700" onClick={() => {
                                        setCapturedImage(null)
                                        setAnalysisResult(null)
                                    }}>
                                        تصوير مرة أخرى
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Capture Button */}
                    {!capturedImage && (
                        <div className="p-8 pb-12 bg-black flex justify-center items-center">
                            <button
                                onClick={captureImage}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group"
                            >
                                <div className="w-16 h-16 bg-white rounded-full group-hover:scale-95 transition-transform" />
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
