"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Product, useStore, Category } from "@/context/store-context"
import { X, Camera, Save, Package, Hash, DollarSign, List, PlusCircle, Plus, Image as ImageIcon, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { compressImage } from "@/lib/image-utils"
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

    const [formData, setFormData] = useState({
        name: "",
        unit: "حبة",
        barcode: "",
        image: "",
        category: "",
        pricePiece: "",
        oldPricePiece: "",
        priceDozen: "",
        oldPriceDozen: "",
    })

    useEffect(() => {
        if (initialProduct) {
            setFormData(prev => {
                const newData = {
                    name: initialProduct.name,
                    unit: initialProduct.unit,
                    barcode: initialProduct.barcode,
                    image: initialProduct.image || "",
                    category: initialProduct.category || "",
                    pricePiece: initialProduct.pricePiece?.toString() || "",
                    oldPricePiece: initialProduct.oldPricePiece?.toString() || "",
                    priceDozen: initialProduct.priceDozen?.toString() || "",
                    oldPriceDozen: initialProduct.oldPriceDozen?.toString() || "",
                }
                return newData
            })
        } else {
            setFormData(prev => {
                const newData = {
                    name: "",
                    unit: "حبة",
                    barcode: "",
                    image: "",
                    category: categories[0]?.nameAr || "",
                    pricePiece: "",
                    oldPricePiece: "",
                    priceDozen: "",
                    oldPriceDozen: "",
                }
                if (JSON.stringify(prev) === JSON.stringify(newData)) return prev
                return newData
            })
        }
    }, [initialProduct, isOpen, categories])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check if file is image
        if (!file.type.startsWith('image/')) {
            toast.error("يرجى اختيار ملف صورة صحيح")
            return
        }

        try {
            const compressedBase64 = await compressImage(file)
            setFormData(prev => ({ ...prev, image: compressedBase64 }))
            toast.success("تم ضغط الصورة وتحميلها بنجاح")
        } catch (error) {
            console.error("Compression error:", error)
            toast.error("حدث خطأ أثناء معالجة الصورة")
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const productData = {
            name: formData.name,
            price: parseFloat(formData.pricePiece) || 0,
            pricePiece: parseFloat(formData.pricePiece) || 0,
            oldPricePiece: formData.oldPricePiece ? parseFloat(formData.oldPricePiece) : undefined,
            priceDozen: formData.priceDozen ? parseFloat(formData.priceDozen) : undefined,
            oldPriceDozen: formData.oldPriceDozen ? parseFloat(formData.oldPriceDozen) : undefined,
            unit: formData.unit,
            barcode: formData.barcode,
            image: formData.image,
            category: formData.category,
        }

        if (initialProduct) {
            updateProduct({ ...productData, id: initialProduct.id } as Product)
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
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-video bg-black/20 rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-black/30 cursor-pointer transition-all group overflow-hidden relative"
                            >
                                {formData.image ? (
                                    <>
                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">تحميل صورة المنتج</span>
                                    </>
                                )}
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
                                                    required
                                                    placeholder="أدخل الباركود يدوياً"
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
                            <div className="space-y-3 bg-black/10 p-4 rounded-3xl border border-white/5">
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
                            <div className="space-y-3 bg-black/10 p-4 rounded-3xl border border-white/5">
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
                    />
                </div>
            )}
        </AnimatePresence>
    )
}
