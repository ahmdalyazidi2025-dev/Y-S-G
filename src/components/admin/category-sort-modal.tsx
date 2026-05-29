"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { X, ArrowUpDown, GripVertical, Check } from "lucide-react"
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
            // Sort them first by existing order
            const sorted = [...categories].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            setLocalCategories(sorted)
        }
    }, [isOpen, categories])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Update order index of each category based on the drag order
            for (let i = 0; i < localCategories.length; i++) {
                const cat = localCategories[i]
                await updateCategory({
                    ...cat,
                    order: i + 1 // 1-indexed for standard sorting
                })
            }
            toast.success("تم حفظ ترتيب الأقسام الجديد بنجاح! 🎉")
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
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">ترتيب الأقسام بالسحب</h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Info Note */}
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 leading-relaxed pr-1 font-bold">
                            قم بإمساك القسم وسحبه للأعلى أو للأسفل لتغيير مكانه، ثم اضغط حفظ لتطبيق الترتيب فوراً على تطبيق العملاء.
                        </p>

                        {/* Drag and Drop List Area */}
                        <Reorder.Group
                            axis="y"
                            values={localCategories}
                            onReorder={setLocalCategories}
                            className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 no-scrollbar"
                        >
                            {localCategories.map((cat, idx) => (
                                <Reorder.Item
                                    key={cat.id}
                                    value={cat}
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/25 border border-slate-200/80 dark:border-white/5 rounded-2xl transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing select-none"
                                >
                                    {/* Drag Handle Indicator */}
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <GripVertical className="w-5 h-5 text-slate-400" />
                                        <span className="text-[10px] bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">
                                            #{idx + 1}
                                        </span>
                                    </div>

                                    {/* Category Info */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="font-bold text-slate-900 dark:text-white block text-sm">{cat.nameAr}</span>
                                            <span className="text-[10px] text-slate-400 block">{cat.nameEn}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-lg filter drop-shadow">
                                            {cat.icon || "📁"}
                                        </div>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-slate-200 dark:border-white/5 mt-4">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full h-13 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl gap-2 text-base transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98]"
                            >
                                <Check className="w-5 h-5" />
                                <span>{isSaving ? "جاري حفظ الترتيب..." : "حفظ الترتيب الجديد"}</span>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
