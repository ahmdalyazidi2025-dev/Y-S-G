"use client"

import { useState, ReactNode } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { RefreshCcw } from "lucide-react"

export function PullToRefresh({ children }: { onRefresh: () => Promise<void>, children: ReactNode }) {
    const [isRefreshing] = useState(false)
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, -100], [0, 100])
    const opacity = useTransform(scrollY, [0, -100], [0, 1])

    return (
        <div className="relative">
            <motion.div
                style={{ y, opacity }}
                className="absolute top-0 left-0 right-0 flex justify-center py-4 pointer-events-none"
            >
                <div className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-xl">
                    <RefreshCcw className={isRefreshing ? "w-5 h-5 text-primary animate-spin" : "w-5 h-5 text-primary"} />
                </div>
            </motion.div>
            {children}
        </div>
    )
}
