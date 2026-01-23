"use client"

import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Plus, Image as ImageIcon, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { compressImage } from "@/lib/image-utils"
import { toast } from "sonner"

interface BannerFormProps {
    isOpen: boolean
    onClose: () => void
}

export function AdminBannerForm({ isOpen, onClose }: BannerFormProps) {
    const { addBanner } = useStore()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [image, setImage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("يرجى اختيار ملف صورة صحيح (JPEG, PNG, WEBP)")
            return
        }

        // Limit file size (2MB max to be safe even before compression attempt)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("حجم الصورة كبير جداً (يجب أن تكون أقل من 2 ميجابايت)")
            return
        }

        try {
            setIsLoading(true)
            const compressedBase64 = await compressImage(file)

            if (!compressedBase64 || !compressedBase64.startsWith('data:image')) {
                throw new Error("Invalid image data")
            }

            setImage(compressedBase64)
            toast.success("تم تجهيز الصورة للنشر")
        } catch (error) {
            console.error("Compression error:", error)
            toast.error("حدث خطأ أثناء معالجة الصورة. حاول بصورة أخرى.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!image) {
            toast.error("يرجى اختيار صورة أولاً")
            return
        }

        try {
            setIsLoading(true)
            await addBanner({
                image,
                active: true
            })
            setImage("")
            onClose()
        } catch (error) {
            console.error("Upload error:", error)
            // Error handling is also done in store-context usually
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        className="bg-[#1c2a36] w-full max-w-lg p-6 rounded-[32px] border border-white/10 relative shadow-2xl"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-white">إضافة صورة عرض جديدة</h2>
                            <button onClick={onClose} className="p-2 mr-auto hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-[3/1] bg-black/20 rounded-2xl border border-white/5 border-dashed flex flex-col items-center justify-center gap-3 hover:bg-black/30 cursor-pointer transition-all group overflow-hidden relative"
                            >
                                {image ? (
                                    <>
                                        <Image
                                            src={image}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">
                                            {isLoading ? "جاري المعالجة..." : "انقر لتحميل الصورة (1200x400)"}
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={!image || isLoading}
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl gap-3 shadow-xl shadow-primary/20 text-lg font-bold transition-all active:scale-[0.98]"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span>نشر الصورة</span>
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
