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
            className="h-full"
        >
            <Card className={cn(
                "h-full border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 rounded-[24px] overflow-hidden group relative bg-card",
                hasActiveOffer ? "ring-1 ring-yellow-500/50" : "hover:border-primary/50"
            )}>
                {/* Offer Shine Effect */}
                {hasActiveOffer && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 via-transparent to-transparent pointer-events-none z-0" />
                )}

                <CardContent className="p-0 relative aspect-square bg-secondary/20 flex items-center justify-center overflow-hidden">
                    {/* Product Image/Icon */}
                    <div
                        className="w-full h-full flex items-center justify-center cursor-pointer relative z-10"
                        onClick={() => onViewDetails?.(item)}
                    >
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                loading="lazy"
                                className="object-cover opacity-100 group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="text-8xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 transform-gpu drop-shadow-2xl filter">
                                {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                            </div>
                        )}
                    </div>

                    {/* Badge & Timer */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-20">
                        {hasActiveOffer ? (
                            <div className="flex items-center gap-1 bg-yellow-500 text-black text-[10px] px-2.5 py-1 rounded-full font-black shadow-[0_0_15px_-3px_rgba(234,179,8,0.6)] animate-pulse">
                                <span>🔥</span>
                                <span>عرض خاص</span>
                            </div>
                        ) : (
                            <div className="bg-background/80 backdrop-blur-md text-foreground text-[10px] px-2 py-1 rounded-lg font-bold border border-border/50 shadow-sm">
                                جديد
                            </div>
                        )}

                        {hasActiveOffer && (
                            <CountdownTimer endDate={new Date(item.discountEndDate!)} />
                        )}
                    </div>

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                </CardContent>

                <CardFooter className="p-3 flex flex-col items-start gap-2 relative z-20 bg-card pt-3">
                    <div className="w-full space-y-1 text-right">
                        <h3 className="font-bold text-sm text-foreground leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">
                            {item.name}
                        </h3>
                    </div>

                    {/* Pricing & Add Buttons */}
                    <div className="w-full grid gap-2 mt-auto">
                        {/* Piece Option */}
                        <div className="flex items-center justify-between bg-accent/50 hover:bg-accent rounded-xl p-1.5 pl-2 border border-border transition-colors group/btn">
                            <div className="flex flex-col items-start px-2">
                                <span className="text-[10px] text-muted-foreground group-hover/btn:text-foreground transition-colors">بالحبة</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-foreground">{effectivePricePiece} <span className="text-[10px] text-primary font-normal">ر.س</span></span>
                                    {displayOldPricePiece && (
                                        <span className="text-[10px] text-red-400 line-through decoration-red-400/50">{displayOldPricePiece}</span>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    addToCart(item, "حبة", effectivePricePiece)
                                }}
                                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all p-0 group-hover/btn:animate-pulse"
                            >
                                <Plus className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Dozen Option (if available) */}
                        {hasDozen && (
                            <div className="flex items-center justify-between bg-accent/50 hover:bg-accent rounded-xl p-1.5 pl-2 border border-border transition-colors group/btn-dozen">
                                <div className="flex flex-col items-start px-2">
                                    <span className="text-[10px] text-muted-foreground group-hover/btn-dozen:text-foreground transition-colors">بالكرتون</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-foreground">{effectivePriceDozen} <span className="text-[10px] text-purple-500 font-normal">ر.س</span></span>
                                        {displayOldPriceDozen && (
                                            <span className="text-[10px] text-red-400 line-through decoration-red-400/50">{displayOldPriceDozen}</span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        addToCart(item, "كرتون", effectivePriceDozen)
                                    }}
                                    className="h-10 w-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all p-0 group-hover/btn-dozen:animate-pulse"
                                >
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}, (prev, next) => {
    // Custom comparison for better performance
    return prev.item.id === next.item.id &&
        prev.item.pricePiece === next.item.pricePiece &&
        prev.item.priceDozen === next.item.priceDozen &&
        prev.item.discountEndDate === next.item.discountEndDate &&
        prev.item.oldPricePiece === next.item.oldPricePiece &&
        prev.item.name === next.item.name // In case name changes
})
