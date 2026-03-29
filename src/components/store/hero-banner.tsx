"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { getFontClass } from "@/lib/fonts"

export function HeroBanner() {
    const { banners } = useStore()
    const activeBanners = banners.filter(b => b.active)
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(0)



    const handleNext = useCallback(() => {
        setDirection(1)
        setCurrent((prev) => (prev + 1) % activeBanners.length)
    }, [activeBanners.length])

    const handlePrev = useCallback(() => {
        setDirection(-1)
        setCurrent((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
    }, [activeBanners.length])

    useEffect(() => {
        if (activeBanners.length <= 1) return
        const timer = setInterval(() => {
            handleNext()
        }, 5000)
        return () => clearInterval(timer)
    }, [current, activeBanners.length, handleNext])

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 1.1
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.95
        })
    }

    if (activeBanners.length === 0) {
        return (
            <div className="relative w-full h-[450px] bg-slate-900 flex items-center justify-center rounded-b-[3rem] overflow-hidden shadow-2xl">
                <div className="text-center space-y-2">
                    <span className="text-6xl">🛍️</span>
                    <p className="text-slate-500 font-medium">لا توجد عروض حالياً</p>
                </div>
                {/* Ambient BG */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            </div>
        )
    }

    return (
        <div className="relative w-full h-[450px] overflow-hidden rounded-b-[3rem] shadow-2xl group">
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={current}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.5 },
                        scale: { duration: 0.5 }
                    }}
                    className="absolute inset-0 w-full h-full"
                >
                    <div className="relative w-full h-full">
                        <Image
                            src={activeBanners[current].image}
                            alt={activeBanners[current].title || "banner"}
                            fill
                            sizes="100vw"
                            priority
                            className="object-cover"
                            unoptimized
                        />

                        {/* Cinematic Gradients */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent opacity-60" />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-end pb-32 px-6 sm:px-10">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="max-w-2xl"
                            >
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 w-fit rounded-full text-white text-xs font-bold mb-4 shadow-lg flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    عروض حصرية 🔥
                                </div>
                                <h2 
                                    className={cn("text-4xl sm:text-5xl md:text-6xl font-black drop-shadow-2xl mb-4 leading-tight tracking-tight", getFontClass(activeBanners[current].fontFamily))}
                                    style={{ color: activeBanners[current].textColor || 'white', textShadow: activeBanners[current].textColor && activeBanners[current].textColor !== '#ffffff' ? '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(255,255,255,0.4)' : '0 4px 12px rgba(0,0,0,0.6)' }}
                                >
                                    {activeBanners[current].title || "تخفيضات الموسم"}
                                </h2>
                                <p 
                                    className={cn("text-base sm:text-lg font-medium max-w-xl leading-relaxed drop-shadow-lg line-clamp-2", getFontClass(activeBanners[current].fontFamily))}
                                    style={{ color: activeBanners[current].textColor || 'rgb(226, 232, 240)', textShadow: activeBanners[current].textColor && activeBanners[current].textColor !== '#ffffff' ? '0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.5)' : '0 2px 8px rgba(0,0,0,0.8)' }}
                                >
                                    {activeBanners[current].description || "استفد من خصومات حصرية لفترة محدودة على جميع المنتجات الجديدة"}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2 z-20">
                {activeBanners.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            setDirection(idx > current ? 1 : -1)
                            setCurrent(idx)
                        }}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300 backdrop-blur-sm",
                            current === idx
                                ? "w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                : "bg-white/30 hover:bg-white/50"
                        )}
                    />
                ))}
            </div>

            {/* Arrows (Visible on Hover/Desktop) */}
            {activeBanners.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 hover:scale-110 z-20"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 hover:scale-110 z-20"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    )
}
