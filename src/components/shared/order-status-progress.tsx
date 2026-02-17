"use client"

import { cn } from "@/lib/utils"
import { Check, Clock, Package, Truck, Home } from "lucide-react"

type Status = "pending" | "processing" | "shipped" | "delivered" | "canceled" | "accepted" | "rejected" | "deleted"

const STAGES = [
    { key: "pending", label: "بانتظار التأكيد", icon: Clock },
    { key: "processing", label: "جاري التجهيز", icon: Package },
    { key: "shipped", label: "جاري التوصيل", icon: Truck },
    { key: "delivered", label: "تم التسليم", icon: Home },
]

export function OrderStatusProgress({ status }: { status: Status }) {
    if (status === "canceled" || status === "rejected" || status === "deleted") {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                <p className="text-red-400 font-bold text-sm">
                    {status === "canceled" ? "تم إلغاء هذا الطلب" :
                        status === "rejected" ? "تم رفض هذا الطلب" :
                            "تم حذف هذا الطلب"}
                </p>
            </div>
        )
    }

    // Map 'accepted' to 'processing' stage for visualization if needed, or keep distinct.
    // For now, let's treat 'pending' and 'accepted' as the first stage, 'processing' as second.
    const getStageIndex = (s: Status) => {
        if (s === "pending" || s === "accepted") return 0
        if (s === "processing") return 1
        if (s === "shipped") return 2
        if (s === "delivered") return 3
        return 0
    }

    const activeIdx = getStageIndex(status)

    return (
        <div className="py-6">
            <div className="relative flex justify-between">
                {/* Connecting Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/5 -z-10" />
                <div
                    className="absolute top-5 right-0 h-0.5 bg-primary transition-all duration-500 -z-10"
                    style={{
                        width: `${(activeIdx / (STAGES.length - 1)) * 100}%`,
                        left: "auto"
                    }}
                />

                {STAGES.map((stage, idx) => {
                    const Icon = stage.icon
                    const isCompleted = idx < activeIdx
                    const isActive = idx === activeIdx

                    return (
                        <div key={stage.key} className="flex flex-col items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                isCompleted ? "bg-primary border-primary text-white" :
                                    isActive ? "bg-[#1c2a36] border-primary text-primary shadow-lg shadow-primary/20" :
                                        "bg-[#1c2a36] border-white/5 text-slate-600"
                            )}>
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold text-center max-w-[60px] leading-tight",
                                isActive ? "text-white" : "text-slate-500"
                            )}>
                                {stage.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
