"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className={cn(
            "relative flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 shadow-inner w-[84px] h-[40px] cursor-pointer transition-colors duration-300",
            className
        )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            {/* Sliding Pill */}
            <div className={cn(
                "absolute top-1 bottom-1 w-[36px] rounded-full shadow-sm transition-all duration-300 flex items-center justify-center z-10",
                theme === "dark"
                    ? "left-[43px] bg-slate-700 text-white"
                    : "left-1 bg-white text-orange-500"
            )}>
                {theme === "dark" ? (
                    <Moon className="w-4 h-4 fill-current" />
                ) : (
                    <Sun className="w-4 h-4 fill-current" />
                )}
            </div>

            {/* Background Icons (Inactive State) */}
            <div className="w-full flex justify-between px-2.5">
                <div className="w-[36px] flex items-center justify-center">
                    <Sun className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        theme === "dark" ? "text-slate-500 hover:text-slate-400" : "opacity-0"
                    )} />
                </div>
                <div className="w-[36px] flex items-center justify-center">
                    <Moon className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        theme === "light" ? "text-slate-400 hover:text-slate-600" : "opacity-0"
                    )} />
                </div>
            </div>
        </div>
    )
}
