"use client"

import { Plus } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Product, useStore } from "@/context/store-context"
import { CountdownTimer } from "./countdown-timer"
import { motion } from "framer-motion"

export function ProductCard({ item, onViewDetails, index = 0 }: { item: Product, onViewDetails?: () => void, index?: number }) {
    const { addToCart } = useStore()

    const hasDozen = item.priceDozen && item.priceDozen > 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="h-full"
        >
            <Card className="glass-card h-full border-none overflow-hidden group relative transition-all duration-300 rounded-[2rem]">

                <CardContent className="p-0 relative aspect-[4/3] bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center overflow-hidden">
                    {/* Product Image/Icon */}
                    <div
                        className="w-full h-full flex items-center justify-center cursor-pointer relative z-10"
                        onClick={onViewDetails}
                    >
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                loading="lazy"
                                className="object-cover opacity-100 group-hover:scale-110 transition-transform duration-700"
                                unoptimized
                            />
                        ) : (
                            <div className="text-6xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 transform-gpu">
                                {item.name.includes("زيت") ? "🛢️" : item.name.includes("فلتر") ? "⚙️" : item.name.includes("بطارية") ? "🔋" : "🔧"}
                            </div>
                        )}
                    </div>

                    {/* Badge & Timer */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-20">
                        {/* Only show Featured if relevant (example logic) */}
                        <div className="bg-black/40 backdrop-blur-md text-white/90 text-[10px] px-2.5 py-1 rounded-full font-bold border border-white/10 shadow-lg">
                            جديد
                        </div>
                        {item.discountEndDate && new Date(item.discountEndDate).getTime() > new Date().getTime() && (
                            <CountdownTimer endDate={new Date(item.discountEndDate)} />
                        )}
                    </div>

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                </CardContent>

                <CardFooter className="p-4 flex flex-col items-start gap-3 relative z-20 -mt-2 bg-card/50 backdrop-blur-sm">
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
                                <span className="text-sm font-black text-foreground">{item.pricePiece} <span className="text-[10px] text-primary font-normal">ر.س</span></span>
                            </div>
                            <Button
                                size="sm"
                                onClick={(e) => {
                                    addToCart(item, "حبة", item.pricePiece)
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
                                    <span className="text-sm font-black text-foreground">{item.priceDozen} <span className="text-[10px] text-purple-500 font-normal">ر.س</span></span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        addToCart(item, "كرتون", item.priceDozen!)
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
}
