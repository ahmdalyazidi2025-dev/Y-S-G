"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Product, useStore } from "@/context/store-context"
import { X, ChevronRight, ChevronLeft, ShoppingCart, Info, Sparkles, Box, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CountdownTimer } from "./countdown-timer"
import Image from "next/image"
import { toast } from "sonner"

interface ProductDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    product: Product | null
}

export function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
    const { addToCart, products } = useStore()
    const [activeProduct, setActiveProduct] = useState<Product | null>(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedUnit, setSelectedUnit] = useState<string>("حبة")

    useEffect(() => {
        if (product) {
            setActiveProduct(product)
            setCurrentImageIndex(0)
            setSelectedUnit("حبة")
        }
    }, [product])

    const handleShareProduct = () => {
        if (!activeProduct) return
        const link = `${window.location.origin}/customer?product=${activeProduct.id}`
        navigator.clipboard.writeText(link)
        toast.success("تم نسخ رابط المنتج! يمكنك مشاركته الآن عبر الواتساب 🎉")
    }

    if (!activeProduct) return null

    // Prepare images array
    const images = activeProduct.images && activeProduct.images.length > 0
        ? activeProduct.images
        : (activeProduct.image ? [activeProduct.image] : [])

    const hasDozen = activeProduct.priceDozen && activeProduct.priceDozen > 0
    const currentPrice = selectedUnit === "حبة" ? activeProduct.pricePiece : activeProduct.priceDozen

    const handleAddToCart = () => {
        if (!currentPrice) return
        addToCart(activeProduct, selectedUnit, currentPrice)
        onClose()
    }

    const nextImage = () => {
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }
    }

    const prevImage = () => {
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
        }
    }

    // Filter related products (same category, excluding the active one)
    const relatedProducts = products.filter(
        p => p.category === activeProduct.category && p.id !== activeProduct.id
    ).slice(0, 10)

    const hasDiscountPiece = activeProduct.oldPricePiece && activeProduct.oldPricePiece > activeProduct.pricePiece
    const hasDiscountDozen = activeProduct.oldPriceDozen && activeProduct.oldPriceDozen > activeProduct.priceDozen!

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col max-h-[92vh] text-right"
                    >
                        {/* Header/Close */}
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                            {activeProduct.discountEndDate && new Date(activeProduct.discountEndDate).getTime() > new Date().getTime() && (
                                <div className="scale-90 origin-right">
                                    <CountdownTimer endDate={new Date(activeProduct.discountEndDate)} />
                                </div>
                            )}
                            <button 
                                onClick={handleShareProduct} 
                                className="p-2.5 bg-slate-100/90 dark:bg-black/35 hover:bg-slate-200 dark:hover:bg-black/50 text-blue-500 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer border border-slate-200/50 dark:border-white/5"
                                title="مشاركة المنتج"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={onClose} 
                                className="p-2.5 bg-slate-100/90 dark:bg-black/35 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-800 dark:text-white rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer border border-slate-200/50 dark:border-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Contents */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                            
                            {/* Image Gallery Container */}
                            <div className="relative w-full aspect-[4/3] sm:aspect-video bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                                {images.length > 0 ? (
                                    <motion.div 
                                        key={currentImageIndex}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3 }}
                                        className="relative w-full h-full p-6"
                                    >
                                        <Image
                                            src={images[currentImageIndex]}
                                            alt={activeProduct.name}
                                            fill
                                            className="object-contain p-4"
                                            unoptimized
                                        />
                                    </motion.div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <span className="text-6xl select-none">
                                            {activeProduct.name.includes("زيت") ? "🛢️" : "📦"}
                                        </span>
                                        <span className="text-xs font-bold opacity-60">لا تتوفر صورة للمنتج</span>
                                    </div>
                                )}

                                {/* Navigation Arrows */}
                                {images.length > 1 && (
                                    <>
                                        <button 
                                            onClick={prevImage} 
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 rounded-full text-slate-800 dark:text-white backdrop-blur-sm transition-all border border-slate-200 dark:border-white/10 cursor-pointer"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={nextImage} 
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-black/30 hover:bg-white dark:hover:bg-black/50 rounded-full text-slate-800 dark:text-white backdrop-blur-sm transition-all border border-slate-200 dark:border-white/10 cursor-pointer"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>

                                        {/* Dots indicator */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                            {images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={cn(
                                                        "w-2 h-2 rounded-full transition-all cursor-pointer",
                                                        idx === currentImageIndex ? "bg-primary w-5" : "bg-slate-300 dark:bg-white/20"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Info & Configurations */}
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-primary/10 text-primary text-[10px] px-2.5 py-1 rounded-lg font-black tracking-wide border border-primary/20">
                                            {activeProduct.category}
                                        </span>
                                        {activeProduct.barcode && (
                                            <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] px-2.5 py-1 rounded-lg font-bold border border-slate-200/50 dark:border-white/5">
                                                باركود: {activeProduct.barcode}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                                        {activeProduct.name}
                                    </h2>
                                </div>

                                {/* Description / Details / Notes */}
                                {activeProduct.description && (
                                    <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-white/5 p-4 rounded-2xl space-y-2">
                                        <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-end">
                                            <span>تفاصيل المنتج</span>
                                            <Info className="w-3.5 h-3.5 text-primary" />
                                        </h4>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                            {activeProduct.description}
                                        </p>
                                    </div>
                                )}

                                {/* Unit Selection Grid */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">اختر الوحدة المطلوبة للطلب</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setSelectedUnit("حبة")}
                                            className={cn(
                                                "flex flex-col items-start text-left p-4 rounded-[1.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group select-none h-24 justify-between",
                                                selectedUnit === "حبة"
                                                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-white/5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <span className={cn(
                                                "text-xs font-black px-2 py-0.5 rounded-md",
                                                selectedUnit === "حبة" ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                            )}>
                                                حبة
                                            </span>
                                            <div className="space-y-0.5">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className={cn("text-lg font-black", selectedUnit === "حبة" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200")}>
                                                        {activeProduct.pricePiece} <small className="text-[10px]">ر.س</small>
                                                    </span>
                                                    {hasDiscountPiece && (
                                                        <span className="text-xs text-rose-500 line-through font-bold">
                                                            {activeProduct.oldPricePiece}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        {hasDozen && (
                                            <button
                                                onClick={() => setSelectedUnit("كرتون")}
                                                className={cn(
                                                    "flex flex-col items-start text-left p-4 rounded-[1.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group select-none h-24 justify-between",
                                                    selectedUnit === "كرتون"
                                                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400"
                                                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-white/5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-xs font-black px-2 py-0.5 rounded-md",
                                                    selectedUnit === "كرتون" ? "bg-blue-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                )}>
                                                    كرتون
                                                </span>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className={cn("text-lg font-black", selectedUnit === "كرتون" ? "text-blue-600 dark:text-blue-400" : "text-slate-800 dark:text-slate-200")}>
                                                            {activeProduct.priceDozen} <small className="text-[10px]">ر.س</small>
                                                        </span>
                                                        {hasDiscountDozen && (
                                                            <span className="text-xs text-rose-500 line-through font-bold">
                                                                {activeProduct.oldPriceDozen}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Related Products Section */}
                                {relatedProducts.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">منتجات ذات صلة</span>
                                            <Box className="w-4 h-4 text-primary" />
                                        </div>

                                        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x">
                                            {relatedProducts.map((relProduct) => (
                                                <div 
                                                    key={relProduct.id} 
                                                    onClick={() => {
                                                        setActiveProduct(relProduct)
                                                        setCurrentImageIndex(0)
                                                        setSelectedUnit("حبة")
                                                    }}
                                                    className="min-w-[130px] max-w-[150px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:border-primary/20 dark:hover:border-white/10 rounded-2xl p-2.5 text-right snap-start flex-shrink-0 cursor-pointer transition-all hover:scale-[1.02]"
                                                >
                                                    <div className="relative aspect-square w-full bg-white dark:bg-slate-950 rounded-xl overflow-hidden mb-2 border border-slate-100 dark:border-white/5 flex items-center justify-center">
                                                        {relProduct.image ? (
                                                            <Image 
                                                                src={relProduct.image} 
                                                                alt={relProduct.name} 
                                                                fill
                                                                className="object-contain p-1.5"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <span className="text-xl">🔧</span>
                                                        )}
                                                    </div>
                                                    <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 line-clamp-1 leading-snug">
                                                        {relProduct.name}
                                                    </h5>
                                                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                                                        {relProduct.pricePiece} ر.س
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fixed Bottom CTA bar */}
                        <div className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 border-t border-slate-100 dark:border-white/10 p-4 backdrop-blur-md flex items-center gap-4 z-30">
                            <div className="flex flex-col items-start text-left flex-shrink-0 select-none">
                                <span className="text-[10px] text-slate-400 font-black">المجموع المقدر</span>
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                    {currentPrice} <small className="text-[10px]">ر.س</small>
                                </span>
                            </div>
                            
                            <Button
                                onClick={handleAddToCart}
                                className="flex-1 h-12 bg-gradient-to-r from-primary to-blue-600 hover:opacity-95 text-white rounded-2xl text-[15px] font-black shadow-xl shadow-primary/20 gap-2 cursor-pointer flex items-center justify-center"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span>إضافة لسلة المشتريات</span>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
