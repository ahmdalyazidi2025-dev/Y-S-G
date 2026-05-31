"use client"

import { Plus, Share2 } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Product, useStore } from "@/context/store-context"
import { CountdownTimer } from "./countdown-timer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ProductCard({ item, onViewDetails }: { item: Product, onViewDetails?: () => void }) {
    const { addToCart } = useStore()

    const hasDozen = item.priceDozen && item.priceDozen > 0
    const hasDiscountPiece = item.oldPricePiece && item.oldPricePiece > item.pricePiece
    const hasDiscountDozen = item.oldPriceDozen && item.oldPriceDozen && item.oldPriceDozen > item.priceDozen!

    return (
        <Card className="border-none overflow-visible group relative bg-white dark:bg-slate-900/40 transition-all duration-300 flex flex-col justify-between h-full text-right p-0 select-none shadow-none">
            
            {/* Transparent & Borderless Image Container - Giving the image a completely "free" floaty style */}
            <div className="relative aspect-[3/4] bg-transparent flex items-center justify-center overflow-visible transition-all duration-300">
                {/* Main Product Image */}
                <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.04] cursor-pointer relative"
                    onClick={onViewDetails}
                >
                    {item.image ? (
                        <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain p-1 transition-opacity duration-300"
                            unoptimized
                        />
                    ) : (
                        <div className="text-5xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 transform-gpu select-none">
                            {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                        </div>
                    )}
                </div>

                {/* Floating Discount Badges */}
                <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-1 items-end">
                    {hasDiscountPiece && (
                        <div className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-md font-black shadow-sm tracking-wider">
                            أفضل العروض
                        </div>
                    )}
                    {item.discountEndDate && new Date(item.discountEndDate).getTime() > new Date().getTime() && (
                        <CountdownTimer endDate={new Date(item.discountEndDate)} />
                    )}
                </div>

                {/* Floating Share Button on the Top-Left */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        const link = `${window.location.origin}/customer?product=${item.id}`
                        navigator.clipboard.writeText(link)
                        toast.success("تم نسخ رابط المنتج لمشاركته عبر الواتساب 🎉")
                    }}
                    className="absolute top-1.5 left-1.5 z-10 p-1.5 bg-white/90 dark:bg-black/35 hover:bg-white dark:hover:bg-black/50 text-blue-500 rounded-lg backdrop-blur-sm transition-all shadow-sm border border-slate-200/50 dark:border-white/5 cursor-pointer"
                    title="نسخ رابط المنتج"
                >
                    <Share2 className="w-3.5 h-3.5" />
                </button>

                {/* Bigger & Outward-Pushing Premium Primary Color Plus (+) Button on the Bottom-Left */}
                <Button
                    size="sm"
                    onClick={() => addToCart(item, "حبة", item.pricePiece)}
                    className="absolute -bottom-1 -left-1 bg-primary hover:bg-primary/95 text-white h-9 w-9 sm:h-10 sm:w-10 rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center cursor-pointer transition-all active:scale-90 z-20 border border-white/10"
                    title="إضافة حبة للسلة"
                >
                    <Plus className="h-5 w-5 text-white" strokeWidth={3.5} />
                </Button>
            </div>

            {/* Product Metadata & Price Details */}
            <div className="flex-1 flex flex-col justify-between pt-4 px-1 pb-2">
                {/* Title section - Clamped up to 3 lines */}
                <div className="space-y-1">
                    <h3 
                        className="font-bold text-[11px] sm:text-[12px] text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-3 cursor-pointer min-h-[2.5rem]"
                        onClick={onViewDetails}
                    >
                        {item.name}
                    </h3>
                </div>

                {/* Pricing options section */}
                <div className="mt-2 space-y-1.5">
                    {/* Piece (حبة) price display - Slashed in Red, current in larger Green */}
                    <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] sm:text-[15px] font-black text-emerald-600 dark:text-emerald-400">
                                {item.pricePiece} <small className="text-[8px] font-bold">ر.س</small>
                            </span>
                            {hasDiscountPiece && (
                                <span className="text-[10px] sm:text-[11px] text-rose-500 line-through font-semibold whitespace-nowrap">
                                    {item.oldPricePiece}
                                </span>
                            )}
                            {hasDiscountPiece && (
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black">
                                    وفر {Math.round(((item.oldPricePiece! - item.pricePiece) / item.oldPricePiece!) * 100)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Dozen (كرتون) price display - secondary elegant row */}
                    {hasDozen ? (
                        <div className="flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/10 border border-slate-100 dark:border-white/5 rounded-xl p-1.5 transition-colors duration-200 mt-1">
                            <div className="flex items-center gap-1">
                                <Button
                                    size="sm"
                                    onClick={() => addToCart(item, "كرتون", item.priceDozen!)}
                                    className="h-5 w-5 rounded-md bg-primary hover:bg-primary/95 text-white shadow-sm p-0 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                                >
                                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                                </Button>
                                <div className="flex flex-col items-start text-left select-none mr-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] sm:text-[11px] font-black text-slate-700 dark:text-slate-300">
                                            {item.priceDozen} <small className="text-[7px]">ر.س</small>
                                        </span>
                                        {hasDiscountDozen && (
                                            <span className="text-[8px] text-rose-500 line-through font-bold">
                                                {item.oldPriceDozen}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[8px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-black">
                                كرتون
                            </span>
                        </div>
                    ) : (
                        /* Invisible placeholder of the exact dozen row height for perfect system-wide card layout alignment */
                        <div className="h-[28px] opacity-0 pointer-events-none select-none" aria-hidden="true" />
                    )}
                </div>
            </div>
        </Card>
    )
}
