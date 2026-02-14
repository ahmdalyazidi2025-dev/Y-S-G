"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, ImageIcon, Send, Type, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useStore } from "@/context/store-context"
import { compressImage } from "@/lib/image-utils"
import Image from "next/image"

export default function RequestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { addProductRequest, currentUser } = useStore()
    const [description, setDescription] = useState("")
    const [guestName, setGuestName] = useState("")
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                const compressedBase64 = await compressImage(file)
                setPreviewImage(compressedBase64)
            } catch (error) {
                console.error("Compression error:", error)
                toast.error("فشل معالجة الصورة")
            }
        }
    }

    const triggerFileInput = (mode: 'camera' | 'gallery') => {
        if (fileInputRef.current) {
            if (mode === 'camera') {
                fileInputRef.current.setAttribute('capture', 'environment')
            } else {
                fileInputRef.current.removeAttribute('capture')
            }
            fileInputRef.current.click()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        addProductRequest({
            customerName: currentUser?.name || guestName || "زائر",
            customerId: currentUser?.id || "guest",
            description,
            image: previewImage || "https://placehold.co/400x400/1c2a36/white?text=No+Photo"
        })
        setDescription("")
        setGuestName("")
        setPreviewImage(null)
        toast.success("تم إرسال طلبك بنجاح! سنقوم بالتواصل معك قريباً.")
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-card w-full max-w-sm p-6 relative my-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">طلب منتج جديد</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            <div className="space-y-2">
                                {!currentUser && (
                                    <div className="relative mb-2">
                                        <Type className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="الاسم (اختياري)"
                                            className="bg-muted/50 border-border pr-10"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                        />
                                    </div>
                                )}
                                <label className="text-xs text-muted-foreground mr-2">وصف المنتج (اختياري)</label>
                                <div className="relative">
                                    <Type className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="اكتب اسم أو ميزة المنتج..."
                                        className="bg-muted/50 border-border pr-10"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            {previewImage ? (
                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-border">
                                    <Image
                                        src={previewImage}
                                        alt="معاينة للمنتج المطلوب"
                                        className="w-full h-full object-cover"
                                        width={400}
                                        height={225}
                                    />
                                    <button
                                        onClick={() => setPreviewImage(null)}
                                        className="absolute top-2 left-2 p-2 bg-red-500 rounded-full text-white shadow-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => triggerFileInput('camera')}
                                        className="aspect-square bg-muted/50 rounded-2xl border border-border border-dashed flex flex-col items-center justify-center gap-2 hover:bg-muted cursor-pointer transition-colors group"
                                    >
                                        <div className="p-3 bg-primary/20 rounded-full text-primary group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-medium">كاميرا</span>
                                    </div>
                                    <div
                                        onClick={() => triggerFileInput('gallery')}
                                        className="aspect-square bg-muted/50 rounded-2xl border border-border border-dashed flex flex-col items-center justify-center gap-2 hover:bg-muted cursor-pointer transition-colors group"
                                    >
                                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-500 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-medium">المعرض</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button className="w-full h-12 bg-primary text-primary-foreground rounded-[18px] gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={handleSubmit}>
                                    <Send className="w-4 h-4" />
                                    <span>إرسال الطلب</span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
