"use client"

import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import { motion } from "framer-motion"
import Image from "next/image"

import { useRouter } from "next/navigation"

import { InteractiveMarquee } from "@/components/shared/interactive-marquee"

export function CategoryStories({ selectedCategory, onSelect }: { selectedCategory: string, onSelect: (cat: string) => void }) {
    const { categories, storeSettings } = useStore()
    const router = useRouter()

    const activeCategories = categories.filter(c => !c.isHidden && c.id !== "all-category" && c.nameAr !== "الكل")
    const allCategories = ["الكل", ...activeCategories.map(c => c.nameAr)]

    const handleCategoryClick = (cat: string) => {
        hapticFeedback('light')
        onSelect(cat)
    }

    return (
        <InteractiveMarquee speed={0.5} className="pb-6 pt-2">
            {allCategories.map((cat, idx) => {
                const isActive = selectedCategory === cat
                const dbCat = categories.find(c => c.nameAr === cat)
                const imageToUse = cat === "الكل" ? storeSettings?.allCategoryImage : dbCat?.image;

                return (
                    <motion.button
                        key={cat}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05, type: "spring" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCategoryClick(cat)}
                        className="flex flex-col items-center gap-2 flex-shrink-0 group"
                    >
                        <div className={cn(
                            "w-20 h-20 rounded-full p-[2px] transition-all duration-300 relative",
                            isActive
                                ? "bg-gradient-to-tr from-primary via-purple-500 to-amber-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]"
                                : "bg-white/10 group-hover:bg-white/20"
                        )}>
                            <div className="w-full h-full rounded-full bg-black border-[3px] border-black overflow-hidden flex items-center justify-center relative z-10">
                                {imageToUse ? (
                                    <Image
                                        src={imageToUse}
                                        alt={cat}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        width={80}
                                        height={80}
                                        unoptimized
                                    />
                                ) : (
                                    <span className={cn("text-3xl transition-transform group-hover:scale-125", isActive ? "grayscale-0" : "grayscale opacity-70")}>
                                        {cat === "الكل" ? "🏠" : "✨"}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className={cn(
                            "text-xs font-bold transition-colors text-center w-full truncate px-1",
                            isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                            {cat}
                        </span>
                    </motion.button>
                )
            })}
        </InteractiveMarquee>
    )
}
