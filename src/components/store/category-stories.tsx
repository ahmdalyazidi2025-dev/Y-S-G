"use client"

import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import { motion } from "framer-motion"
import Image from "next/image"

import { useRouter } from "next/navigation"

export function CategoryStories({ selectedCategory, onSelect }: { selectedCategory: string, onSelect: (cat: string) => void }) {
    const { categories } = useStore()
    const router = useRouter()

    // Default categories if none exist in DB, but we'll use "الكل" + DB categories
    const allCategories = ["الكل", ...categories.map(c => c.nameAr)]

    const handleCategoryClick = (cat: string, id?: string) => {
        hapticFeedback('light')
        if (cat === "الكل") {
            onSelect(cat) // Keep default behavior for "All" on home page
            router.push('/customer')
        } else if (id) {
            // Navigate to dedicated category page
            router.push(`/customer/category/${id}`)
        } else {
            // Fallback for mock data if ID missing
            onSelect(cat)
        }
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar px-4 pt-2">
            {allCategories.map((cat, idx) => {
                const isActive = selectedCategory === cat
                const dbCat = categories.find(c => c.nameAr === cat)

                return (
                    <motion.button
                        key={cat}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05, type: "spring" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleCategoryClick(cat, dbCat?.id)}
                        className="flex flex-col items-center gap-2 flex-shrink-0 group"
                    >
                        <div className={cn(
                            "w-14 h-14 rounded-full p-[2px] transition-all duration-300 relative",
                            isActive
                                ? "bg-gradient-to-tr from-primary via-purple-500 to-amber-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]"
                                : "bg-white/10 group-hover:bg-white/20"
                        )}>
                            <div className="w-full h-full rounded-full bg-black border-[3px] border-black overflow-hidden flex items-center justify-center relative z-10">
                                {dbCat?.image ? (
                                    <Image
                                        src={dbCat.image}
                                        alt={cat}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        width={72}
                                        height={72}
                                        unoptimized
                                    />
                                ) : (
                                    <span className={cn("text-xl transition-transform group-hover:scale-125", isActive ? "grayscale-0" : "grayscale opacity-70")}>
                                        {cat === "الكل" ? "🏠" : "✨"}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className={cn(
                            "text-[11px] font-bold transition-colors text-center w-full truncate px-1",
                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}>
                            {cat}
                        </span>
                    </motion.button>
                )
            })}
        </div>
    )
}
