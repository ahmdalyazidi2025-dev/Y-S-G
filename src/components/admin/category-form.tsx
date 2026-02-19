"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Image as ImageIcon, Smile, PlusCircle, Plus, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Category, useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/image-utils"
import { toast } from "sonner"

interface CategoryFormProps {
    isOpen: boolean
    onClose: () => void
    initialCategory?: Category | null
}

export function AdminCategoryForm({ isOpen, onClose, initialCategory }: CategoryFormProps) {
    const { addCategory, updateCategory } = useStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [visualType, setVisualType] = useState<"image" | "icon">("icon")
    const [formData, setFormData] = useState({
        nameAr: "",
        nameEn: "",
        image: "",
        icon: "📁",
        isHidden: false,
        order: 0,
    })

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (initialCategory) {
                setFormData({
                    nameAr: initialCategory.nameAr,
                    nameEn: initialCategory.nameEn,
                    image: initialCategory.image || "",
                    icon: initialCategory.icon || "📁",
                    isHidden: initialCategory.isHidden || false,
                    order: initialCategory.order || 0,
                });
                setVisualType(initialCategory.image ? "image" : "icon");
            } else {
                setFormData({
                    nameAr: "",
                    nameEn: "",
                    image: "",
                    icon: "📁",
                    isHidden: false,
                    order: 0,
                });
                setVisualType("icon");
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [initialCategory, isOpen])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("يرجى اختيار ملف صورة صحيح")
            return
        }

        const loadingToast = toast.loading("جاري معالجة الصورة...")

        try {
            // Compress category image (Max 800px is enough for icons/cards)
            const compressedBase64 = await compressImage(file, 800, 0.8)
            setFormData(prev => ({ ...prev, image: compressedBase64 }))
            toast.dismiss(loadingToast)
            toast.success("تم رفع الصورة بنجاح")
        } catch (error) {
            console.error("Image processing error:", error)
            toast.dismiss(loadingToast)
            toast.error("فشل معالجة الصورة")
        }
        e.target.value = "" // Reset input
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const categoryData = {
            nameAr: formData.nameAr,
            nameEn: formData.nameEn,
            image: formData.image,
            icon: formData.icon,
            isHidden: formData.isHidden,
            order: Number(formData.order) || 0,
        }

        if (initialCategory) {
            updateCategory({ ...categoryData, id: initialCategory.id })
        } else {
            addCategory(categoryData as Omit<Category, "id">)
        }
        onClose()
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
                        className="bg-[#1c2a36] w-full max-w-lg p-6 rounded-[32px] border border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">{initialCategory ? "تعديل قسم" : "إضافة قسم جديد"}</h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-white text-base">حالة القسم</Label>
                                    <p className="text-xs text-slate-400">تحديد ما إذا كان القسم ظاهراً للعملاء أم مخفياً</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-xs font-bold transition-colors", !formData.isHidden ? "text-emerald-400" : "text-slate-500")}>
                                        {!formData.isHidden ? "ظاهر" : "مخفي"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isHidden: !prev.isHidden }))}
                                        className={cn(
                                            "w-12 h-6 rounded-full relative transition-colors duration-300",
                                            !formData.isHidden ? "bg-emerald-500/20" : "bg-slate-700"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 rounded-full transition-all duration-300",
                                            !formData.isHidden ? "left-1 bg-emerald-500" : "left-7 bg-slate-400"
                                        )} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs pr-1 text-right block w-full">ترتيب الظهور (رقم أصغر يظهر أولاً)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-black/20 border-white/10 h-14 rounded-2xl text-right text-white focus:ring-primary/50"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs pr-1 text-right block w-full">الاسم بالعربي</Label>
                                    <Input
                                        required
                                        placeholder="الاسم بالعربي"
                                        className="bg-black/20 border-white/10 h-14 rounded-2xl text-right text-white focus:ring-primary/50"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs pr-1 text-right block w-full">الاسم بالإنجليزي (English)</Label>
                                    <Input
                                        required
                                        placeholder="Name in English"
                                        dir="ltr"
                                        className="bg-black/20 border-white/10 h-14 rounded-2xl text-left text-white focus:ring-primary/50"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                    />
                                </div>
                            </div>


                            <div className="bg-black/20 p-1 rounded-2xl flex border border-white/10 h-14">
                                <button
                                    type="button"
                                    onClick={() => setVisualType("image")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 rounded-xl transition-all text-xs font-bold",
                                        visualType === "image" ? "bg-[#1c2a36] text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    <span>صورة</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVisualType("icon")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 rounded-xl transition-all text-xs font-bold",
                                        visualType === "icon" ? "bg-[#1c2a36] text-white shadow-lg" : "text-white"
                                    )}
                                >
                                    <Smile className="w-4 h-4" />
                                    <span>أيقونة</span>
                                </button>
                            </div>

                            {visualType === "icon" && (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Smile className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <Input
                                            placeholder="هنا (Emoji) أدخل الأيقونة"
                                            className="bg-black/20 border-white/10 h-14 rounded-2xl text-right text-white pl-12 focus:ring-primary/50"
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {visualType === "image" && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-video bg-black/20 rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-black/30 cursor-pointer transition-all group overflow-hidden relative"
                                >
                                    {formData.image ? (
                                        <>
                                            <Image
                                                src={formData.image}
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
                                                <Camera className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">تحميل صورة القسم</span>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl gap-3 shadow-xl shadow-primary/20 text-lg font-bold transition-all active:scale-[0.98]">
                                    <Plus className="w-6 h-6" />
                                    <span>{initialCategory ? "حفظ التغييرات" : "إضافة القسم"}</span>
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
