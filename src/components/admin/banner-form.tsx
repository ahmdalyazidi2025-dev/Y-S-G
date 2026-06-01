"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Plus, Image as ImageIcon, Camera, Type, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useStore, Banner } from "@/context/store-context"
import { compressImage } from "@/lib/image-utils"
import { getFontClass } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BannerFormProps {
    isOpen: boolean
    onClose: () => void
    initialBanner?: Banner | null
}

export function AdminBannerForm({ isOpen, onClose, initialBanner }: BannerFormProps) {
    const { addBanner, updateBanner } = useStore()
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
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")

    // Prefill form in edit mode
    React.useEffect(() => {
        if (!isOpen) return
        if (initialBanner) {
            setImage(initialBanner.image || "")
            setTitle(initialBanner.title || "")
            setDescription(initialBanner.description || "")
            setTextColor(initialBanner.textColor || "#ffffff")
            setFontFamily(initialBanner.fontFamily || "Cairo")
            setShowText(!!(initialBanner.title || initialBanner.description))
        } else {
            setImage("")
            setTitle("")
            setDescription("")
            setTextColor("#ffffff")
            setFontFamily("Cairo")
            setShowText(false)
        }
    }, [initialBanner, isOpen])

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

        const bannerData = {
            image,
            active: initialBanner ? initialBanner.active : true,
            title: showText ? title : "",
            description: showText ? description : "",
            textColor: showText ? textColor : "#ffffff",
            fontFamily: showText ? fontFamily : "Cairo"
        }

        if (initialBanner && initialBanner.id) {
            updateBanner(initialBanner.id, bannerData)
        } else {
            addBanner(bannerData)
        }

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
                        className="bg-white dark:bg-[#1c2a36] w-full max-w-5xl p-6 rounded-[32px] border border-slate-200 dark:border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh] space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {initialBanner ? "تعديل صورة العرض" : "إضافة صورة عرض جديدة"}
                            </h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Split Layout Container */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-right">
                            
                            {/* RIGHT COLUMN: The Interactive Store Mockup Preview (العرض في اليمين) */}
                            <div className="lg:col-span-5 xl:col-span-6 space-y-4 flex flex-col items-center">
                                <div className="flex items-center justify-between w-full">
                                    <Label className="text-slate-900 dark:text-white text-xs pr-1 font-bold">👀 معاينة العميل الحقيقية للمتجر:</Label>
                                    <div className="flex gap-1.5 bg-slate-100 dark:bg-black/25 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode("desktop")}
                                            className={cn(
                                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1",
                                                previewMode === "desktop"
                                                    ? "bg-white dark:bg-[#1c2a36] text-primary shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            )}
                                        >
                                            💻 كمبيوتر
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewMode("mobile")}
                                            className={cn(
                                                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1",
                                                previewMode === "mobile"
                                                    ? "bg-white dark:bg-[#1c2a36] text-primary shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            )}
                                        >
                                            📱 جوال
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-black/15 rounded-[24px] border border-slate-200/50 dark:border-white/5 w-full overflow-hidden transition-all duration-300">
                                    {image ? (
                                        previewMode === "mobile" ? (
                                            /* Phone Mockup outline containing simulated store home screen */
                                            <div className="w-[280px] bg-slate-950 rounded-[2.5rem] p-3 shadow-2xl relative border-4 border-slate-800 flex flex-col justify-between shrink-0">
                                                {/* Speaker Notch */}
                                                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-black rounded-full z-30" />
                                                
                                                {/* Mobile Store screen */}
                                                <div className="w-full rounded-[1.8rem] overflow-hidden bg-slate-900 border border-slate-850 flex flex-col relative text-[8px]">
                                                    {/* Banner Image */}
                                                    <div className="relative w-full aspect-[2/1] overflow-hidden">
                                                        <Image
                                                            src={image}
                                                            alt="Mobile Preview"
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/30 to-transparent" />
                                                        
                                                        {showText && (
                                                            <div className="absolute inset-0 flex flex-col justify-end pb-1.5 px-2.5 text-right">
                                                                <h4 
                                                                    className={cn("text-[9px] font-black leading-tight mb-0.5", getFontClass(fontFamily))}
                                                                    style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                                                                >
                                                                    {title || "عنوان البانر الرئيسي"}
                                                                </h4>
                                                                <p 
                                                                    className={cn("text-[6.5px] font-medium opacity-90 line-clamp-1", getFontClass(fontFamily))}
                                                                    style={{ color: textColor, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                                                >
                                                                    {description || "تفاصيل العرض الترويجي تظهر هنا..."}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Simulated Categories (أيقونات الأقسام) */}
                                                    <div className="p-2 space-y-1 border-t border-white/5 text-right">
                                                        <span className="text-[7px] text-slate-400 font-bold block">الأقسام الرئيسية</span>
                                                        <div className="flex gap-2 justify-end">
                                                            <div className="flex flex-col items-center gap-0.5"><div className="w-6 h-6 rounded-full bg-slate-850 flex items-center justify-center text-[10px]">🛢️</div><span className="text-[5.5px] text-slate-350">زيوت</span></div>
                                                            <div className="flex flex-col items-center gap-0.5"><div className="w-6 h-6 rounded-full bg-slate-850 flex items-center justify-center text-[10px]">⚙️</div><span className="text-[5.5px] text-slate-350">فلاتر</span></div>
                                                            <div className="flex flex-col items-center gap-0.5"><div className="w-6 h-6 rounded-full bg-slate-850 flex items-center justify-center text-[10px]">🔋</div><span className="text-[5.5px] text-slate-350">بطاريات</span></div>
                                                        </div>
                                                    </div>

                                                    {/* Simulated Products Grid (أيقونات المنتجات) */}
                                                    <div className="p-2 pt-0 space-y-1 text-right">
                                                        <span className="text-[7px] text-slate-400 font-bold block">العروض المميزة</span>
                                                        <div className="grid grid-cols-2 gap-1.5">
                                                            <div className="bg-slate-850 p-1 rounded-lg border border-white/5 space-y-1 flex flex-col justify-between">
                                                                <div className="w-full h-8 bg-slate-800 rounded flex items-center justify-center text-xs">🛢️</div>
                                                                <span className="text-[5.5px] text-slate-300 font-bold block truncate">زيت شل هيلكس</span>
                                                                <span className="text-[6px] text-emerald-450 font-black block">55 ر.س</span>
                                                            </div>
                                                            <div className="bg-slate-850 p-1 rounded-lg border border-white/5 space-y-1 flex flex-col justify-between">
                                                                <div className="w-full h-8 bg-slate-800 rounded flex items-center justify-center text-xs">⚙️</div>
                                                                <span className="text-[5.5px] text-slate-300 font-bold block truncate">فلتر فورد أصلي</span>
                                                                <span className="text-[6px] text-emerald-450 font-black block">95 ر.س</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Desktop Monitor Mockup containing simulated store homepage */
                                            <div className="w-full max-w-lg bg-[#2c353f] rounded-[1.8rem] p-2.5 shadow-2xl relative border border-slate-700 flex flex-col items-center transition-all duration-300">
                                                {/* Screen Container */}
                                                <div className="w-full rounded-[1.2rem] overflow-hidden bg-slate-900 border border-slate-950 flex flex-col text-[9px]">
                                                    {/* Desktop aspect banner */}
                                                    <div className="relative w-full aspect-[3.2/1] overflow-hidden">
                                                        <Image
                                                            src={image}
                                                            alt="Desktop Preview"
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/30 to-transparent" />
                                                        
                                                        {/* Shaded Crop Areas for Mobile representation */}
                                                        <div className="absolute inset-y-0 left-0 w-[18%] bg-black/60 border-r border-dashed border-red-500/50 flex items-center justify-center text-[5.5px] text-red-400 font-bold z-10 select-none">
                                                            مقصوف بالجوال ✂️
                                                        </div>
                                                        <div className="absolute inset-y-0 right-0 w-[18%] bg-black/60 border-l border-dashed border-red-500/50 flex items-center justify-center text-[5.5px] text-red-400 font-bold z-10 select-none">
                                                            مقصوف بالجوال ✂️
                                                        </div>
                                                        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500/90 text-white text-[5px] font-black rounded-full z-10 select-none tracking-wider">
                                                            📱 المنطقة الآمنة والظاهرة على الجوال (Safe Zone)
                                                        </div>

                                                        {showText && (
                                                            <div className="absolute inset-0 flex flex-col justify-end pb-2 px-[20%] text-right z-20">
                                                                <h3 
                                                                    className={cn("text-xs font-black leading-tight mb-0.5", getFontClass(fontFamily))}
                                                                    style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                                                                >
                                                                    {title || "عنوان البانر الرئيسي"}
                                                                </h3>
                                                                <p 
                                                                    className={cn("text-[7.5px] font-medium opacity-90 line-clamp-1", getFontClass(fontFamily))}
                                                                    style={{ color: textColor, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                                                >
                                                                    {description || "تفاصيل العرض الترويجي تظهر هنا..."}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Desktop categories */}
                                                    <div className="p-3 space-y-1.5 border-t border-white/5 text-right">
                                                        <span className="text-[7.5px] text-slate-400 font-bold block">تصفح الأقسام الرئيسية</span>
                                                        <div className="flex gap-4 justify-end">
                                                            <div className="flex flex-col items-center gap-0.5"><div className="w-7 h-7 rounded-full bg-slate-850 flex items-center justify-center text-xs">🛢️</div><span className="text-[6px] text-slate-350">زيوت المحركات</span></div>
                                                            <div className="flex flex-col items-center gap-0.5"><div className="w-7 h-7 rounded-full bg-slate-850 flex items-center justify-center text-xs">⚙️</div><span className="text-[6px] text-slate-350">فلاتر الهواء</span></div>
                                                            <div className="flex flex-col items-center gap-0.5"><div className="w-7 h-7 rounded-full bg-slate-850 flex items-center justify-center text-xs">🔋</div><span className="text-[6px] text-slate-350">بطاريات سيارات</span></div>
                                                            <div className="flex flex-col items-center gap-0.5"><div className="w-7 h-7 rounded-full bg-slate-850 flex items-center justify-center text-xs">🔧</div><span className="text-[6px] text-slate-350">قطع غيار قطعية</span></div>
                                                        </div>
                                                    </div>

                                                    {/* Desktop Products */}
                                                    <div className="p-3 pt-0 space-y-1.5 text-right">
                                                        <span className="text-[7.5px] text-slate-400 font-bold block">العروض والخصومات المميزة</span>
                                                        <div className="grid grid-cols-3 gap-2.5">
                                                            <div className="bg-slate-850 p-1.5 rounded-lg border border-white/5 space-y-1 flex flex-col justify-between">
                                                                <div className="w-full h-10 bg-slate-800 rounded flex items-center justify-center text-sm">🛢️</div>
                                                                <span className="text-[6px] text-slate-300 font-bold block truncate">زيت تويوتا 5W30</span>
                                                                <span className="text-[6px] text-emerald-450 font-black block">65 ر.س</span>
                                                            </div>
                                                            <div className="bg-slate-850 p-1.5 rounded-lg border border-white/5 space-y-1 flex flex-col justify-between">
                                                                <div className="w-full h-10 bg-slate-800 rounded flex items-center justify-center text-sm">⚙️</div>
                                                                <span className="text-[6px] text-slate-300 font-bold block truncate">فلتر مكيف نيسان</span>
                                                                <span className="text-[6px] text-emerald-450 font-black block">75 ر.س</span>
                                                            </div>
                                                            <div className="bg-slate-850 p-1.5 rounded-lg border border-white/5 space-y-1 flex flex-col justify-between">
                                                                <div className="w-full h-10 bg-slate-800 rounded flex items-center justify-center text-sm">🔋</div>
                                                                <span className="text-[6px] text-slate-300 font-bold block truncate">بطارية هانكوك</span>
                                                                <span className="text-[6px] text-emerald-450 font-black block">280 ر.س</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Monitor Stem Base */}
                                                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-slate-600 rounded-b-md" />
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center p-8 space-y-2">
                                            <span className="text-4xl text-slate-400">🖼️</span>
                                            <p className="text-xs text-slate-500 font-medium">قم بتحميل الصورة لتشغيل شاشة المحاكاة التفاعلية</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* LEFT COLUMN: Customized Controls & Settings (التعديلات في اليسار) */}
                            <div className="lg:col-span-7 xl:col-span-6 space-y-5">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />

                                    {/* Image Upload Area */}
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 block">صورة البانر الإعلاني</Label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-[3.2/1] bg-slate-100/70 dark:bg-black/20 rounded-2xl border border-slate-300 dark:border-white/5 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-slate-200/50 dark:hover:bg-black/30 cursor-pointer transition-all group overflow-hidden relative"
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
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        {isLoading ? "جاري المعالجة..." : "انقر لتحميل صورة العرض (1200x400)"}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Toggle text customization */}
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-150 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${showText ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                                <Type className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">تفعيل نصوص وكتابة فوق البانر</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">إضافة نصوص تفاعلية بألوان وخطوط مخصصة</span>
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
                                        <div className="space-y-4 pt-2 border-t border-slate-150 dark:border-white/5">
                                            <div className="space-y-1.5">
                                                <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 block">العنوان الرئيسي للبانر</Label>
                                                <Input
                                                    placeholder="أدخل عنواناً جذاباً (مثال: تخفيضات الصيف الكبرى)"
                                                    className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-12 rounded-xl text-right text-slate-800 dark:text-white focus:ring-primary/50"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    required={showText}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 block">الوصف الفرعي</Label>
                                                <Input
                                                    placeholder="أدخل تفاصيل العرض (مثال: خصم يصل إلى 50% على الملابس)"
                                                    className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-12 rounded-xl text-right text-slate-800 dark:text-white focus:ring-primary/50"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 block">لون النص</Label>
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
                                                    <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 block">نوع الخط العربي</Label>
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
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <Button
                                            type="submit"
                                            disabled={!image || isLoading}
                                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl gap-3 shadow-xl shadow-primary/20 text-lg font-bold transition-all active:scale-[0.98] cursor-pointer"
                                        >
                                            <Sparkles className="w-6 h-6 animate-pulse" />
                                            <span>{initialBanner ? "حفظ التعديلات" : "نشر صورة العرض"}</span>
                                        </Button>
                                    </div>
                                </form>
                            </div>
                            
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
