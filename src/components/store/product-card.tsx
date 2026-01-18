"use client"

import { Plus } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Product, useStore } from "@/context/store-context"

export function ProductCard({ item }: { item: Product }) {
    const { addToCart } = useStore()

    return (
        <Card className="glass-card border-none overflow-hidden group relative bg-black/40 hover:bg-black/60 transition-all duration-500 rounded-3xl">
            {/* Top Glow Accent */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent group-hover:via-primary transition-all" />

            <CardContent className="p-0 relative aspect-[4/3] bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center overflow-hidden">
                {/* Product Image/Icon */}
                <div className="text-5xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 transform-gpu">
                    {item.name.includes("بيبسي") ? "🥤" : item.name.includes("مياه") ? "💧" : "📦"}
                </div>

                {/* Badge */}
                <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-md text-primary text-[8px] px-2 py-1 rounded-lg font-black uppercase tracking-widest border border-primary/20">
                    Featured
                </div>

                {/* Glassy Shadow */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </CardContent>

            <CardFooter className="p-4 flex flex-col items-start gap-3 relative">
                <div className="w-full space-y-1 text-right">
                    <h3 className="font-black text-xs text-white leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.unit}</p>
                </div>

                <div className="flex items-center justify-between w-full mt-1">
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-white">{item.price.toFixed(2)} <span className="text-[8px] text-slate-500">ر.س</span></span>
                    </div>
                    <Button
                        size="icon"
                        onClick={() => addToCart(item)}
                        className="h-9 w-9 rounded-2xl bg-white/5 hover:bg-primary text-slate-400 hover:text-white border border-white/10 hover:border-primary transition-all duration-300"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>

                {/* Interactive Ripple Effect on Click */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-active:opacity-100 transition-opacity" />
            </CardFooter>
        </Card>
    )
}
