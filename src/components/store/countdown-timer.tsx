"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

export function CountdownTimer({ endDate, className, minimal = false }: { endDate: Date, className?: string, minimal?: boolean }) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null)

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime()
            const distance = endDate.getTime() - now

            if (distance < 0) {
                clearInterval(timer)
                setTimeLeft(null)
                return
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [endDate])

    if (!timeLeft) return null

    if (minimal) {
        return (
            <div className={cn("flex items-center gap-1 font-mono leading-none", className)}>
                {timeLeft.days > 0 && <span>{timeLeft.days}ي :</span>}
                <span>{timeLeft.hours.toString().padStart(2, '0')}:</span>
                <span>{timeLeft.minutes.toString().padStart(2, '0')}:</span>
                <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
            </div>
        )
    }

    return (
        <div className={cn("flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5 backdrop-blur-md animate-pulse", className)}>
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-orange-400">
                {timeLeft.days > 0 && <span>{timeLeft.days}ي :</span>}
                <span>{timeLeft.hours.toString().padStart(2, '0')}:</span>
                <span>{timeLeft.minutes.toString().padStart(2, '0')}:</span>
                <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
            </div>
            <span className="text-[8px] text-orange-300/70 mr-1 font-bold">ينتهي قريباً</span>
        </div>
    )
}
