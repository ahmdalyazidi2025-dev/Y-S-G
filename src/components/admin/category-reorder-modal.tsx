"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { X, GripVertical, Save, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Category, useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"

interface CategoryReorderModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CategoryReorderModal({ isOpen, onClose }: CategoryReorderModalProps) {
    const { categories, reorderCategories } = useStore()
    const [items, setItems] = useState<Category[]>([])
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setItems([...categories])
        }
    }, [isOpen, categories])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // We call it but don't await the close, let the context handle it
            // This provides an instant experience
            reorderCategories(items).catch(err => {
                console.error("Delayed error in reorder:", err)
            })
            onClose()
        } catch (error) {
            console.error("Error starting reorder:", error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-[#1c2a36] w-full max-w-md p-6 rounded-[32px] border border-white/10 relative shadow-2xl flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Move className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">ترتيب الأقسام</h2>
                                <p className="text-xs text-slate-400">اسحب الأقسام لتغيير ترتيب ظهورها</p>
                            </div>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drag and Drop List */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mb-6">
                            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-3">
                                {items.map((item) => (
                                    <Reorder.Item
                                        key={item.id}
                                        value={item}
                                        className={cn(
                                            "bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors group",
                                            item.isHidden && "opacity-50"
                                        )}
                                    >
                                        <GripVertical className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold truncate">{item.nameAr}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">#{item.id.slice(0, 6)}</p>
                                        </div>
                                        {item.image ? (
                                            <div className="w-10 h-10 rounded-lg bg-muted border border-white/5 overflow-hidden">
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
                                                {item.icon || "📁"}
                                            </div>
                                        )}
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 h-14 rounded-2xl border-white/10 text-slate-300 hover:bg-white/5"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-[2] h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl gap-3 shadow-xl shadow-amber-500/20 text-lg font-bold"
                            >
                                {isSaving ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                <span>حفظ الترتيب</span>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
