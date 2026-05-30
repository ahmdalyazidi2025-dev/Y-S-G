"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Product, useStore } from "@/context/store-context"
import { X, Camera, Package, Hash, List, PlusCircle, Plus, ChevronDown, Trash2, Wand2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { compressImage, applyBrandingTemplate } from "@/lib/image-utils"
import { toast } from "sonner"
import ScannerModal from "@/components/store/scanner-modal"

interface ProductFormProps {
    isOpen: boolean
    onClose: () => void
    initialProduct?: Product | null
}

export function AdminProductForm({ isOpen, onClose, initialProduct }: ProductFormProps) {
    const { addProduct, updateProduct, categories } = useStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [useBranding, setUseBranding] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        unit: "حبة",
        barcode: "",
        image: "",
        images: [] as string[],
        category: "",
        pricePiece: "",
        oldPricePiece: "",
        priceDozen: "",
        oldPriceDozen: "",
        discountEndDate: "",
    })

    const [showCountdown, setShowCountdown] = useState(false)

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (initialProduct && initialProduct.id) {
                // If the product category is stored as Arabic name, map it to ID for the select input
                const matchedCategory = categories.find(c => c.nameAr === initialProduct.category);
                const categoryValue = matchedCategory ? matchedCategory.id : (initialProduct.category || "");

                setFormData({
                    name: initialProduct.name || "",
                    unit: initialProduct.unit || "حبة",
                    barcode: initialProduct.barcode || "",
                    image: initialProduct.image || "",
                    images: initialProduct.images || (initialProduct.image ? [initialProduct.image] : []),
                    category: categoryValue,
                    pricePiece: initialProduct.pricePiece?.toString() || "",
                    oldPricePiece: initialProduct.oldPricePiece?.toString() || "",
                    priceDozen: initialProduct.priceDozen?.toString() || "",
                    oldPriceDozen: initialProduct.oldPriceDozen?.toString() || "",
                    discountEndDate: initialProduct.discountEndDate ? new Date(initialProduct.discountEndDate).toISOString().slice(0, 16) : "",
                })
                setShowCountdown(!!initialProduct.discountEndDate)
            } else {
                setFormData({
                    name: "",
                    unit: "حبة",
                    barcode: "",
                    image: "",
                    images: [] as string[],
                    category: initialProduct?.category || categories[0]?.id || "",
                    pricePiece: "",
                    oldPricePiece: "",
                    priceDozen: "",
                    oldPriceDozen: "",
                    discountEndDate: "",
                })
                setShowCountdown(false)
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [initialProduct, isOpen, categories])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        try {
            const newImages: string[] = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file.type.startsWith('image/')) continue

                // 1. Apply Branding if enabled
                if (useBranding) {
                    /* Since applyBrandingTemplate returns base64 string, we need to handle it.
                       Our compressImage expects File. 
                       However, applyBrandingTemplate OUTPUTS a compressed JPEG base64 already (0.9 q).
                       So if branding is used, we might skip extra compression or Convert base64 back to file if needed.
                       Actually, let's keep it simple: if branding is used, the output IS the final image.
                    */
                    try {
                        const brandedBase64 = await applyBrandingTemplate(file)
                        newImages.push(brandedBase64)
                        continue // Skip standard compression loop for this file
                    } catch (err) {
                        console.error("Branding failed, falling back to normal compression", err)
                    }
                }

                // 2. Standard Compression (if branding skipped or disabled)
                const compressedBase64 = await compressImage(file)
                newImages.push(compressedBase64)
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages],
                // Update main image if explicitly empty or first time
                image: prev.image || newImages[0] || ""
            }))

            if (newImages.length > 0) toast.success(`تم تحميل ${newImages.length} صورة بنجاح`)
        } catch (error) {
            console.error("Compression error:", error)
            toast.error("حدث خطأ أثناء معالجة الصور")
        }
    }

    const removeImage = (indexToRemove: number) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, idx) => idx !== indexToRemove)
            return {
                ...prev,
                images: newImages,
                // If we removed the main image (visually first), update it to the next available one
                image: newImages.length > 0 ? newImages[0] : ""
            }
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const productData = {
            name: formData.name,
            price: Number(formData.pricePiece) || 0,
            pricePiece: Number(formData.pricePiece) || 0,
            oldPricePiece: formData.oldPricePiece ? Number(formData.oldPricePiece) : 0,
            priceDozen: formData.priceDozen ? Number(formData.priceDozen) : 0,
            oldPriceDozen: formData.oldPriceDozen ? Number(formData.oldPriceDozen) : 0,
            unit: formData.unit,
            barcode: formData.barcode,
            image: formData.images[0] || formData.image || "", // Prefer first image in array
            images: formData.images,
            category: formData.category,
            discountEndDate: showCountdown && formData.discountEndDate ? new Date(formData.discountEndDate) : null,
        }

        if (initialProduct && initialProduct.id) {
            updateProduct(initialProduct.id, productData as Partial<Product>)
        } else {
            addProduct(productData as Omit<Product, "id">)
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
                        className="bg-white dark:bg-[#1c2a36] w-full max-w-lg p-6 rounded-[32px] border border-slate-200 dark:border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{initialProduct ? "تعديل منتج" : "إضافة منتج جديد"}</h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                            />

                            {/* Branding Toggle */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-150 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${useBranding ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                        <Wand2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">تحسين وتصميم الصورة تلقائياً</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">إضافة خلفية احترافية وشعار المتجر</span>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setUseBranding(!useBranding)}
                                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${useBranding ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${useBranding ? 'left-1' : 'left-6'}`} />
                                </div>
                            </div>

                            {/* Countdown Toggle & Input */}
                            <div className="space-y-4 bg-slate-50 dark:bg-black/10 p-4 rounded-3xl border border-slate-150 dark:border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${showCountdown ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">تفعيل العداد التنازلي</span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">تحفيز العميل بانتهاء العرض</span>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setShowCountdown(!showCountdown)}
                                        className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${showCountdown ? 'bg-orange-500' : 'bg-slate-200 dark:bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${showCountdown ? 'left-1' : 'left-6'}`} />
                                    </div>
                                </div>

                                {showCountdown && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-2"
                                    >
                                        <Label className="text-slate-500 dark:text-slate-400 text-[10px] pr-1 text-right block w-full">تاريخ ووقت انتهاء العرض</Label>
                                        <Input
                                            type="datetime-local"
                                            className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-12 rounded-xl text-slate-800 dark:text-white px-4 focus:ring-orange-500/50"
                                            value={formData.discountEndDate}
                                            onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value })}
                                            required={showCountdown}
                                        />
                                    </motion.div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square bg-slate-100/70 dark:bg-black/20 rounded-2xl border border-slate-300 dark:border-white/5 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-slate-200/50 dark:hover:bg-black/30 cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">إضافة صور</span>
                                </div>

                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden group border border-slate-200 dark:border-white/10">
                                        <Image
                                            src={img}
                                            alt={`Preview ${idx}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        {idx === 0 && (
                                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-1 font-bold">
                                                الرئيسية
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">اسم المنتج</Label>
                                    <div className="relative">
                                        <Package className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <Input
                                            required
                                            placeholder="مثال: بيبسي 330 مل"
                                            className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-14 rounded-2xl text-right text-slate-800 dark:text-white pr-12 focus:ring-primary/50"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">القسم</Label>
                                    <div className="relative">
                                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-slate-100/70 dark:bg-black/20 border border-slate-200 dark:border-white/10 h-14 rounded-2xl text-right text-slate-800 dark:text-white px-12 appearance-none focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        >
                                            <option value="" disabled className="bg-white dark:bg-[#1c2a36] text-slate-800 dark:text-white">اختر القسم</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#1c2a36] text-slate-800 dark:text-white">
                                                    {cat.nameAr}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">الوحدة</Label>
                                        <div className="relative">
                                            <List className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <Input
                                                required
                                                placeholder="حبة / كرتون"
                                                className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-14 rounded-2xl text-right text-slate-800 dark:text-white pr-12 focus:ring-primary/50"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-500 dark:text-slate-400 text-xs pr-1 text-right block w-full">الباركود</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <Input
                                                    placeholder="أدخل الباركود يدوياً (اختياري)"
                                                    className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 h-14 rounded-2xl text-right text-slate-800 dark:text-white pr-12 focus:ring-primary/50"
                                                    value={formData.barcode}
                                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                className="h-14 w-14 rounded-2xl flex-shrink-0 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-primary transition-all active:scale-95"
                                                onClick={() => setIsScannerOpen(true)}
                                            >
                                                <Camera className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Piece Pricing */}
                            <div className="space-y-3 bg-slate-50 dark:bg-black/10 p-4 rounded-3xl border border-slate-150 dark:border-white/5">
                                <h3 className="text-xs font-bold text-slate-500 text-right pr-1 italic">تسعير الحبة</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-green-500 font-bold block text-right pr-2 uppercase">السعر الحالي (المخفض)</Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="bg-green-500/5 border-green-500/20 h-12 rounded-xl text-center text-green-500 font-bold focus:ring-green-500/50"
                                            value={formData.pricePiece}
                                            onChange={(e) => setFormData({ ...formData, pricePiece: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-red-500 font-bold block text-right pr-2 uppercase">السعر الأصلي (قبل الخصم)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="bg-red-500/5 border-red-500/20 h-12 rounded-xl text-center text-red-500 font-bold focus:ring-red-500/50"
                                            value={formData.oldPricePiece}
                                            onChange={(e) => setFormData({ ...formData, oldPricePiece: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dozen Pricing */}
                            <div className="space-y-3 bg-slate-50 dark:bg-black/10 p-4 rounded-3xl border border-slate-150 dark:border-white/5">
                                <h3 className="text-xs font-bold text-slate-500 text-right pr-1 italic">تسعير الدرزن</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-green-500 font-bold block text-right pr-2 uppercase">السعر الحالي (المخفض)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="bg-green-500/5 border-green-500/20 h-12 rounded-xl text-center text-green-500 font-bold focus:ring-green-500/50"
                                            value={formData.priceDozen}
                                            onChange={(e) => setFormData({ ...formData, priceDozen: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-red-500 font-bold block text-right pr-2 uppercase">السعر الأصلي (قبل الخصم)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="bg-red-500/5 border-red-500/20 h-12 rounded-xl text-center text-red-500 font-bold focus:ring-red-500/50"
                                            value={formData.oldPriceDozen}
                                            onChange={(e) => setFormData({ ...formData, oldPriceDozen: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl gap-3 shadow-xl shadow-primary/20 text-lg font-bold transition-all active:scale-[0.98]">
                                    <Plus className="w-6 h-6" />
                                    <span>{initialProduct ? "حفظ التغييرات" : "إضافة المنتج"}</span>
                                </Button>
                            </div>
                        </form>
                    </motion.div>

                    <ScannerModal
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScan={(code) => {
                            setFormData(prev => ({ ...prev, barcode: code }))
                            toast.success("تم مسح الباركود بنجاح")
                        }}
                    />
                </div>
            )}
        </AnimatePresence>
    )
}
