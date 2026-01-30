
"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { Product, useStore } from "@/context/store-context"
import { X, Camera, Package, Hash, List, PlusCircle, Plus, ChevronDown, Trash2, Wand2, Clock, Image as ImageIcon, FileEdit, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { compressImage } from "@/lib/image-utils"
import { toast } from "sonner"
import ScannerModal from "@/components/store/scanner-modal"
import { ImageEditorModal } from "@/components/admin/image-editor-modal"

interface ProductFormProps {
    isOpen: boolean
    onClose: () => void
    initialProduct?: Product | null
}

export function AdminProductForm({ isOpen, onClose, initialProduct }: ProductFormProps) {
    const { addProduct, updateProduct, categories } = useStore()
    const galleryInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingFile, setEditingFile] = useState<File | null>(null)
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
        description: "",
        discountEndDate: "",
        costPrice: "",
        notes: "",
    })

    const [showCountdown, setShowCountdown] = useState(false)

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (initialProduct) {
                setFormData({
                    name: initialProduct.name,
                    unit: initialProduct.unit,
                    barcode: initialProduct.barcode,
                    image: initialProduct.image || "",
                    images: initialProduct.images || (initialProduct.image ? [initialProduct.image] : []),
                    category: initialProduct.category || "",
                    pricePiece: initialProduct.pricePiece?.toString() || "",
                    oldPricePiece: initialProduct.oldPricePiece?.toString() || "",
                    priceDozen: initialProduct.priceDozen?.toString() || "",
                    oldPriceDozen: initialProduct.oldPriceDozen?.toString() || "",
                    description: initialProduct.description || "",
                    discountEndDate: initialProduct.discountEndDate ? new Date(initialProduct.discountEndDate).toISOString().slice(0, 16) : "",
                    costPrice: initialProduct.costPrice?.toString() || "",
                    notes: initialProduct.notes || "",
                })
                setShowCountdown(!!initialProduct.discountEndDate)
            } else {
                setFormData({
                    name: "",
                    unit: "حبة",
                    barcode: "",
                    image: "",
                    images: [] as string[],
                    category: categories[0]?.nameAr || "",
                    pricePiece: "",
                    oldPricePiece: "",
                    priceDozen: "",
                    oldPriceDozen: "",
                    description: "",
                    discountEndDate: "",
                    costPrice: "",
                    notes: "",
                })
                setShowCountdown(false)
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [initialProduct, isOpen, categories])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // If Branding/Magic Fix is enabled, open the Editor with the first file
        if (useBranding) {
            setEditingFile(files[0]);
            setIsEditorOpen(true);
            e.target.value = "";
            return;
        }

        const loadingToast = toast.loading("جاري معالجة وضغط الصور...");

        try {
            const newImages: string[] = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file.type.startsWith('image/')) continue

                // Compress image before adding
                // Max width 1200px, Quality 0.8 -> Good balance
                const compressedBase64 = await compressImage(file, 1200, 0.8)
                newImages.push(compressedBase64)
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages],
                image: prev.image || newImages[0] || ""
            }))

            toast.dismiss(loadingToast);
            if (newImages.length > 0) toast.success(`تم إضافة ${newImages.length} صورة بنجاح`)
        } catch (error) {
            console.error("Compression error:", error)
            toast.dismiss(loadingToast);
            toast.error("حدث خطأ أثناء معالجة الصور، يرجى المحاولة مرة أخرى")
        }
        e.target.value = "";
    }

    const handleEditorSave = async (processedFile: File) => {
        try {
            // New: Since branding is already applied in the editor, we just compress normally (or just read as base64 since it's already optimized?)
            // The editor returns a file (PNG). We should compress it to ensure it's not huge.
            const compressedBase64 = await compressImage(processedFile);

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, compressedBase64],
                image: prev.image || compressedBase64 || ""
            }))

            setIsEditorOpen(false);
            setEditingFile(null);
            toast.success("تم إضافة الصورة المحسنة");
        } catch (error) {
            console.error("Editor save error:", error);
            toast.error("فشل حفظ الصورة المعالجة");
        }
    };

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

    const handleSubmit = (e: React.FormEvent, isDraft = false) => {
        e.preventDefault()
        const productData = {
            name: formData.name,
            price: Number(formData.pricePiece) || 0,
            pricePiece: Number(formData.pricePiece) || 0,
            oldPricePiece: showCountdown && formData.oldPricePiece ? Number(formData.oldPricePiece) : 0,
            priceDozen: formData.priceDozen ? Number(formData.priceDozen) : 0,
            oldPriceDozen: showCountdown && formData.oldPriceDozen ? Number(formData.oldPriceDozen) : 0,
            unit: formData.unit,
            barcode: formData.barcode,
            image: formData.images[0] || formData.image || "", // Prefer first image in array
            images: formData.images,
            category: formData.category,
            description: formData.description,
            discountEndDate: showCountdown && formData.discountEndDate ? new Date(formData.discountEndDate) : null,
            costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
            notes: formData.notes,
            isDraft: isDraft
        }

        if (initialProduct) {
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
                        className="bg-[#1c2a36] w-full max-w-lg p-6 rounded-[32px] border border-white/10 relative shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">{initialProduct ? "تعديل منتج" : "إضافة منتج جديد"}</h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Hidden Inputs */}
                            <input
                                type="file"
                                ref={galleryInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                            />
                            <input
                                type="file"
                                ref={cameraInputRef}
                                className="hidden"
                                accept="image/*"
                                capture="environment" // Forces camera on mobile
                                onChange={handleFileChange}
                            />


                            {/* Branding Toggle */}
                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl transition-colors ${useBranding ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-400'}`}>
                                        <Wand2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-sm font-bold text-white">المعدل الذكي (Magic Studio)</span>
                                        <span className="text-[10px] text-slate-400">قص الخلفية + تصميم موحد</span>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setUseBranding(!useBranding)}
                                    className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${useBranding ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${useBranding ? 'left-1' : 'left-6'}`} />
                                </div>
                            </div>

                            {/* Offer Mode Toggle */}
                            <div className="space-y-4 bg-black/10 p-4 rounded-3xl border border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${showCountdown ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold text-white">هذا المنتج "عرض خاص"؟</span>
                                            <span className="text-[10px] text-slate-400">تفعيل الخصومات والمؤقت</span>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setShowCountdown(!showCountdown)}
                                        className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${showCountdown ? 'bg-orange-500' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${showCountdown ? 'left-1' : 'left-6'}`} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {showCountdown && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="pt-4 border-t border-white/5 space-y-4 overflow-hidden"
                                        >
                                            {/* Quick Duration Buttons */}
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { label: "24 ساعة", hours: 24 },
                                                    { label: "3 أيام", hours: 72 },
                                                    { label: "أسبوع", hours: 168 },
                                                    { label: "شهر", hours: 720 },
                                                ].map((duration) => (
                                                    <button
                                                        key={duration.hours}
                                                        type="button"
                                                        onClick={() => {
                                                            const date = new Date();
                                                            date.setHours(date.getHours() + duration.hours);
                                                            // Format for datetime-local: YYYY-MM-DDTHH:mm
                                                            const formatted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                                                            setFormData({ ...formData, discountEndDate: formatted });
                                                        }}
                                                        className="bg-white/5 hover:bg-orange-500/20 hover:text-orange-400 border border-white/5 hover:border-orange-500/30 rounded-xl py-2 text-[10px] font-bold text-slate-400 transition-all active:scale-95"
                                                    >
                                                        {duration.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl p-1 relative group">
                                                <div className="flex items-center justify-between px-4 py-2 pointer-events-none">
                                                    <div className="flex items-center gap-2 text-orange-400">
                                                        <Clock className="w-4 h-4" />
                                                        <span className="text-xs font-bold">تاريخ انتهاء العرض</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {formData.discountEndDate ? new Date(formData.discountEndDate).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' }) : 'اختر التاريخ'}
                                                    </div>
                                                </div>
                                                <Input
                                                    type="datetime-local"
                                                    dir="ltr"
                                                    className="bg-transparent border-none h-12 rounded-xl text-white px-4 focus:ring-0 text-center font-mono w-full cursor-pointer hover:bg-white/5 transition-colors text-sm"
                                                    value={formData.discountEndDate}
                                                    onChange={(e) => setFormData({ ...formData, discountEndDate: e.target.value })}
                                                    required={showCountdown}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Image Inputs (Grid) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Upload From Gallery */}
                                <div
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="aspect-square bg-blue-500/10 rounded-2xl border border-blue-500/20 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-blue-500/20 cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-blue-300">المعرض</span>
                                </div>

                                {/* Upload From Camera */}
                                <div
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="aspect-square bg-purple-500/10 rounded-2xl border border-purple-500/20 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-purple-500/20 cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-purple-300">الكاميرا</span>
                                </div>

                                {/* Preview Images */}
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden group border border-white/10">
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
                                    <Label className="text-slate-400 text-xs pr-1 text-right block w-full">اسم المنتج</Label>
                                    <div className="relative">
                                        <Package className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <Input
                                            required
                                            placeholder="مثال: بيبسي 330 مل"
                                            className="bg-black/20 border-white/10 h-14 rounded-2xl text-right text-white pr-12 focus:ring-primary/50"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs pr-1 text-right block w-full">القسم</Label>
                                    <div className="relative">
                                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 h-14 rounded-2xl text-right text-white px-12 appearance-none focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        >
                                            <option value="" disabled className="bg-[#1c2a36]">اختر القسم</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.nameAr} className="bg-[#1c2a36]">
                                                    {cat.nameAr}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-xs pr-1 text-right block w-full">الوحدة</Label>
                                        <div className="relative">
                                            <List className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <Input
                                                required
                                                placeholder="حبة / كرتون"
                                                className="bg-black/20 border-white/10 h-14 rounded-2xl text-right text-white pr-12 focus:ring-primary/50"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-xs pr-1 text-right block w-full">الباركود</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <Input
                                                    placeholder="اختياري"
                                                    className="bg-black/20 border-white/10 h-14 rounded-2xl text-right text-white pr-12 focus:ring-primary/50"
                                                    value={formData.barcode}
                                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                className="h-14 w-14 rounded-2xl flex-shrink-0 bg-white/5 border-white/10 hover:bg-white/10 text-primary transition-all active:scale-95"
                                                onClick={() => setIsScannerOpen(true)}
                                            >
                                                <Camera className="w-6 h-6" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Piece Pricing */}
                            <div className={`space-y-3 p-4 rounded-3xl border transition-colors ${showCountdown ? 'bg-orange-500/5 border-orange-500/10' : 'bg-black/10 border-white/5'}`}>
                                <h3 className="text-xs font-bold text-slate-500 text-right pr-1 italic">
                                    {showCountdown ? "تسعير العرض (للحبة)" : "سعر البيع (للحبة)"}
                                </h3>
                                <div className={showCountdown ? "grid grid-cols-2 gap-4" : "grid grid-cols-1"}>
                                    <div className="space-y-1">
                                        <Label className={`text-[10px] font-bold block text-right pr-2 uppercase ${showCountdown ? 'text-green-500' : 'text-slate-400'}`}>
                                            {showCountdown ? "السعر الجديد (بعد الخصم)" : "السعر"}
                                        </Label>
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className={`h-12 rounded-xl text-center font-bold ${showCountdown ? 'bg-green-500/10 border-green-500/20 text-green-500 focus:ring-green-500/50' : 'bg-white/5 border-white/10 text-white focus:ring-primary/50'}`}
                                            value={formData.pricePiece}
                                            onChange={(e) => setFormData({ ...formData, pricePiece: e.target.value })}
                                        />
                                    </div>
                                    {showCountdown && (
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-red-500 font-bold block text-right pr-2 uppercase">السعر القديم (مشطوب)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="bg-red-500/5 border-red-500/20 h-12 rounded-xl text-center text-red-500 font-bold focus:ring-red-500/50"
                                                value={formData.oldPricePiece}
                                                onChange={(e) => setFormData({ ...formData, oldPricePiece: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Cost Price */}
                            <div className="space-y-3 bg-yellow-500/5 p-4 rounded-3xl border border-yellow-500/10 mb-4">
                                <h3 className="text-xs font-bold text-yellow-500 text-right pr-1 italic">التكلفة (خاص للإدارة)</h3>
                                <div className="space-y-1">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="bg-yellow-500/5 border-yellow-500/20 h-12 rounded-xl text-center text-yellow-100 font-bold focus:ring-yellow-500/50"
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Dozen Pricing */}
                            <div className={`space-y-3 p-4 rounded-3xl border transition-colors ${showCountdown ? 'bg-orange-500/5 border-orange-500/10' : 'bg-black/10 border-white/5'}`}>
                                <h3 className="text-xs font-bold text-slate-500 text-right pr-1 italic">
                                    {showCountdown ? "تسعير العرض (للدرزن - اختياري)" : "سعر البيع (للدرزن - اختياري)"}
                                </h3>
                                <div className={showCountdown ? "grid grid-cols-2 gap-4" : "grid grid-cols-1"}>
                                    <div className="space-y-1">
                                        <Label className={`text-[10px] font-bold block text-right pr-2 uppercase ${showCountdown ? 'text-green-500' : 'text-slate-400'}`}>
                                            {showCountdown ? "السعر الجديد (بعد الخصم)" : "السعر"}
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className={`h-12 rounded-xl text-center font-bold ${showCountdown ? 'bg-green-500/10 border-green-500/20 text-green-500 focus:ring-green-500/50' : 'bg-white/5 border-white/10 text-white focus:ring-primary/50'}`}
                                            value={formData.priceDozen}
                                            onChange={(e) => setFormData({ ...formData, priceDozen: e.target.value })}
                                        />
                                    </div>
                                    {showCountdown && (
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-red-500 font-bold block text-right pr-2 uppercase">السعر القديم (مشطوب)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="bg-red-500/5 border-red-500/20 h-12 rounded-xl text-center text-red-500 font-bold focus:ring-red-500/50"
                                                value={formData.oldPriceDozen}
                                                onChange={(e) => setFormData({ ...formData, oldPriceDozen: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs pr-1 text-right block w-full">الوصف (اختياري)</Label>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white text-right text-sm focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                                    placeholder="أضف وصفاً مختصراً للمنتج..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs pr-1 text-right block w-full">ملاحظات إدارية (للمسودة)</Label>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white text-right text-sm focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                                    placeholder="ملاحظات لا تظهر للعميل..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-2 grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    className="h-14 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl gap-2 border border-white/10 font-bold transition-all active:scale-[0.98]"
                                >
                                    <FileEdit className="w-5 h-5" />
                                    <span>حفظ كمسودة</span>
                                </Button>
                                <Button type="submit" className="h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl gap-3 shadow-xl shadow-primary/20 text-lg font-bold transition-all active:scale-[0.98]">
                                    <Plus className="w-6 h-6" />
                                    <span>{initialProduct ? "حفظ وتفعيل" : "نشر المنتج"}</span>
                                </Button>
                            </div>
                        </form >
                    </motion.div >

                    <ScannerModal
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScan={(code) => {
                            setFormData(prev => ({ ...prev, barcode: code }))
                            toast.success("تم مسح الباركود بنجاح")
                        }}
                    />

                    <ImageEditorModal
                        isOpen={isEditorOpen}
                        onClose={() => setIsEditorOpen(false)}
                        imageFile={editingFile}
                        onSave={handleEditorSave}
                    />
                </div >
            )}
        </AnimatePresence >
    )
}

