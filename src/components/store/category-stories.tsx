"use client"

import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRef, useEffect } from "react"

export function CategoryStories({ selectedCategory, onSelect }: { selectedCategory: string, onSelect: (cat: string) => void }) {
    const { categories, storeSettings } = useStore()
    const containerRef = useRef<HTMLDivElement>(null)

    // Filter out hidden categories from customer view
    const visibleCategories = categories.filter(c => !c.isHidden)

    // "الكل" + DB categories
    const allCategories = ["الكل", ...visibleCategories.map(c => c.nameAr)]

    useEffect(() => {
        const timer = setTimeout(() => {
            const container = containerRef.current
            if (!container) return

            // Smoothly scroll to the left (reveal items)
            // In RTL, moving left means scrollLeft decreases (becomes negative).
            container.scrollBy({ left: -150, behavior: 'smooth' })

            // Wait 1.2 seconds, then scroll back to start (0)
            const returnTimer = setTimeout(() => {
                container.scrollTo({ left: 0, behavior: 'smooth' })
            }, 1200)

            return () => clearTimeout(returnTimer)
        }, 1000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div 
            ref={containerRef}
            className="flex gap-6 overflow-x-auto pb-4 no-scrollbar px-4 pt-2 w-full scroll-smooth"
        >
            {allCategories.map((cat) => {
                const isActive = selectedCategory === cat
                const dbCat = categories.find(c => c.nameAr === cat)

                return (
                    <motion.button
                        key={cat}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                            onSelect(cat)
                            hapticFeedback('light')
                        }}
                        className="flex flex-col items-center gap-2.5 flex-shrink-0 cursor-pointer group"
                    >
                        {/* Outer Glow Circle - w-20 h-20 with thin sleek border */}
                        <div className={cn(
                            "w-20 h-20 rounded-full p-[3px] transition-all duration-300 ease-out border shadow-sm",
                            isActive
                                ? "bg-gradient-to-tr from-primary via-blue-500 to-emerald-400 scale-110 shadow-lg shadow-primary/20 border-transparent"
                                : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 group-hover:border-primary/30 group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                        )}>
                            {/* Inner Circle Frame */}
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-colors shadow-inner">
                                {cat === "الكل" ? (
                                    <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                        <Image 
                                            src={storeSettings?.logoUrl || "/logo.png"} 
                                            alt={cat} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                            width={80} 
                                            height={80} 
                                            unoptimized
                                        />
                                    </div>
                                ) : dbCat?.image ? (
                                    <Image 
                                        src={dbCat.image} 
                                        alt={cat} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        width={80} 
                                        height={80} 
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 font-black text-sm">
                                        {cat.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Story Label */}
                        <span className={cn(
                            "text-xs font-black transition-all duration-300 whitespace-nowrap px-1 rounded-md",
                            isActive 
                                ? "text-primary scale-105" 
                                : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        )}>
                            {cat}
                        </span>
                    </motion.button>
                )
            })}
        </div>
    )
}
