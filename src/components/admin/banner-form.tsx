"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Plus, Image as ImageIcon, Camera, Type, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useStore } from "@/context/store-context"
import { compressImage } from "@/lib/image-utils"
import { getFontClass } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BannerFormProps {
    isOpen: boolean
    onClose: () => void
}

export function AdminBannerForm({ isOpen, onClose }: BannerFormProps) {
    const { addBanner } = useStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // States
    const [image, setImage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    
    // Custom Text and Styling States
    const [showText, setShowText] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [textColor, setTextColor] = useState("#ffffff")
    const [fontFamily, setFontFamily] = useState("Cairo")

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("يرجى اختيار ملف صورة صحيح")
            return
        }

        try {
            setIsLoading(true)
            const compressedBase64 = await compressImage(file)
            setImage(compressedBase64)
            toast.success("تم تحميل الصورة بنجاح")
        } catch (error) {
            console.error("Compression error:", error)
            toast.error("حدث خطأ أثناء معالجة الصورة")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!image) {
            toast.error("يرجى اختيار صورة أولاً")
            return
        }

        addBanner({
            image,
            active: true,
            title: showText ? title : "",
            description: showText ? description : "",
            textColor: showText ? textColor : "#ffffff",
            fontFamily: showText ? fontFamily : "Cairo"
        })

        // Reset states
        setImage("")
        setTitle("")
        setDescription("")
        setTextColor("#ffffff")
        setFontFamily("Cairo")
        setShowText(false)
        
        onClose()
        toast.success("تم نشر البانر الإعلاني بنجاح! 🚀")
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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white dark:bg-[#1c2a36] w-full max-w-xl p-6 rounded-[32px] border border-slate-200 dark:border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh] space-y-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">إضافة صورة عرض جديدة</h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {/* Image Upload Area */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-[3/1] bg-slate-100/70 dark:bg-black/20 rounded-2xl border border-slate-300 dark:border-white/5 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-slate-200/50 dark:hover:bg-black/30 cursor-pointer transition-all group overflow-hidden relative"
                            >
                                {image ? (
                                    <>
                                        <Image
                                            src={image}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {isLoading ? "جاري المعالجة..." : "انقر لتحميل الصورة (1200x400)"}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Live Interactive Preview */}
                            {image && (
                                <div className="space-y-2">
                                    <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full font-bold">👀 معاينة البانر الإعلاني الحية:</Label>
                                    <div className="relative aspect-[3/1] w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10">
                                        <Image
                                            src={image}
                                            alt="Live Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/35 to-transparent" />
                                        
                                        {showText && (
                                            <div className="absolute inset-0 flex flex-col justify-end pb-3 px-4 text-right">
                                                <h3 
                                                    className={cn("text-xs sm:text-base font-black leading-tight mb-0.5", getFontClass(fontFamily))}
                                                    style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                                                >
                                                    {title || "عنوان البانر الرئيسي"}
                                                </h3>
                                                <p 
                                                    className={cn("text-[8px] sm:text-[10px] font-medium opacity-90 line-clamp-1", getFontClass(fontFamily))}
                                                    style={{ color: textColor, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                                >
                                                    {description || "تفاصيل العرض الترويجي تظهر هنا..."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Toggle text customization */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-150 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${showText ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                        <Type className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">إضافة نصوص تفاعلية فوق البانر</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">إضافة نصوص وعناوين بخصائص متحركة ومخصصة</span>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setShowText(!showText)}
                                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${showText ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${showText ? 'left-1' : 'left-6'}`} />
                                </div>
                            </div>

                            {/* Customizer Settings Form */}
                            {showText && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="space-y-4 pt-2 border-t border-slate-250 dark:border-white/5"
                                >
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">العنوان الرئيسي للبانر</Label>
                                        <Input
                                            placeholder="أدخل عنواناً جذاباً (مثال: تخفيضات الصيف الكبرى)"
                                            className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-12 rounded-xl text-right text-slate-800 dark:text-white focus:ring-primary/50"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required={showText}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">الوصف الفرعي</Label>
                                        <Input
                                            placeholder="أدخل تفاصيل العرض (مثال: خصم يصل إلى 50% على الملابس)"
                                            className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-12 rounded-xl text-right text-slate-800 dark:text-white focus:ring-primary/50"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">لون النص</Label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    type="color"
                                                    className="w-12 h-12 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer bg-transparent"
                                                    value={textColor}
                                                    onChange={(e) => setTextColor(e.target.value)}
                                                />
                                                <Input
                                                    type="text"
                                                    className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-12 rounded-xl text-center text-slate-850 dark:text-white font-mono flex-1 text-xs"
                                                    value={textColor}
                                                    onChange={(e) => setTextColor(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">نوع الخط العربي</Label>
                                            <select
                                                value={fontFamily}
                                                onChange={(e) => setFontFamily(e.target.value)}
                                                className="w-full bg-slate-100/70 dark:bg-black/20 border border-slate-200 dark:border-white/10 h-12 rounded-xl text-right text-slate-800 dark:text-white px-4 outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                <option value="Cairo">Cairo (خط متناسق وحديث)</option>
                                                <option value="Tajawal">Tajawal (خط أنيق ناعم)</option>
                                                <option value="Readex Pro">Readex Pro (خط مستقبلي مسطح)</option>
                                                <option value="Amiri">Amiri (خط عربي كلاسيكي فاخر)</option>
                                                <option value="Changa">Changa (خط عريض وجريء)</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={!image || isLoading}
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl gap-3 shadow-xl shadow-primary/20 text-lg font-bold transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <Sparkles className="w-6 h-6 animate-pulse" />
                                    <span>نشر صورة العرض</span>
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
