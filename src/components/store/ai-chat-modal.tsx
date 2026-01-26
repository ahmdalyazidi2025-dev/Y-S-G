"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Sparkles, User, Loader2, Camera, Maximize2, Minimize2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/context/store-context"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"

interface AiChatModalProps {
    isOpen: boolean
    onClose: () => void
}

interface Message {
    id: string
    role: "user" | "ai"
    content: string
    image?: string
    timestamp: Date
    action?: "available" | "request" | "vin_identified" | "none"
    productData?: { id: string, name: string, price: number }
    marketEstimate?: string
    vinData?: { vin: string, car: string }
}

const [isExpanded, setIsExpanded] = useState(false)

// ... (existing logic)

return (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    onClick={onClose}
                />

                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        width: isExpanded ? "100%" : "90%",
                        height: isExpanded ? "100%" : "70%",
                        borderRadius: isExpanded ? "0px" : "24px"
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`bg-[#1c2a36]/80 backdrop-blur-xl border border-white/10 flex flex-col pointer-events-auto relative z-10 overflow-hidden shadow-2xl transition-all duration-300 ${isExpanded ? "max-w-none rounded-none" : "max-w-lg rounded-3xl"}`}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 relative">
                                <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1c2a36]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">المساعد الذكي</h3>
                                <p className="text-[10px] text-slate-300 font-medium">متصل (Gemini AI)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="rounded-full hover:bg-white/10 text-slate-400 w-10 h-10"
                            >
                                {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full hover:bg-red-500/20 hover:text-red-400 text-slate-400 w-10 h-10 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {messages.map((msg) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
                                    {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                                </div>
                                <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    {msg.role === "ai" && <span className="text-[10px] text-slate-400 px-2">Gemini AI</span>}
                                    <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                        ? "bg-primary text-black rounded-tr-sm font-bold"
                                        : "bg-white/10 text-slate-100 rounded-tl-sm border border-white/5"
                                        }`}>
                                        {msg.image && (
                                            <div className="relative w-full h-40 mb-3 rounded-2xl overflow-hidden border border-black/20">
                                                <Image src={msg.image} alt="User upload" fill className="object-cover" />
                                            </div>
                                        )}

                                        {/* VIN Identification Badge */}
                                        {msg.action === "vin_identified" && msg.vinData && (
                                            <div className="mb-3 p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg">
                                                    <span className="text-white text-lg">🚗</span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-indigo-100 text-sm">{msg.vinData.car}</div>
                                                    <div className="text-[10px] text-indigo-300 font-mono tracking-wider bg-black/20 px-2 py-0.5 rounded-full mt-1 inline-block">{msg.vinData.vin}</div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="whitespace-pre-line">{msg.content}</div>

                                        {/* Action Buttons */}
                                        {msg.action === "available" && msg.productData && (
                                            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                                                    <span className="text-xs text-green-400 font-bold">✅ متوفرة في المتجر</span>
                                                    <span className="text-sm font-black text-white">{msg.productData.price} <span className="text-[10px] font-normal">ر.س</span></span>
                                                </div>
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl h-12 font-bold shadow-lg shadow-green-600/20"
                                                    onClick={() => {
                                                        const fullProduct = products.find(p => p.id === msg.productData?.id)
                                                        if (fullProduct) {
                                                            addToCart(fullProduct)
                                                        }
                                                    }}
                                                >
                                                    إضافة للسلة 🛒
                                                </Button>
                                            </div>
                                        )}

                                        {msg.action === "request" && (
                                            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                                                    <div className="text-xs text-yellow-400 font-bold mb-1">⚠️ غير متوفرة حالياً</div>
                                                    {msg.marketEstimate && (
                                                        <div className="text-[10px] text-slate-400">
                                                            السعر التقريبي: <span className="text-white font-bold">{msg.marketEstimate}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 rounded-xl h-12 font-bold"
                                                    onClick={() => {
                                                        addProductRequest({
                                                            customerName: "عميل المتجر الذكي",
                                                            description: `طلب تلقائي من AI: ${msg.content.slice(0, 50)}...`,
                                                            image: msg.image || undefined
                                                        })
                                                        toast.success("تم التقديم")
                                                    }}
                                                >
                                                    طلب توفير 📝
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 px-2 opacity-60">
                                        {msg.timestamp.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: 'numeric' })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-slate-400 text-xs p-2 bg-white/5 rounded-2xl w-fit px-4">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span>جاري التحليل والكتابة...</span>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
                        {selectedImage && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mb-4 p-3 bg-indigo-500/10 rounded-2xl flex items-center justify-between border border-indigo-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/10">
                                        <Image src={selectedImage} alt="Selected" width={48} height={48} className="object-cover w-full h-full" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-white block">صورة جاهزة للارسال</span>
                                        <span className="text-[10px] text-indigo-300">سيتم تحليلها بواسطة AI</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400" onClick={() => setSelectedImage(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        )}

                        <div className="flex items-end gap-3">
                            {/* Prominent Camera Button */}
                            <div className="relative shrink-0">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 border border-white/10 shadow-xl flex items-center justify-center group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <Camera className="w-7 h-7 text-white" />
                                </Button>
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-400 whitespace-nowrap">تصوير</span>
                            </div>

                            <div className="flex-1 bg-white/5 border border-white/10 rounded-[24px] flex items-center p-1.5 focus-within:bg-black/40 focus-within:border-primary/50 transition-all pr-4">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="اكتب استفسارك هنا..."
                                    className="bg-transparent border-none shadow-none text-right dir-rtl placeholder:text-slate-500 text-white h-11 focus-visible:ring-0"
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                />
                                <Button
                                    size="icon"
                                    className={`rounded-full h-11 w-11 transition-all ${inputValue.trim() || selectedImage ? "bg-primary text-black hover:scale-105" : "bg-white/5 text-slate-500"}`}
                                    onClick={handleSendMessage}
                                    disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className={`w-5 h-5 ${!inputValue.trim() && !selectedImage ? "opacity-50" : ""}`} />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
)
}
