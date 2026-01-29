"use client"

import { useState } from "react"
import { Lock, Unlock } from "lucide-react"

export function PasswordReveal({ password }: { password?: string }) {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <button
            type="button"
            className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-2 py-1 rounded-md transition-all select-none relative z-20"
            title={isVisible ? "إخفاء" : "إظهار"}
            onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsVisible(!isVisible)
            }}
        >
            {isVisible ? (
                <>
                    <Unlock className="w-3 h-3 text-emerald-400" />
                    <span className="font-mono text-[10px] sm:text-xs text-white">{password || "غير مسجل"}</span>
                </>
            ) : (
                <>
                    <Lock className="w-3 h-3 text-rose-500" />
                    <span className="font-mono tracking-widest text-slate-400">•••••••</span>
                </>
            )}
        </button>
    )
}
