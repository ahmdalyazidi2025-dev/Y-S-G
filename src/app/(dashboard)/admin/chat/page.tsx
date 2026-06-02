"use client"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, MessageCircle, Bell, Megaphone, User, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useStore, Product } from "@/context/store-context"
import type { Conversation } from "@/context/store-context"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import Image from "next/image"
import { ProductDetailsModal } from "@/components/store/product-details-modal"

export default function AdminChatPage() {
    const { messages, sendMessage, broadcastNotification, customers, products, markMessagesRead } = useStore()
    const [msg, setMsg] = useState("")
    const [mode, setMode] = useState<"direct" | "broadcast">("direct")
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Mark messages read when admin opens a chat
    useEffect(() => {
        if (selectedCustomer && markMessagesRead) {
            markMessagesRead(selectedCustomer, true)
        }
    }, [selectedCustomer, messages, markMessagesRead])

    // Group messages into conversations
    const conversations = useMemo(() => {
        const convs: Record<string, Conversation> = {}

        messages.forEach(m => {
            if (m.senderId === "admin") return
            const isUnread = !m.read && !m.isAdmin;
            if (!convs[m.senderId]) {
                convs[m.senderId] = {
                    customerId: m.senderId,
                    customerName: m.senderName,
                    lastMessage: m.text,
                    lastMessageDate: m.createdAt,
                    unreadCount: isUnread ? 1 : 0
                }
            } else {
                if (isUnread) {
                    convs[m.senderId].unreadCount += 1
                }
                if (m.createdAt > convs[m.senderId]!.lastMessageDate!) {
                    convs[m.senderId].lastMessage = m.text
                    convs[m.senderId].lastMessageDate = m.createdAt
                }
            }
        })

        customers.forEach(c => {
            if (!convs[c.id]) {
                convs[c.id] = {
                    customerId: c.id,
                    customerName: c.name,
                    unreadCount: 0
                }
            }
        })

        return Object.values(convs).sort((a, b) => {
            if (!a.lastMessageDate) return 1
            if (!b.lastMessageDate) return -1
            return b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
        })
    }, [messages, customers])

    const activeChatMessages = useMemo(() => {
        if (!selectedCustomer) return []
        return messages.filter(m => m.senderId === selectedCustomer || (m.senderId === "admin" && m.text.includes(`@${selectedCustomer}`)))
    }, [messages, selectedCustomer])

    const handleSend = () => {
        if (!msg.trim()) return

        if (mode === "broadcast") {
            broadcastNotification(msg)
            setMsg("")
        } else if (selectedCustomer) {
            sendMessage(`${msg} (@${selectedCustomer})`, true)
            setMsg("")
        }
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

    const currentCustomerName = conversations.find(c => c.customerId === selectedCustomer)?.customerName

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col text-right">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">
                    {selectedCustomer ? `دردشة: ${currentCustomerName}` : "الدردشة والإشعارات"}
                </h1>
                {selectedCustomer && (
                    <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="text-primary text-xs font-bold">
                        رجوع للكل
                    </Button>
                )}
            </div>

            <div className="flex gap-2">
                <Button
                    variant="glass"
                    className={cn("flex-1 gap-2 h-12", mode === "direct" && "bg-primary text-white border-primary/20", mode !== "direct" && "opacity-50")}
                    onClick={() => { setMode("direct"); setSelectedCustomer(null); }}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة العملاء</span>
                </Button>
                <Button
                    variant="glass"
                    className={cn("flex-1 gap-2 h-12", mode === "broadcast" && "bg-orange-500 text-white border-orange-500/20", mode !== "broadcast" && "opacity-50")}
                    onClick={() => { setMode("broadcast"); setSelectedCustomer(null); }}
                >
                    <Megaphone className="w-4 h-4" />
                    <span>إشعار جماعي</span>
                </Button>
            </div>

            <div className="flex-1 glass-card overflow-hidden flex flex-col">
                {mode === "broadcast" ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center">
                            <Bell className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">إرسال تنبيه للكل</h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-[200px] mx-auto">
                                سيظهر هذا كإشعار منبثق لجميع العملاء المستخدمين للتطبيق حالياً بلهجة ترويجية أو إخبارية
                            </p>
                        </div>
                    </div>
                ) : selectedCustomer ? (
                    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 no-scrollbar">
                        {activeChatMessages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                                لا توجد رسائل سابقة مع هذا العميل
                            </div>
                        ) : (
                            activeChatMessages.map((m) => {
                                const cleanText = m.isAdmin ? m.text.replace(`(@${selectedCustomer})`, "").trim() : m.text
                                const productMatch = cleanText.match(/product=([a-zA-Z0-9_-]+)/)
                                let matchedProduct: Product | undefined
                                if (productMatch) {
                                    matchedProduct = products.find(p => p.id === productMatch[1])
                                }

                                return (
                                    <div key={m.id} className={cn(
                                        "max-w-[80%] p-3 rounded-2xl text-xs space-y-2 flex flex-col",
                                        m.isAdmin 
                                            ? "bg-primary text-white self-start rounded-br-none" 
                                            : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 self-end rounded-bl-none border border-slate-200/50 dark:border-white/5"
                                    )}>
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
                ) : (
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {conversations.map((conv) => (
                            <div
                                onClick={() => setSelectedCustomer(conv.customerId)}
                                className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors active:bg-slate-100 dark:active:bg-white/10"
                            >
                                <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 relative">
                                    <User className="w-6 h-6" />
                                    {conv.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#1c2a36]">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{conv.customerName}</h4>
                                        {conv.lastMessageDate && (
                                            <span className="text-[10px] text-slate-500">{format(conv.lastMessageDate, "hh:mm a", { locale: ar })}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">
                                        {conv.lastMessage || "ابدأ الدردشة الآن..."}
                                    </p>
                                </div>
                                <ChevronLeft className="w-4 h-4 text-slate-600" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {(mode === "broadcast" || selectedCustomer) && (
                <div className="flex gap-2 bg-white dark:bg-[#1c2a36] p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <Input
                        placeholder={mode === "broadcast" ? "اكتب نص الإشعار هنا..." : "اكتب رسالتك..."}
                        className="bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-450 rounded-xl h-12"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <Button
                        size="icon"
                        className={cn(
                            "h-12 w-12 rounded-[18px] flex-shrink-0 transition-all border border-slate-200 dark:border-white/10 shadow-lg",
                            mode === "broadcast" ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                        )}
                        onClick={handleSend}
                    >
                        <Send className="w-5 h-5 text-white" />
                    </Button>
                </div>
            )}

            <ProductDetailsModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
            />
        </div>
    )
}
