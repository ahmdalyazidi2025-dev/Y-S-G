"use client"

import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import { motion } from "framer-motion"

export function CategoryStories({ selectedCategory, onSelect }: { selectedCategory: string, onSelect: (cat: string) => void }) {
    const { categories } = useStore()

    // Default categories if none exist in DB, but we'll use "الكل" + DB categories
    const allCategories = ["الكل", ...categories.map(c => c.nameAr)]

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-4 pt-2">
            {allCategories.map((cat, idx) => {
                const isActive = selectedCategory === cat
                const dbCat = categories.find(c => c.nameAr === cat)

                return (
                    <motion.button
                        key={cat}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            onSelect(cat)
                            hapticFeedback('light')
                        }}
                        className="flex flex-col items-center gap-2 flex-shrink-0"
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-full p-0.5 transition-all duration-300",
                            isActive
                                ? "bg-gradient-to-tr from-primary to-accent scale-110 shadow-lg shadow-primary/20"
                                : "bg-white/10"
                        )}>
                            <div className="w-full h-full rounded-full bg-[#101c26] border-2 border-[#101c26] overflow-hidden flex items-center justify-center">
                                {dbCat?.image ? (
                                    <img src={dbCat.image} alt={cat} className="w-full h-full object-cover" />
                                ) : (
                                    <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-slate-500")}>
                                        {cat === "الكل" ? "🏠" : cat.charAt(0)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold transition-colors",
                            isActive ? "text-white" : "text-slate-500"
                        )}>
                            {cat}
                        </span>
                    </motion.button>
                )
            })}
        </div>
    )
}
