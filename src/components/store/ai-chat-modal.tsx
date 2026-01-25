"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Image as ImageIcon, Sparkles, User, Loader2, Camera } from "lucide-react"
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

export function AiChatModal({ isOpen, onClose }: AiChatModalProps) {
    const { storeSettings, products, addToCart, addProductRequest } = useStore()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "ai",
            content: "مرحباً بك! 👋 أنا مساعدك الذكي في المتجر. يمكنك سؤالي عن أي قطعة غيار، بدائلها، أو حتى تصوير قطعة لمعرفة تفاصيلها. كيف يمكنني مساعدتك اليوم؟",
            timestamp: new Date()
        }
    ])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && !selectedImage) || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
            image: selectedImage || undefined,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setSelectedImage(null)
        setIsLoading(true)
        hapticFeedback('medium')

        try {
            if (!storeSettings?.googleGeminiApiKey) {
                throw new Error("API Key missing")
            }

            const genAI = new GoogleGenerativeAI(storeSettings.googleGeminiApiKey)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

            const productContext = products.slice(0, 100).map(p => `- ${p.name} (ID: ${p.id}, Barcode: ${p.barcode || 'N/A'}) - ${p.price} SAR`).join("\n")

            const systemPrompt = `
            You are a smart, professional sales assistant for "Yahya Salman Ghazwani Group" (Automotive Parts Store).
            
            STRICT RULES:
            1. SCOPE: Automotive topics ONLY. Refuse others.
            2. PRODUCTS: Use "Current Store Data" for prices. If missing, estimate market price in SAR.
            3. VIN/CHASSIS PLATES: 
               - If the user uploads a VIN/Chassis Plate image -> EXTRACT the VIN and Car Model/Year. 
               - Confirm you identified the car (e.g., "I see this is a 2022 Toyota Camry, VIN: ...").
               - Ask what part they need for this specific car.
            4. TONE: Professional, helpful. ARABIC language only.
            
            Current Store Data:
            ${productContext}
            
            User's store info: ${storeSettings.aboutText || ""}
            
            RESPONSE FORMAT (JSON ONLY):
            {
                "text": "Response text...",
                "action": "available" | "request" | "vin_identified" | "none",
                "product": { "id": "...", "name": "...", "price": 0 },
                "marketEstimate": "...",
                "vinData": { "vin": "...", "car": "..." }
            }
            `

            const parts: any[] = [systemPrompt]

            if (userMessage.image) {
                const base64Data = userMessage.image.split(',')[1]
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                })
                parts.push("Analyze this image (Is it a part? A VIN plate?).")
            }

            if (userMessage.content) {
                parts.push(userMessage.content)
            }

            const result = await model.generateContent(parts)
            const responseText = result.response.text()

            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()

            let parsedResponse;
            try {
                parsedResponse = JSON.parse(cleanJson)
            } catch {
                parsedResponse = { text: responseText, action: "none" }
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: parsedResponse.text,
                action: parsedResponse.action,
                productData: parsedResponse.product,
                marketEstimate: parsedResponse.marketEstimate,
                vinData: parsedResponse.vinData,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, aiMessage])
            hapticFeedback('success')

        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ في الاتصال بالذكاء الاصطناعي")
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "ai",
                content: "عذراً، حدثت مشكلة تقنية. يرجى التأكد من مفتاح API أو المحاولة لاحقاً.",
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setSelectedImage(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-slate-900 border-t sm:border border-white/10 w-full sm:w-[400px] sm:rounded-2xl h-[85vh] sm:h-[600px] flex flex-col pointer-events-auto relative z-10"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 sm:rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">المساعد الذكي</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] text-slate-400">متصل (Gemini AI)</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-slate-400">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-700" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`}>
                                        {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                        <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                            ? "bg-primary text-black rounded-tr-sm font-medium"
                                            : "bg-white/10 text-slate-200 rounded-tl-sm border border-white/5"
                                            }`}>
                                            {msg.image && (
                                                <img src={msg.image} alt="User upload" className="w-full h-32 object-cover rounded-lg mb-2 border border-black/20" />
                                            )}

                                            {/* VIN Identification Badge */}
                                            {msg.action === "vin_identified" && msg.vinData && (
                                                <div className="mb-2 p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                        <span className="text-white text-xs">🚗</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-indigo-200 text-xs">{msg.vinData.car}</div>
                                                        <div className="text-[10px] text-indigo-300 font-mono tracking-wider">{msg.vinData.vin}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {msg.content}

                                            {/* Action Buttons */}
                                            {msg.action === "available" && msg.productData && (
                                                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                                                    <div className="text-xs text-green-400 font-bold flex items-center gap-1">
                                                        <span>✅ متوفرة في المتجر</span>
                                                        <span>({msg.productData.price} ريال)</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => {
                                                            // Find full product object based on ID
                                                            const fullProduct = products.find(p => p.id === msg.productData?.id)
                                                            if (fullProduct) {
                                                                addToCart(fullProduct)
                                                                toast.success("تمت الإضافة للسلة")
                                                            } else {
                                                                toast.error("المنتج غير موجود")
                                                            }
                                                        }}
                                                    >
                                                        إضافة للسلة 🛒
                                                    </Button>
                                                </div>
                                            )}

                                            {msg.action === "request" && (
                                                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                                                    <div className="text-xs text-yellow-400 font-bold">
                                                        ⚠️ غير متوفرة حالياً
                                                    </div>
                                                    {msg.marketEstimate && (
                                                        <div className="text-[10px] text-slate-400">
                                                            السعر التقريبي: <span className="text-white">{msg.marketEstimate}</span>
                                                        </div>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
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
                                        <span className="text-[10px] text-slate-500 px-1">
                                            {msg.timestamp.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>جاري الكتابة...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        < div className="p-3 border-t border-white/10 bg-black/20 sm:rounded-b-2xl" >
                            {selectedImage && (
                                <div className="mb-2 p-2 bg-white/5 rounded-lg flex items-center justify-between border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-black">
                                            <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs text-slate-300">صورة مرفقة</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/20" onClick={() => setSelectedImage(null)}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full bg-white/5 hover:bg-white/10 text-primary border border-white/5"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="w-5 h-5" />
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="اكتب رسالتك..."
                                    className="bg-black/40 border-white/10 rounded-full px-4 text-right dir-rtl"
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                />
                                <Button
                                    size="icon"
                                    className="rounded-full bg-primary text-black hover:scale-105 transition-transform"
                                    onClick={handleSendMessage}
                                    disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
