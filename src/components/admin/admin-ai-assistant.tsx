"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Send, X, User, Sparkles, Minimize2, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminAiAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<{ role: "user" | "model", text: string }[]>([
        { role: "model", text: "أهلاً بك في نظام Y-S-G! أنا مساعدك الذكي لمساعدتك في إدارة الموقع. كيف يمكنني مساعدتك اليوم؟" }
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
        setMessages(prev => [...prev, { role: "user", text: userMessage }])
        setInput("")
        setIsLoading(true)

        try {
            const res = await fetch("/api/admin-assistant", {
                method: "POST",
                body: JSON.stringify({ 
                    message: userMessage,
                    history: messages.map(m => ({ 
                        role: m.role === "user" ? "user" : "model", 
                        parts: [{ text: m.text }] 
                    }))
                })
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setMessages(prev => [...prev, { role: "model", text: data.text }])
        } catch (error: any) {
            setMessages(prev => [...prev, { role: "model", text: `عذراً، حدث خطأ: ${error.message}` }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute bottom-20 right-0 w-[360px] sm:w-[420px] h-[580px] bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ring-1 ring-white/5"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-primary/90 to-primary/70 flex items-center justify-between text-white relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                                    <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-base tracking-tight">نظام المساعد الذكي</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="relative">
                                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                                            <span className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                        </div>
                                        <span className="text-[10px] font-medium text-emerald-200 uppercase tracking-widest">متصل بالخدمة</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 rounded-xl text-white hover:bg-white/10 transition-colors z-10"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                            dir="rtl"
                        >
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: m.role === "user" ? 20 : -20, y: 10 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    key={i}
                                    className={cn(
                                        "flex gap-3",
                                        m.role === "user" ? "justify-start flex-row-reverse" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border",
                                        m.role === "user" 
                                            ? "bg-slate-800 border-white/10 text-slate-300" 
                                            : "bg-primary/20 border-primary/20 text-primary"
                                    )}>
                                        {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className={cn(
                                        "p-4 text-sm leading-relaxed max-w-[80%] shadow-xl whitespace-pre-wrap",
                                        m.role === "user" 
                                            ? "bg-primary text-white rounded-2xl rounded-tr-none" 
                                            : "bg-white/5 backdrop-blur-md text-slate-100 border border-white/5 rounded-2xl rounded-tl-none"
                                    )}>
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/20 text-primary flex items-center justify-center shadow-lg">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="p-4 bg-white/5 backdrop-blur-md text-slate-400 rounded-2xl rounded-tl-none border border-white/5 shadow-xl flex gap-1.5 items-center">
                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-slate-900/40 border-t border-white/10 backdrop-blur-md">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                    <input
                                        type="text"
                                        placeholder="كيف يمكنني مساعدتك؟"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10 transition-all relative font-medium placeholder:text-slate-500"
                                        dir="rtl"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!input.trim() || isLoading}
                                        className="absolute left-2 top-2 w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-[0_8px_16px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center p-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60">
                                <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3" /> Y-S-G AI OS</span>
                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                <span>Ver 2.0 Premium</span>
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
                        "w-16 h-16 rounded-[1.5rem] shadow-[0_15px_30px_rgba(0,0,0,0.3)] flex items-center justify-center p-0 border-2 transition-all duration-500",
                        isOpen 
                            ? "bg-slate-800 border-white/20 text-white" 
                            : "bg-primary border-white/10 text-white"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <X className="w-7 h-7" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                className="relative"
                            >
                                <Bot className="w-9 h-9" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </motion.div>
        </div>
    )
}
