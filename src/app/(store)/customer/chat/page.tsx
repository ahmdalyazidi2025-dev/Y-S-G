"use client"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useStore } from "@/context/store-context"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

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
        return messages.filter(m => m.senderId === currentCustomerId || (m.isAdmin && m.text.includes(`@${currentCustomerId}`)))
    }, [messages, currentCustomerId])

    const handleSend = () => {
        if (!msg.trim()) return
        // sendMessage uses currentUser internally if available, but passing explicit ID ensures consistency with the filter
        sendMessage(msg, false, currentCustomerId, currentUser?.name || "عميل")
        setMsg("")
    }

    return (
        <div className="flex flex-col h-[calc(100vh-160px)]">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/customer">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                        <ArrowRight className="w-5 h-5 text-foreground" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1 text-foreground">الدردشة</h1>
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
                    chatMessages.map((m) => (
                        <div key={m.id} className={cn(
                            "max-w-[80%] p-3 rounded-2xl text-xs space-y-1 shadow-sm",
                            m.isAdmin ? "bg-muted text-foreground self-start rounded-bl-none" : "bg-primary text-primary-foreground self-end rounded-br-none"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                {m.isAdmin && (
                                    <div className="w-4 h-4 rounded-full overflow-hidden border border-border">
                                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <p className="font-bold text-[8px] opacity-70">{m.isAdmin ? "Y S G" : m.senderName}</p>
                            </div>
                            <p>{m.isAdmin ? m.text.replace(`(@${currentCustomerId})`, "").trim() : m.text}</p>
                            <p className="text-[8px] opacity-50 text-left">{format(m.createdAt, "hh:mm a", { locale: ar })}</p>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 flex gap-2">
                <Input
                    placeholder="اكتب رسالتك..."
                    className="bg-background border-border rounded-full h-12 text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button
                    size="icon"
                    className="rounded-[18px] bg-primary h-12 w-12 flex-shrink-0 shadow-lg shadow-primary/20 border border-white/10"
                    onClick={handleSend}
                >
                    <Send className="w-5 h-5 text-primary-foreground" />
                </Button>
            </div>
        </div>
    )
}
