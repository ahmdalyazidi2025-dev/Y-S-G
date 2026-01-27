"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Plus, Image as ImageIcon, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { compressImage } from "@/lib/image-utils"
import { toast } from "sonner"

interface BannerFormProps {
    isOpen: boolean
    onClose: () => void
}

export function AdminBannerForm({ isOpen, onClose }: BannerFormProps) {
    const { addBanner } = useStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [image, setImage] = useState("")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // NEW: Visual Editor State
    const [showTextOverlay, setShowTextOverlay] = useState(true)
    const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile")

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("يرجى اختيار ملف صورة صحيح (JPEG, PNG, WEBP)")
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("حجم الصورة كبير جداً (يجب أن تكون أقل من 2 ميجابايت)")
            return
        }

        try {
            setIsLoading(true)
            const compressedBase64 = await compressImage(file)

            if (!compressedBase64 || !compressedBase64.startsWith('data:image')) {
                throw new Error("Invalid image data")
            }

            setImage(compressedBase64)
            toast.success("تم تجهيز الصورة للنشر")
        } catch (error) {
            console.error("Compression error:", error)
            toast.error("حدث خطأ أثناء معالجة الصورة. حاول بصورة أخرى.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!image) {
            toast.error("يرجى اختيار صورة أولاً")
            return
        }

        try {
            setIsLoading(true)
            await addBanner({
                image,
                active: true,
                title: showTextOverlay ? title || "" : "",
                description: showTextOverlay ? description || "" : ""
            })
            // Reset
            setImage("")
            setTitle("")
            setDescription("")
            setShowTextOverlay(true)
            onClose()
        } catch (error) {
            console.error("Upload error:", error)
        } finally {
            setIsLoading(false)
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
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-[#1c2a36] w-full max-w-4xl p-6 rounded-[32px] border border-white/10 relative shadow-2xl overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh]"
                    >
                        {/* LEFT SIDE: PREVIEW */}
                        <div className="flex-1 flex flex-col bg-black/20 rounded-2xl p-4 border border-white/5 order-2 md:order-1">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-primary" />
                                    معاينة حية للمستخدم
                                </h3>
                                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                    <button
                                        onClick={() => setDeviceMode("mobile")}
                                        className={`p-1.5 rounded-md transition-all ${deviceMode === 'mobile' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                                        title="معاينة الجوال"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => setDeviceMode("desktop")}
                                        className={`p-1.5 rounded-md transition-all ${deviceMode === 'desktop' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
                                        title="معاينة التابلت/الكمبيوتر"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* DEVICE FRAME */}
                            <div className="flex-1 flex items-center justify-center bg-black/20 rounded-xl overflow-hidden relative border border-white/5 pattern-grid-lg">
                                <div
                                    className={`transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden relative border-4 border-[#333] ${deviceMode === 'mobile' ? 'w-[320px] h-[600px] rounded-[30px]' : 'w-full aspect-video rounded-xl'}`}
                                >
                                    {/* Mock App Header */}
                                    <div className="h-14 bg-white border-b flex items-center px-4 justify-between">
                                        <div className="w-6 h-6 rounded-full bg-slate-200" />
                                        <div className="w-24 h-4 rounded-full bg-slate-100" />
                                        <div className="w-6 h-6 rounded-full bg-slate-200" />
                                    </div>

                                    {/* Mock Content */}
                                    <div className="p-4 space-y-4 bg-slate-50 h-full overflow-y-auto hide-scrollbar">
                                        {/* BANNER PREVIEW */}
                                        <div className="w-full relative rounded-2xl overflow-hidden shadow-lg aspect-[2.5/1] group">
                                            {image ? (
                                                <Image
                                                    src={image}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                                                    مكان البانر
                                                </div>
                                            )}

                                            {/* TEXT OVERLAY */}
                                            {showTextOverlay && (image || title) && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                                                    <h3 className="font-bold text-lg leading-tight mb-1">{title || "عنوان البانر"}</h3>
                                                    <p className="text-xs text-white/80 line-clamp-2">{description || "وصف البانر يظهر هنا..."}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Mock Products */}
                                        <div className="grid grid-cols-2 gap-3 opacity-50">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="aspect-square bg-white rounded-xl border" />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mock Notch (Mobile Only) */}
                                    {deviceMode === 'mobile' && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#333] rounded-b-xl" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE: CONTROLS */}
                        <div className="w-full md:w-[350px] flex flex-col order-1 md:order-2 h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">محرر البانرات</h2>
                                <button onClick={onClose} className="p-2 -ml-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
                                {/* UPLOAD AREA */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`aspect-[2.5/1] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-white/5 ${image ? 'border-primary/50 bg-primary/10' : 'border-white/10 bg-black/20'}`}
                                >
                                    {image ? (
                                        <div className="flex flex-col items-center text-primary">
                                            <Camera className="w-8 h-8 mb-2" />
                                            <span className="text-xs font-bold">تغيير الصورة</span>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-400">اختر صورة (1200x400)</span>
                                        </>
                                    )}
                                </div>

                                {/* OPTIONS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${showTextOverlay ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">إظهار النصوص</span>
                                                <span className="text-[10px] text-slate-400">الكتابة فوق الصورة</span>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setShowTextOverlay(!showTextOverlay)}
                                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${showTextOverlay ? 'bg-primary' : 'bg-slate-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showTextOverlay ? 'translate-x-full' : ''}`} />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {showTextOverlay && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="space-y-4 overflow-hidden"
                                            >
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400">العنوان الرئيسي</label>
                                                    <input
                                                        type="text"
                                                        placeholder="عرض خاص!"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                        className="w-full h-12 bg-black/20 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary transition-all"
                                                        maxLength={40}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400">الوصف الفرعي</label>
                                                    <textarea
                                                        placeholder="تفاصيل العرض..."
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        className="w-full h-20 pt-3 bg-black/20 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary transition-all resize-none"
                                                        maxLength={100}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="mt-auto pt-4">
                                    <Button
                                        type="submit"
                                        disabled={!image || isLoading}
                                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 font-bold"
                                    >
                                        {isLoading ? (
                                            "جاري النشر..."
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" />
                                                نشر البانر
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
