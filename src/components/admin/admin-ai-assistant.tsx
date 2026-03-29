"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Send, X, User, Sparkles, Minimize2, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useStore } from "@/context/store-context"

export function AdminAiAssistant() {
    const { currentUser } = useStore()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<{ role: "user" | "model", text: string, timestamp: Date }[]>([
        { 
            role: "model", 
            text: "مرحباً بك في لوحة تحكم Y-S-G. أنا مساعدك الرقمي، كيف يمكنني مساعدتك اليوم؟", 
            timestamp: new Date() 
        }
    ])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        const now = new Date()
        setMessages(prev => [...prev, { role: "user", text: userMessage, timestamp: now }])
        setInput("")
        setIsLoading(true)

        try {
            const res = await fetch("/api/admin-assistant", {
                method: "POST",
                body: JSON.stringify({ 
                    message: userMessage,
                    user: {
                        name: currentUser?.name || "زميل",
                        role: currentUser?.role || "staff",
                        permissions: currentUser?.permissions || []
                    },
                    history: messages.map(m => ({ 
                        role: m.role === "user" ? "user" : "model", 
                        parts: [{ text: m.text }] 
                    }))
                })
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setMessages(prev => [...prev, { role: "model", text: data.text, timestamp: new Date() }])
        } catch (error: any) {
            setMessages(prev => [...prev, { role: "model", text: `عذراً، حدث خطأ: ${error.message}`, timestamp: new Date() }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 left-6 z-[60]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                        className="absolute bottom-20 left-0 w-[350px] sm:w-[400px] h-[550px] bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-[1.75rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden ring-1 ring-black/[0.02]"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-semibold text-sm text-slate-800">مساعد الإدارة الذكي</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] text-slate-500 font-medium tracking-tight">جاهز للمساعدة</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
                            dir="rtl"
                        >
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={cn(
                                        "flex gap-3",
                                        m.role === "user" ? "justify-start flex-row-reverse" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
                                        m.role === "user" 
                                            ? "bg-primary border-primary text-white" 
                                            : "bg-white border-slate-200 text-slate-400"
                                    )}>
                                        {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={cn(
                                        "p-3.5 text-sm max-w-[80%] shadow-sm leading-relaxed",
                                        m.role === "user" 
                                            ? "bg-primary text-white rounded-[1.2rem] rounded-tr-none" 
                                            : "bg-slate-100 text-slate-700 rounded-[1.2rem] rounded-tl-none"
                                    )}>
                                        <div className="flex flex-col gap-1">
                                            <div className="whitespace-pre-wrap">{m.text}</div>
                                            <div className={cn(
                                                "text-[9px] opacity-40 text-left mt-1 font-medium",
                                                m.role === "user" ? "text-white" : "text-slate-500"
                                            )}>
                                                {m.timestamp.toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="p-3.5 bg-slate-100 text-slate-400 rounded-[1.2rem] rounded-tl-none shadow-sm flex gap-1.5 items-center">
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-5 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        placeholder="كيف يمكنني مساعدتك؟"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl pl-12 pr-4 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary/30 transition-all relative font-medium placeholder:text-slate-400"
                                        dir="rtl"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="absolute left-1 top-1 w-9 h-9 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all flex items-center justify-center p-0 shadow-sm"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                            <div className="mt-2.5 flex items-center justify-center gap-3 text-[9px] text-slate-400 font-semibold opacity-60 uppercase tracking-tight">
                                <span className="flex items-center gap-1"><Terminal className="w-2.5 h-2.5" /> Y-S-G AI</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span>Digital Assistant</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={false}
                animate={isOpen ? "open" : "closed"}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center p-0 border transition-all duration-300",
                        isOpen 
                            ? "bg-white border-slate-200 text-slate-400" 
                            : "bg-primary border-primary text-white"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <X className="w-6 h-6" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                className="relative"
                            >
                                <Sparkles className="w-7 h-7" />
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-primary shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>
        </div>
    )
}
