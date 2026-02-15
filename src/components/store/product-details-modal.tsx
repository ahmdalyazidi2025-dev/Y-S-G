"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Product, useStore } from "@/context/store-context"
import { X, ChevronRight, ChevronLeft, ShoppingCart, Star, Share2, Info } from "lucide-react"
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
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="bg-background w-full max-w-lg h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col"
                    >
                        {/* Immersive Image Header */}
                        <div className="relative h-[40vh] sm:h-[350px] w-full shrink-0">
                            {images.length > 0 ? (
                                <motion.img
                                    key={currentImageIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    src={images[currentImageIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center text-6xl">
                                    {product.name.includes("زيت") ? "🛢️" : "📦"}
                                </div>
                            )}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

                            {/* Top Controls */}
                            <div className="absolute top-4 inset-x-4 flex justify-between items-start z-10">
                                <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex gap-2">
                                    {/* Share Button (Future Feature) */}
                                    <button
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: product.name,
                                                    text: product.description,
                                                    url: window.location.href,
                                                }).catch(console.error);
                                            } else {
                                                // Fallback for browsers that don't support share
                                                navigator.clipboard.writeText(window.location.href);
                                                // Assuming you have a toast library or similar
                                                // toast.success("تم نسخ الرابط");
                                                alert("تم نسخ الرابط");
                                            }
                                        }}
                                        className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Image Navigation */}
                            {images.length > 1 && (
                                <>
                                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Pagination Dots */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                        {images.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "h-1.5 rounded-full transition-all duration-300 backdrop-blur-md",
                                                    idx === currentImageIndex
                                                        ? "w-6 bg-primary"
                                                        : "w-1.5 bg-white/50"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 pb-32 -mt-6 relative z-10">
                            {/* Title & Category */}
                            <div className="mb-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-3 py-1 rounded-full bg-secondary/50 text-secondary-foreground text-[10px] font-bold border border-secondary">
                                        {product.category}
                                    </span>
                                    {product.discountEndDate && new Date(product.discountEndDate).getTime() > new Date().getTime() && (
                                        <div className="scale-75 origin-left rtl:origin-right">
                                            <CountdownTimer endDate={new Date(product.discountEndDate)} />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-2xl font-black text-foreground leading-tight mb-2">{product.name}</h2>
                                <div className="flex items-center gap-2">
                                    <div className="flex text-amber-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4 fill-current" />
                                        <Star className="w-4 h-4 fill-current" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">(منتج مميز)</span>
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="mb-8 p-4 rounded-2xl bg-muted/30 border border-border/50">
                                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-primary" />
                                        تفاصيل المنتج
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Unit Selection */}
                            <div className="space-y-4 mb-4">
                                <h3 className="text-sm font-bold text-foreground">خيارات الشراء</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setSelectedUnit("حبة")}
                                        className={cn(
                                            "relative p-4 rounded-2xl border-2 text-right transition-all duration-200 overflow-hidden",
                                            selectedUnit === "حبة"
                                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                : "border-border bg-card hover:bg-accent/50"
                                        )}
                                    >
                                        <div className="relative z-10">
                                            <span className={cn(
                                                "text-xs font-bold block mb-1",
                                                selectedUnit === "حبة" ? "text-primary" : "text-muted-foreground"
                                            )}>بالحبة</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-foreground">{effectivePricePiece}</span>
                                                <span className="text-xs text-muted-foreground">ر.س</span>
                                            </div>
                                        </div>
                                        {selectedUnit === "حبة" && (
                                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
                                        )}
                                    </button>

                                    {hasDozen && (
                                        <button
                                            onClick={() => setSelectedUnit("كرتون")}
                                            className={cn(
                                                "relative p-4 rounded-2xl border-2 text-right transition-all duration-200 overflow-hidden",
                                                selectedUnit === "كرتون"
                                                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                                    : "border-border bg-card hover:bg-accent/50"
                                            )}
                                        >
                                            <div className="relative z-10">
                                                <span className={cn(
                                                    "text-xs font-bold block mb-1",
                                                    selectedUnit === "كرتون" ? "text-primary" : "text-muted-foreground"
                                                )}>بالكرتون</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-foreground">{effectivePriceDozen}</span>
                                                    <span className="text-xs text-muted-foreground">ر.س</span>
                                                </div>
                                            </div>
                                            {selectedUnit === "كرتون" && (
                                                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Floating Action Bar */}
                        <div className="absolute bottom-0 inset-x-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-20">
                            <div className="flex items-center gap-4 max-w-lg mx-auto">
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">الإجمالي التقريبي</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-primary">{currentPrice}</span>
                                        <span className="text-xs font-bold text-foreground">ر.س</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    className="flex-[2] h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 bg-primary hover:bg-primary/90 text-white"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>إضافة للسلة</span>
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            <ShoppingCart className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

