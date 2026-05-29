"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowUpDown, ChevronUp, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category, useStore } from "@/context/store-context"
import { toast } from "sonner"

interface CategorySortModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CategorySortModal({ isOpen, onClose }: CategorySortModalProps) {
    const { categories, updateCategory } = useStore()
    const [localCategories, setLocalCategories] = useState<Category[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // Sync categories locally when modal opens
    useEffect(() => {
        if (isOpen) {
            // Sort them first
            const sorted = [...categories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            setLocalCategories(sorted)
        }
    }, [isOpen, categories])

    const moveItem = (index: number, direction: "up" | "down") => {
        const nextIndex = direction === "up" ? index - 1 : index + 1
        if (nextIndex < 0 || nextIndex >= localCategories.length) return

        const updated = [...localCategories]
        const temp = updated[index]
        updated[index] = updated[nextIndex]
        updated[nextIndex] = temp

        setLocalCategories(updated)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Update order index of each category
            for (let i = 0; i < localCategories.length; i++) {
                const cat = localCategories[i]
                await updateCategory({
                    ...cat,
                    order: i + 1 // 1-indexed for standard sorting
                })
            }
            toast.success("تم حفظ ترتيب الأقسام بنجاح! 🎉")
            onClose()
        } catch (error) {
            console.error("Failed to save category order:", error)
            toast.error("فشل حفظ الترتيب الجديد")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Content Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-white dark:bg-[#1c2a36] w-full max-w-md p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10 relative shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-right"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                <ArrowUpDown className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">ترتيب الأقسام للعملاء</h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Info Note */}
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 leading-relaxed pr-1 font-bold">
                            استخدم الأسهم لتحريك القسم لأعلى أو أسفل، ثم اضغط حفظ لتطبيق الترتيب الجديد فوراً على تطبيق العملاء.
                        </p>

                        {/* List area */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 no-scrollbar">
                            {localCategories.map((cat, idx) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/5 rounded-2xl transition-all hover:border-orange-500/30"
                                >
                                    {/* Arrows control */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={idx === localCategories.length - 1}
                                            onClick={() => moveItem(idx, "down")}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300/80 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-350 transition-colors"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={idx === 0}
                                            onClick={() => moveItem(idx, "up")}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300/80 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-slate-350 transition-colors"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Category Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="font-bold text-slate-900 dark:text-white block text-sm">{cat.nameAr}</span>
                                            <span className="text-[10px] text-slate-400 font-mono block">الترتيب الحالي: #{idx + 1}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-lg filter drop-shadow">
                                            {cat.icon || "📁"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-slate-200 dark:border-white/5 mt-4">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full h-13 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl gap-2 text-base transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                            >
                                <Check className="w-5 h-5" />
                                <span>{isSaving ? "جاري الحفظ..." : "حفظ الترتيب الجديد"}</span>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
