"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Product, useStore } from "@/context/store-context"
import { X, ChevronRight, ChevronLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CountdownTimer } from "./countdown-timer"

interface ProductDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    product: Product | null
}

export function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
    const { addToCart } = useStore()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedUnit, setSelectedUnit] = useState<string>("حبة")

    if (!product) return null

    // Prepare images array
    const images = product.images && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : [])

    const hasDozen = product.priceDozen && product.priceDozen > 0

    // --- Smart Price Logic ---
    const isExpired = product.discountEndDate && new Date(product.discountEndDate).getTime() < new Date().getTime()

    const effectivePricePiece = isExpired && product.oldPricePiece
        ? product.oldPricePiece
        : product.pricePiece

    const effectivePriceDozen = isExpired && product.oldPriceDozen
        ? product.oldPriceDozen
        : (product.priceDozen || 0)

    const currentPrice = selectedUnit === "حبة" ? effectivePricePiece : effectivePriceDozen
    // -------------------------

    const handleAddToCart = () => {
        if (!currentPrice) return
        addToCart(product, selectedUnit, currentPrice)
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-background w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header/Close */}
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                            {product.discountEndDate && new Date(product.discountEndDate).getTime() > new Date().getTime() && (
                                <div className="scale-90 origin-right">
                                    <CountdownTimer endDate={new Date(product.discountEndDate)} />
                                </div>
                            )}
                            <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Image Gallery */}
                        <div className="relative aspect-square bg-muted">
                            {images.length > 0 ? (
                                <motion.img
                                    key={currentImageIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    src={images[currentImageIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">
                                    {product.name.includes("زيت") ? "🛢️" : "📦"}
                                </div>
                            )}

                            {/* Navigation Arrows */}
                            {images.length > 1 && (
                                <>
                                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md">
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md">
                                        <ChevronRight className="w-6 h-6" />
                                    </button>

                                    {/* Dots */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "w-2 h-2 rounded-full transition-all",
                                                    idx === currentImageIndex ? "bg-primary w-4" : "bg-white/50"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">{product.name}</h2>
                                <div className="text-sm text-muted-foreground">{product.category}</div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-foreground">وصف المنتج</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Unit Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted-foreground">اختر الوحدة</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedUnit("حبة")}
                                        className={cn(
                                            "flex-1 p-4 rounded-2xl border transition-all text-right group relative overflow-hidden",
                                            selectedUnit === "حبة"
                                                ? "bg-primary/10 border-primary text-primary"
                                                : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <span className="text-xs block mb-1 opacity-70">حبة</span>
                                        <span className="text-lg font-bold block">{effectivePricePiece} <small className="text-[10px]">ر.س</small></span>
                                    </button>

                                    {hasDozen && (
                                        <button
                                            onClick={() => setSelectedUnit("كرتون")}
                                            className={cn(
                                                "flex-1 p-4 rounded-2xl border transition-all text-right group relative overflow-hidden",
                                                selectedUnit === "كرتون"
                                                    ? "bg-primary/10 border-primary text-primary"
                                                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <span className="text-xs block mb-1 opacity-70">كرتون</span>
                                            <span className="text-lg font-bold block">{effectivePriceDozen} <small className="text-[10px]">ر.س</small></span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <Button
                                onClick={handleAddToCart}
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 gap-3 mt-auto"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span>إضافة للسلة</span>
                                <span className="bg-black/20 px-2 py-0.5 rounded text-sm">
                                    {currentPrice} ر.س
                                </span>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
