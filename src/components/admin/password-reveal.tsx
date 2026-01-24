"use client"

import { useState } from "react"
import { Lock, Unlock } from "lucide-react"

export function PasswordReveal({ password }: { password?: string }) {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div
            className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
            title={isVisible ? "إخفاء" : "إظهار"}
            onClick={() => setIsVisible(!isVisible)}
        >
            {isVisible ? (
                <>
                    <Unlock className="w-3 h-3 text-emerald-400" />
                    <span className="font-mono">{password || "غير مسجل"}</span>
                </>
            ) : (
                <>
                    <Lock className="w-3 h-3 text-rose-500" />
                    <span className="font-mono tracking-wider">••••••</span>
                </>
            )}
        </div>
    )
}
