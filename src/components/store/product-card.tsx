"use client"

import { Plus } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Product, useStore } from "@/context/store-context"
import { CountdownTimer } from "./countdown-timer"
import { cn } from "@/lib/utils"

export function ProductCard({ item, onViewDetails }: { item: Product, onViewDetails?: () => void }) {
    const { addToCart } = useStore()

    const hasDozen = item.priceDozen && item.priceDozen > 0
    const hasDiscountPiece = item.oldPricePiece && item.oldPricePiece > item.pricePiece
    const hasDiscountDozen = item.oldPriceDozen && item.oldPriceDozen && item.oldPriceDozen > item.priceDozen!

    return (
        <Card className="border border-slate-100 dark:border-slate-800/80 overflow-hidden group relative bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] dark:hover:border-white/10 transition-all duration-300 hover:-translate-y-1 transform-gpu flex flex-col justify-between h-full">
            {/* Top Glow Accent - subtle highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary/50 transition-all" />

            <div>
                {/* Product Image/Icon - Rectangular Portrait aspect-[3/4] - mمتلئة بالكامل p-0 object-cover */}
                <div className="relative aspect-[3/4] bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-white/5">
                    <div
                        className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 cursor-pointer relative"
                        onClick={onViewDetails}
                    >
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover p-0 transition-opacity duration-300"
                                unoptimized
                            />
                        ) : (
                            <div className="text-4xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 transform-gpu select-none">
                                {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                            </div>
                        )}
                    </div>

                    {/* Badge & Timer */}
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                        {item.discountEndDate && new Date(item.discountEndDate).getTime() > new Date().getTime() && (
                            <CountdownTimer endDate={new Date(item.discountEndDate)} />
                        )}
                    </div>
                </div>

                {/* Product Title - Sized down to save space */}
                <div className="px-2 pt-2 text-right">
                    <h3 
                        className="font-bold text-[11px] sm:text-[12px] text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 cursor-pointer min-h-[2rem]"
                        onClick={onViewDetails}
                    >
                        {item.name}
                    </h3>
                </div>
            </div>

            <CardFooter className="p-2 pt-1 flex flex-col items-start gap-1.5 relative">
                {/* Piece Price Section - More compact padding and smaller sizes */}
                <div className="w-full flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-1.5 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors duration-200">
                    <div className="flex flex-col items-start text-left select-none">
                        <span className="text-[8px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded font-black mb-0.5">
                            حبة
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] sm:text-[12px] font-black text-emerald-600 dark:text-emerald-400">
                                {item.pricePiece} <small className="text-[7px]">ر.س</small>
                            </span>
                            {hasDiscountPiece && (
                                <span className="text-[9px] text-rose-500 line-through font-semibold whitespace-nowrap">
                                    {item.oldPricePiece}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => addToCart(item, "حبة", item.pricePiece)}
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20 transition-all p-0 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                </div>

                {/* Dozen Price Section - Render invisible spacer if unavailable to maintain perfect uniform card heights across all sections */}
                {hasDozen ? (
                    <div className="w-full flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-1.5 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors duration-200">
                        <div className="flex flex-col items-start text-left select-none">
                            <span className="text-[8px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded font-black mb-0.5">
                                كرتون
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="text-[11px] sm:text-[12px] font-black text-emerald-600 dark:text-emerald-400">
                                    {item.priceDozen} <small className="text-[7px]">ر.س</small>
                                </span>
                                {hasDiscountDozen && (
                                    <span className="text-[9px] text-rose-500 line-through font-semibold whitespace-nowrap">
                                        {item.oldPriceDozen}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => addToCart(item, "كرتون", item.priceDozen!)}
                            className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20 transition-all p-0 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </Button>
                    </div>
                ) : (
                    <div className="w-full h-[38px] opacity-0 pointer-events-none select-none" aria-hidden="true" />
                )}

                {/* Interactive Ripple Effect on Click */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none rounded-3xl" />
            </CardFooter>
        </Card>
    )
}
