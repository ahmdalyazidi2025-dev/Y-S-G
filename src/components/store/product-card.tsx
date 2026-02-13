"use client"
import { memo } from "react"

import { Plus } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Product, useStore } from "@/context/store-context"
import { CountdownTimer } from "./countdown-timer"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export const ProductCard = memo(function ProductCard({ item, onViewDetails, index = 0 }: { item: Product, onViewDetails?: (item: Product) => void, index?: number }) {
    const { addToCart } = useStore()

    // --- Smart Price Logic ---
    const isExpired = item.discountEndDate && new Date(item.discountEndDate).getTime() < new Date().getTime()

    // Piece Pricing
    const effectivePricePiece = isExpired && item.oldPricePiece
        ? item.oldPricePiece
        : item.pricePiece

    const displayOldPricePiece = isExpired ? null : item.oldPricePiece

    // Dozen Pricing
    const hasDozen = item.priceDozen && item.priceDozen > 0
    const effectivePriceDozen = isExpired && item.oldPriceDozen
        ? item.oldPriceDozen
        : (item.priceDozen || 0)

    const displayOldPriceDozen = isExpired ? null : item.oldPriceDozen
    // -------------------------

    // Offer Active Logic
    const hasActiveOffer = item.discountEndDate && new Date(item.discountEndDate).getTime() > new Date().getTime() && !isExpired

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="h-full group select-none"
        >
            <div className="flex flex-col gap-3 h-full">
                {/* 1. Premium Image Container */}
                <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-secondary/10">

                    {/* Offer/New Badges */}
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                        {hasActiveOffer ? (
                            <div className="flex items-center gap-1 bg-yellow-400 text-black text-[10px] px-2.5 py-1 rounded-full font-black shadow-sm">
                                <span>🔥</span>
                                <span>عرض</span>
                            </div>
                        ) : (
                            <div className="bg-white/90 backdrop-blur-md text-foreground text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">
                                جديد
                            </div>
                        )}
                        {hasActiveOffer && (
                            <CountdownTimer endDate={new Date(item.discountEndDate!)} />
                        )}
                    </div>

                    {/* Image Click Area */}
                    <div
                        className="w-full h-full flex items-center justify-center cursor-pointer relative z-10 transition-transform duration-500 group-hover:scale-105"
                        onClick={() => onViewDetails?.(item)}
                    >
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                loading="lazy"
                                className="object-cover"
                            />
                        ) : (
                            <div className="text-7xl drop-shadow-lg filter grayscale-[0.2] group-hover:grayscale-0 transition-all">
                                {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                            </div>
                        )}
                    </div>

                    {/* Floating Add Button (Primary - Piece) */}
                    <Button
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            addToCart(item, "حبة", effectivePricePiece)
                        }}
                        className="absolute bottom-3 right-3 h-11 w-11 rounded-full bg-black text-white hover:bg-black/80 shadow-xl shadow-black/20 hover:scale-110 active:scale-95 transition-all z-30"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>

                {/* 2. Clean Typography & Secondary Actions */}
                <div className="flex flex-col gap-1 px-1">
                    <div className="flex justify-between items-start gap-2">
                        <h3
                            className="font-bold text-lg text-foreground leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => onViewDetails?.(item)}
                        >
                            {item.name}
                        </h3>
                        <div className="flex flex-col items-end shrink-0">
                            <span className="font-black text-lg text-foreground">{effectivePricePiece} <span className="text-xs font-normal text-muted-foreground">ر.س</span></span>
                            {displayOldPricePiece && (
                                <span className="text-[10px] text-red-400 line-through">{displayOldPricePiece}</span>
                            )}
                        </div>
                    </div>

                    {/* Secondary Action: Box/Dozen (if exists) */}
                    {hasDozen && (
                        <div
                            className="flex items-center justify-between mt-1 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800/50 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation()
                                addToCart(item, "كرتون", effectivePriceDozen)
                            }}
                        >
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">كرتون ({effectivePriceDozen} ر.س)</span>
                            <Plus className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}, (prev, next) => {
    // Custom comparison for better performance
    return prev.item.id === next.item.id &&
        prev.item.pricePiece === next.item.pricePiece &&
        prev.item.priceDozen === next.item.priceDozen &&
        prev.item.discountEndDate === next.item.discountEndDate &&
        prev.item.oldPricePiece === next.item.oldPricePiece &&
        prev.item.description === next.item.description && // Include description in comparison
        prev.item.name === next.item.name // In case name changes
})
