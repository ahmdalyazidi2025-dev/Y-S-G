"use client"
import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, MessageCircle, Paperclip, MoreVertical, Phone, Video } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useStore } from "@/context/store-context"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function ChatPage() {
    const { messages, sendMessage, currentUser, guestId, markMessagesRead } = useStore()
    const [msg, setMsg] = useState("")

    // Use logged in user or fallback to unique guest ID
    const currentCustomerId = currentUser?.id || guestId

    // Mark messages as read when entering the chat
    useEffect(() => {
        markMessagesRead(currentCustomerId)
    }, [currentCustomerId]) // eslint-disable-next-line react-hooks/exhaustive-deps

    const chatMessages = useMemo(() => {
        return messages.filter(m => (m.senderId === currentCustomerId || (m.isAdmin && m.text.includes(`@${currentCustomerId}`))) && !m.isSystemNotification)
    }, [messages, currentCustomerId])

    const handleSend = () => {
        if (!msg.trim()) return
        // sendMessage uses currentUser internally if available, but passing explicit ID ensures consistency with the filter
        sendMessage(msg, false, currentCustomerId, currentUser?.name || "عميل")
        setMsg("")
    }

    return (
        <div className="flex flex-col h-[calc(100vh-160px)]">
            {/* Premium Header */}
            <div className="flex items-center justify-between mb-6 p-4 glass-card border border-border/50 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50" />

                <div className="flex items-center gap-4 relative z-10">
                    <Link href="/customer">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full border-2 border-background shadow-sm overflow-hidden bg-primary/10 flex items-center justify-center">
                                <img src="/logo.jpg" alt="Support" className="w-full h-full object-cover" />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground leading-none">فريق الدعم</h1>
                            <p className="text-xs text-emerald-500 font-medium mt-1">متصل الآن</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 relative z-10">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted text-muted-foreground">
                        <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted text-muted-foreground">
                        <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted text-muted-foreground">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 glass-card p-4 flex flex-col overflow-y-auto space-y-6 no-scrollbar relative rounded-3xl border border-border/50 shadow-inner bg-muted/5">
                <AnimatePresence initial={false}>
                    {chatMessages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-50"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center text-primary shadow-lg shadow-primary/10 animate-pulse">
                                <MessageCircle className="w-10 h-10" />
                            </div>
                            <div className="max-w-xs">
                                <h3 className="font-bold text-lg text-foreground">مرحباً بك في خدمة العملاء</h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">فريقنا جاهز لمساعدتك في أي وقت. أرسل استفسارك وسنرد عليك في أقرب وقت.</p>
                            </div>
                        </motion.div>
                    ) : (
                        chatMessages.map((m, i) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.05 }}
                                className={cn(
                                    "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm relative group transition-all hover:shadow-md",
                                    m.isAdmin
                                        ? "bg-background border border-border text-foreground self-start rounded-tr-2xl rounded-tl-sm"
                                        : "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground self-end rounded-tl-2xl rounded-tr-sm shadow-primary/20"
                                )}
                            >
                                {!m.isAdmin && (
                                    <div className="absolute -right-2 top-0 w-3 h-3 bg-primary transform rotate-45 rounded-sm" />
                                )}
                                {m.isAdmin && (
                                    <div className="absolute -left-2 top-0 w-3 h-3 bg-background border-l border-b border-border transform rotate-45 rounded-sm" />
                                )}

                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                    {m.isAdmin && (
                                        <div className="w-5 h-5 rounded-full overflow-hidden border border-border shadow-sm">
                                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <p className={cn(
                                        "font-bold text-[10px] uppercase tracking-wider",
                                        m.isAdmin ? "text-primary" : "text-primary-foreground/80"
                                    )}>
                                        {m.isAdmin ? "Support Team" : "You"}
                                    </p>
                                </div>

                                <p className="leading-relaxed relative z-10">
                                    {m.isAdmin ? m.text.replace(`(@${currentCustomerId})`, "").trim() : m.text}
                                </p>

                                {m.actionLink && (
                                    <Link href={m.actionLink} className="block mt-3">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full bg-background/50 hover:bg-background text-foreground text-xs h-8 gap-2 group/btn border border-border/50"
                                        >
                                            <span>{m.actionTitle || "عرض التفاصيل"}</span>
                                            <ArrowRight className="w-3 h-3 group-hover/btn:-translate-x-1 transition-transform rtl:rotate-180" />
                                        </Button>
                                    </Link>
                                )}

                                <div className={cn(
                                    "flex items-center justify-end mt-2 gap-1 text-[9px] font-medium",
                                    m.isAdmin ? "text-muted-foreground" : "text-primary-foreground/60"
                                )}>
                                    <span>{format(m.createdAt, "hh:mm a", { locale: ar })}</span>
                                    {!m.isAdmin && <span>✓</span>}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Input Area */}
            <div className="mt-4 relative">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xl rounded-[2rem] border border-border/50 shadow-lg -z-10" />
                <div className="flex gap-2 p-2 items-end">
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    <div className="flex-1 py-2">
                        <Input
                            placeholder="اكتب رسالتك..."
                            className="bg-transparent border-0 focus-visible:ring-0 px-2 h-auto min-h-[24px] max-h-[100px] resize-none text-foreground placeholder:text-muted-foreground"
                            value={msg}
                            onChange={(e) => setMsg(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            autoComplete="off"
                        />
                    </div>

                    <Button
                        size="icon"
                        className={cn(
                            "rounded-full h-10 w-10 flex-shrink-0 shadow-md transition-all duration-300",
                            msg.trim()
                                ? "bg-gradient-to-br from-primary to-primary/80 hover:scale-105 hover:shadow-lg shadow-primary/20"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                        onClick={handleSend}
                        disabled={!msg.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
