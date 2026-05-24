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

    return (
        <Card className="border border-slate-200/80 dark:border-white/5 overflow-hidden group relative bg-white dark:bg-slate-900/60 hover:border-primary/30 transition-all duration-300 rounded-[2rem] shadow-md hover:shadow-xl hover:-translate-y-1 transform-gpu">
            {/* Top Glow Accent - subtle highlight */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary/70 transition-all" />

            <CardContent className="p-0 relative aspect-[4/3] bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-white/5">
                {/* Product Image/Icon */}
                <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 cursor-pointer relative"
                    onClick={onViewDetails}
                >
                    {item.image ? (
                        <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain p-4 transition-opacity duration-300"
                            unoptimized
                        />
                    ) : (
                        <div className="text-5xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 transform-gpu select-none">
                            {/* Car parts icons */}
                            {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                        </div>
                    )}
                </div>

                {/* Badge & Timer */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
                    <div className="bg-primary/10 dark:bg-primary/20 backdrop-blur-md text-primary text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider border border-primary/20 shadow-sm">
                        Featured
                    </div>
                    {item.discountEndDate && new Date(item.discountEndDate).getTime() > new Date().getTime() && (
                        <CountdownTimer endDate={new Date(item.discountEndDate)} />
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 flex flex-col items-start gap-4 relative">
                {/* Product Title */}
                <div className="w-full text-right">
                    <h3 
                        className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 cursor-pointer min-h-[2.5rem]"
                        onClick={onViewDetails}
                    >
                        {item.name}
                    </h3>
                </div>

                {/* Pricing & Add Buttons */}
                <div className="w-full grid gap-2.5">
                    {/* Piece Option */}
                    <div className="flex items-center justify-between bg-slate-50/70 dark:bg-white/5 rounded-2xl p-2.5 border border-slate-100 dark:border-white/5 shadow-inner transition-colors duration-300">
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[10px] text-slate-400 font-bold">حبة</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {item.pricePiece} <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">ر.س</span>
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => addToCart(item, "حبة", item.pricePiece)}
                            className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all p-0 flex items-center justify-center cursor-pointer group-hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Dozen Option (if available) */}
                    {hasDozen && (
                        <div className="flex items-center justify-between bg-slate-50/70 dark:bg-white/5 rounded-2xl p-2.5 border border-slate-100 dark:border-white/5 shadow-inner transition-colors duration-300">
                            <div className="flex flex-col items-start text-left">
                                <span className="text-[10px] text-slate-400 font-bold">كرتون</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {item.priceDozen} <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">ر.س</span>
                                </span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => addToCart(item, "كرتون", item.priceDozen!)}
                                className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all p-0 flex items-center justify-center cursor-pointer group-hover:scale-105 active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Interactive Ripple Effect on Click */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />
            </CardFooter>
        </Card>
    )
}
