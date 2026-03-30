"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, ImageIcon, Loader2, Sparkles, CheckCircle2, AlertCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"
import { useStore } from "@/context/store-context"
import { compressImage } from "@/lib/image-utils"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

interface BatchProductUploadProps {
    isOpen: boolean
    onClose: () => void
}

interface BatchItem {
    id: string
    file: File
    preview: string
    status: 'pending' | 'processing' | 'success' | 'duplicate' | 'error'
    result?: {
        name: string
        barcode: string
        barcodes: string[]
        description: string
    }
    existingId?: string
}

export function BatchProductUpload({ isOpen, onClose }: BatchProductUploadProps) {
    const { addProduct } = useStore()
    const [items, setItems] = useState<BatchItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (items.length + files.length > 10) {
            toast.error("الحد الأقصى هو 10 صور في المرة الواحدة")
            return
        }

        const newItems: BatchItem[] = await Promise.all(
            files.map(async (file) => {
                const preview = URL.createObjectURL(file)
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    file,
                    preview,
                    status: 'pending' as const
                }
            })
        )

        setItems(prev => [...prev, ...newItems])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removeItem = (id: string) => {
        setItems(prev => {
            const item = prev.find(i => i.id === id)
            if (item) URL.revokeObjectURL(item.preview)
            return prev.filter(i => i.id !== id)
        })
    }

    const processBatch = async () => {
        if (items.length === 0) return
        setIsProcessing(true)

        const smartFillPrompt = `أنت خبير متخصص في قطع غيار السيارات. حلل هذه الصورة بعناية واستخرج المعلومات الدقيقة:
١. اقرأ جميع أرقام القطع OEM والباركودات الظاهرة بوضوح (حتى 5 أرقام).
٢. حدد الماركة (Toyota، Honda، Bosch، إلخ).
٣. اكتب اسماً عربياً احترافياً: [الماركة] + [نوع القطعة] + [الرقم الأساسي].

أجب بـ JSON فقط:
{ "name": "...", "barcode": "الرقم الأساسي", "barcodes": ["رقم1", "رقم2", ...], "description": "..." }`;

        const uploadPromises = items.map(async (item) => {
            if (item.status === 'success') return item

            try {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i))

                // 1. Process with AI
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(item.file)
                })

                const res = await fetch("/api/admin-assistant", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: smartFillPrompt,
                        image: base64,
                        user: { name: "Batch System", role: "admin" }
                    })
                })

                const data = await res.json()
                if (data.error) throw new Error(data.error)

                const jsonMatch = (data.text || "").match(/\{[\s\S]*\}/)
                if (!jsonMatch) throw new Error("لم يتم التعرف على البيانات")
                const parsed = JSON.parse(jsonMatch[0])

                // 2. Check for duplicate (Scan all extracted barcodes)
                let status: BatchItem['status'] = 'success'
                let existingId: string | undefined

                const aiBarcodes = Array.isArray(parsed.barcodes) ? parsed.barcodes : [parsed.barcode].filter(Boolean);
                const allCodesToCheck = Array.from(new Set([parsed.barcode, ...aiBarcodes])).filter(Boolean) as string[];

                for (const b of allCodesToCheck) {
                    const q1 = query(collection(db, "products"), where("barcode", "==", b.trim()))
                    const q2 = query(collection(db, "products"), where("barcodes", "array-contains", b.trim()))
                    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)])
                    
                    if (!s1.empty || !s2.empty) {
                        status = 'duplicate'
                        existingId = (s1.docs[0] || s2.docs[0]).id
                        break
                    }
                }

                // 3. Save Context
                const updatedItem = { 
                    ...item, 
                    status, 
                    existingId,
                    result: {
                        name: parsed.name || "منتج غير معروف",
                        barcode: parsed.barcode || aiBarcodes[0] || "",
                        barcodes: aiBarcodes.filter((b: string) => b !== (parsed.barcode || aiBarcodes[0])),
                        description: parsed.description || ""
                    }
                }
                setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i))
                return updatedItem

            } catch (error) {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i))
                return { ...item, status: 'error' as const }
            }
        })

        await Promise.all(uploadPromises)
        setIsProcessing(false)
        toast.success("اكتملت عملية المعالجة")
    }

    const saveAllDrafts = async () => {
        const validItems = items.filter(i => i.status === 'success' && i.result)
        if (validItems.length === 0) return

        setIsProcessing(true)
        const loadingToast = toast.loading(`جاري حفظ ${validItems.length} منتج...`)

        try {
            for (const item of validItems) {
                // Compress and format images array
                const compressed = await compressImage(item.file)
                await addProduct({
                    name: item.result!.name,
                    barcode: item.result!.barcode,
                    barcodes: item.result!.barcodes,
                    description: item.result!.description,
                    category: "غير مصنف",
                    pricePiece: 0,
                    price: 0, // Default price
                    costPrice: 0,
                    unit: "حبة",
                    images: [compressed],
                    isDraft: true // Always start as draft for batch
                })
            }
            toast.dismiss(loadingToast)
            toast.success("تم إضافة جميع المنتجات كمسودات بنجاح!")
            setItems([])
            onClose()
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error("حدث خطأ أثناء الحفظ")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-[#0f111a] border border-white/10 w-full max-w-2xl rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl relative z-10"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">إضافة منتجات بالجملة (AI)</h2>
                                    <p className="text-[10px] text-slate-400 font-bold">ارفع حتى 10 صور وسيقوم الذكاء الاصطناعي بكل العمل</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-slate-400">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {items.length === 0 ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.02] hover:border-indigo-500/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-20 h-20 rounded-full bg-indigo-500/5 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white">اسحب الصور هنا أو اضغط للاختيار</p>
                                        <p className="text-sm text-slate-500 mt-1 font-medium">الحد الأقصى 10 صور بصيغة JPG, PNG</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {items.map((item) => (
                                        <div key={item.id} className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl flex items-center gap-4 group">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                                                <Image src={item.preview} alt="preview" fill className="object-cover" />
                                                {item.status === 'processing' && (
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                {item.status === 'pending' && <p className="text-sm text-slate-400 font-bold">بانتظار المعالجة...</p>}
                                                {item.status === 'processing' && <p className="text-sm text-indigo-400 font-bold animate-pulse">جاري التحليل...</p>}
                                                {item.status === 'success' && item.result && (
                                                    <div>
                                                        <p className="text-sm font-bold text-white truncate">{item.result.name}</p>
                                                        <p className="text-[10px] text-emerald-400 font-bold">OEM: {item.result.barcode || '---'}</p>
                                                    </div>
                                                )}
                                                {item.status === 'duplicate' && (
                                                    <div>
                                                        <p className="text-sm font-bold text-amber-500 truncate">منتج مكرر!</p>
                                                        <p className="text-[10px] text-amber-500/70 font-bold">الرقم {item.result?.barcode} موجود بالفعل</p>
                                                    </div>
                                                )}
                                                {item.status === 'error' && <p className="text-sm text-red-500 font-bold">فشل التحليل</p>}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {item.status === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : 
                                                 item.status === 'duplicate' ? <AlertCircle className="w-6 h-6 text-amber-500" /> : 
                                                 item.status === 'error' ? <AlertCircle className="w-6 h-6 text-red-500" /> : null}
                                                
                                                {!isProcessing && (
                                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {items.length < 10 && !isProcessing && (
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-14 border border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 hover:border-indigo-400/30 transition-all font-bold"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                            <span>إضافة المزيد ({10 - items.length})</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
                            <p className="text-xs text-slate-500 font-bold">
                                {items.length > 0 && `${items.length} صور تم اختيارها`}
                            </p>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" onClick={onClose} disabled={isProcessing} className="rounded-2xl h-11 px-6 font-bold text-slate-400">
                                    إلغاء
                                </Button>
                                
                                {items.some(i => i.status === 'success' || i.status === 'duplicate') ? (
                                    <Button 
                                        onClick={saveAllDrafts} 
                                        disabled={isProcessing || !items.some(i => i.status === 'success')}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-11 px-8 font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                    >
                                        حفظ كمسودات
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={processBatch} 
                                        disabled={items.length === 0 || isProcessing}
                                        className="bg-primary text-black hover:bg-primary/90 rounded-2xl h-11 px-8 font-black shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري التحليل...</> : <><Sparkles className="w-5 h-5 ml-2" /> ابدأ التحليل الذكي</>}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            multiple 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
