"use client"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useStore, Product } from "@/context/store-context"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ProductDetailsModal } from "@/components/store/product-details-modal"

export default function ChatPage() {
    const { messages, sendMessage, currentUser, products } = useStore()
    const [msg, setMsg] = useState("")
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Use logged in user or fallback to guest (though this page should probably be protected)
    const currentCustomerId = currentUser?.id || "guest"

    const chatMessages = useMemo(() => {
        return messages.filter(m => m.senderId === currentCustomerId || (m.isAdmin && m.text.includes(`@${currentCustomerId}`)))
    }, [messages, currentCustomerId])

    const handleSend = () => {
        if (!msg.trim()) return
        sendMessage(msg, false, currentCustomerId, currentUser?.name || "عميل")
        setMsg("")
    }

    const renderMessageText = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const parts = text.split(urlRegex)
        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 dark:text-blue-300 underline break-all font-bold hover:opacity-85 transition-opacity"
                        onClick={(e) => {
                            // If it's an internal product link, intercept and open the modal directly instead of opening a new tab
                            const match = part.match(/product=([a-zA-Z0-9_-]+)/)
                            if (match) {
                                e.preventDefault()
                                const prod = products.find(p => p.id === match[1])
                                if (prod) setSelectedProduct(prod)
                            }
                        }}
                    >
                        {part}
                    </a>
                )
            }
            return part
        })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-160px)]">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/customer">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">الدردشة</h1>
            </div>

            <div className="flex-1 glass-card p-4 flex flex-col overflow-y-auto space-y-4 no-scrollbar">
                {chatMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                            <MessageCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold">تحدث مع الإدارة</h3>
                            <p className="text-xs text-slate-500">نحن هنا للإجابة على جميع استفساراتك</p>
                        </div>
                    </div>
                ) : (
                    chatMessages.map((m) => {
                        const cleanText = m.isAdmin ? m.text.replace(`(@${currentCustomerId})`, "").trim() : m.text
                        const productMatch = cleanText.match(/product=([a-zA-Z0-9_-]+)/)
                        let matchedProduct: Product | undefined
                        if (productMatch) {
                            matchedProduct = products.find(p => p.id === productMatch[1])
                        }

                        return (
                            <div key={m.id} className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-xs space-y-2 flex flex-col",
                                m.isAdmin ? "bg-white/10 text-slate-200 self-start rounded-bl-none" : "bg-primary text-white self-end rounded-br-none"
                            )}>
                                <p className="font-bold text-[8px] opacity-70">{m.senderName}</p>
                                <div>{renderMessageText(cleanText)}</div>
                                
                                {/* Render Smart Product Card Preview */}
                                {matchedProduct && (
                                    <div className="mt-1 bg-white/10 dark:bg-black/35 p-2 rounded-xl border border-white/5 flex gap-3 items-center w-full min-w-[210px] sm:min-w-[250px] text-right">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200/50 dark:border-white/5 overflow-hidden flex-shrink-0 relative">
                                            {matchedProduct.image ? (
                                                <Image
                                                    src={matchedProduct.image}
                                                    alt=""
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">📦</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[10px] truncate text-slate-100 leading-tight">{matchedProduct.name}</p>
                                            <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{matchedProduct.pricePiece} ر.س</p>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedProduct(matchedProduct!)} 
                                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                                        >
                                            عرض المنتج
                                        </button>
                                    </div>
                                )}
                                
                                <p className="text-[8px] opacity-50 text-left self-end">{format(m.createdAt, "hh:mm a", { locale: ar })}</p>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="mt-4 flex gap-2">
                <Input
                    placeholder="اكتب رسالتك..."
                    className="bg-black/20 border-white/10 rounded-full h-12"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button
                    size="icon"
                    className="rounded-[18px] bg-primary h-12 w-12 flex-shrink-0 shadow-lg shadow-primary/20 border border-white/10"
                    onClick={handleSend}
                >
                    <Send className="w-5 h-5 text-white" />
                </Button>
            </div>

            <ProductDetailsModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
            />
        </div>
    )
}
