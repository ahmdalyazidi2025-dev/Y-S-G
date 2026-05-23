"use client"

import { Plus } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Product, useStore } from "@/context/store-context"
import { CountdownTimer } from "./countdown-timer"

export function ProductCard({ item, onViewDetails }: { item: Product, onViewDetails?: () => void }) {
    const { addToCart } = useStore()

    const hasDozen = item.priceDozen && item.priceDozen > 0

    return (
        <Card className="glass-card border-none overflow-hidden group relative bg-black/40 hover:bg-black/60 transition-all duration-500 rounded-3xl">
            {/* Top Glow Accent */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent group-hover:via-primary transition-all" />

            <CardContent className="p-0 relative aspect-[4/3] bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center overflow-hidden">
                {/* Product Image/Icon */}
                <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                    onClick={onViewDetails}
                >
                    {item.image ? (
                        <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            unoptimized
                        />
                    ) : (
                        <div className="text-5xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 transform-gpu">
                            {/* Car parts icons */}
                            {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                        </div>
                    )}
                </div>

                {/* Badge & Timer */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                    <div className="bg-primary/20 backdrop-blur-md text-primary text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-widest border border-primary/20">
                        Featured
                    </div>
                    {item.discountEndDate && new Date(item.discountEndDate).getTime() > new Date().getTime() && (
                        <CountdownTimer endDate={new Date(item.discountEndDate)} />
                    )}
                </div>

                {/* Glassy Shadow */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </CardContent>

            <CardFooter className="p-4 flex flex-col items-start gap-3 relative">
                <div className="w-full space-y-1 text-right">
                    <h3 className="font-black text-xs text-white leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                </div>

                {/* Pricing & Add Buttons */}
                <div className="w-full grid gap-2">
                    {/* Piece Option */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-2 border border-white/5">
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] text-slate-400">حبة</span>
                            <span className="text-xs font-black text-white">{item.pricePiece} <span className="text-[8px] text-slate-500">ر.س</span></span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => addToCart(item, "حبة", item.pricePiece)}
                            className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all p-0"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Dozen Option (if available) */}
                    {hasDozen && (
                        <div className="flex items-center justify-between bg-white/5 rounded-xl p-2 border border-white/5">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] text-slate-400">كرتون</span>
                                <span className="text-xs font-black text-white">{item.priceDozen} <span className="text-[8px] text-slate-500">ر.س</span></span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => addToCart(item, "كرتون", item.priceDozen!)}
                                className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all p-0"
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
