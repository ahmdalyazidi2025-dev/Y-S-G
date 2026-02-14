"use client"
import { memo } from "react"

import { Plus, Minus, Star, Clock } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Product, useStore } from "@/context/store-context"
import { CountdownTimer } from "./countdown-timer"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export const ProductCard = memo(function ProductCard({ item, onViewDetails, index = 0 }: { item: Product, onViewDetails?: (item: Product) => void, index?: number }) {
    const { addToCart, cart, updateCartQuantity, removeFromCart } = useStore()

    // --- Smart Price Logic ---
    const isExpired = item.discountEndDate && new Date(item.discountEndDate).getTime() < new Date().getTime()

    // Piece Pricing
    const effectivePricePiece = isExpired && item.oldPricePiece && item.oldPricePiece > 0
        ? item.oldPricePiece
        : item.pricePiece

    const displayOldPricePiece = (!isExpired && item.oldPricePiece && item.oldPricePiece > 0) ? item.oldPricePiece : null

    // Dozen Pricing
    const hasDozen = item.priceDozen && item.priceDozen > 0
    const effectivePriceDozen = isExpired && item.oldPriceDozen && item.oldPriceDozen > 0
        ? item.oldPriceDozen
        : (item.priceDozen || 0)

    const displayOldPriceDozen = (!isExpired && item.oldPriceDozen && item.oldPriceDozen > 0) ? item.oldPriceDozen : null
    // -------------------------

    // Offer Active Logic
    const hasActiveOffer = item.discountEndDate && new Date(item.discountEndDate).getTime() > new Date().getTime() && !isExpired

    // Smart Cart Logic (Piece)
    const cartItemPiece = cart.find(i => i.id === item.id && i.selectedUnit === "حبة")
    const quantityPiece = cartItemPiece ? cartItemPiece.quantity : 0

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
                <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-secondary/10 border border-black/5 dark:border-white/5 shadow-sm">

                    {/* Offer Badges */}
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                        {hasActiveOffer && (
                            <div className="flex items-center gap-1 bg-yellow-400 text-black text-[10px] px-2.5 py-1 rounded-full font-black shadow-sm">
                                <span>🔥</span>
                                <span>عرض</span>
                            </div>
                        )}
                    </div>

                    {/* Timer (Moved to Bottom Left - Simplified) */}
                    {hasActiveOffer && (
                        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-black/5 dark:bg-white/10 backdrop-blur-md px-2 py-1 rounded-md border border-black/5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <CountdownTimer endDate={new Date(item.discountEndDate!)} className="text-[10px] font-medium text-muted-foreground" minimal />
                        </div>
                    )}

                    {/* Image Click Area */}
                    <div
                        className="w-full h-full flex items-center justify-center cursor-pointer relative z-10 transition-transform duration-500 group-hover:scale-105 p-2"
                        onClick={() => onViewDetails?.(item)}
                    >
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                loading="lazy"
                                className="object-contain"
                            />
                        ) : (
                            <div className="text-7xl drop-shadow-lg filter grayscale-[0.2] group-hover:grayscale-0 transition-all">
                                {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                            </div>
                        )}
                    </div>

                    {/* Smart Action Button (Floating) */}
                    {quantityPiece > 0 ? (
                        <div className="absolute bottom-3 right-3 flex items-center bg-black text-white rounded-full shadow-xl shadow-black/20 z-30 h-10 min-w-[100px] justify-between px-1 animate-in fade-in zoom-in duration-200">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (quantityPiece === 1) removeFromCart(item.id, "حبة");
                                    else updateCartQuantity(item.id, "حبة", -1);
                                }}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-sm mx-1 min-w-[1.5rem] text-center">{quantityPiece}</span>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateCartQuantity(item.id, "حبة", 1);
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation()
                                addToCart(item, "حبة", effectivePricePiece)
                            }}
                            className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-black text-white hover:bg-black/90 shadow-lg shadow-black/10 hover:scale-110 active:scale-95 transition-all z-30"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {/* 2. Clean Typography & Secondary Actions */}
                <div className="flex flex-col gap-1 px-1">
                    <div className="flex flex-col items-start gap-1 w-full">
                        <h3
                            className="font-bold text-lg text-foreground leading-tight line-clamp-2 cursor-pointer hover:text-primary transition-colors w-full"
                            onClick={() => onViewDetails?.(item)}
                        >
                            {item.name}
                        </h3>

                        {/* Price Section (Moved Below Name) */}
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="font-black text-xl text-foreground">{effectivePricePiece}</span>
                            <span className="text-sm font-bold text-primary">ر.س</span>
                            {displayOldPricePiece && (
                                <span className="text-[10px] text-red-400 line-through mr-1">{displayOldPricePiece}</span>
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
})
