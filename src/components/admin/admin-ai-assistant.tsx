"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, Send, X, MessagesSquare, User, Sparkles, Loader2, Minimize2 } from "lucide-react"
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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] bg-[#1c2a36] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden glass-card"
                    >
                        {/* Header */}
                        <div className="p-4 bg-primary flex items-center justify-between text-white shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">مساعد الموظف الذكي</h3>
                                    <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                        <span className="text-[10px]">متصل بـ Gemini AI</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/10 rounded-full"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Chat Area */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
                        >
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                                        m.role === "user" ? "bg-slate-700 text-slate-300" : "bg-primary/20 text-primary border border-primary/20"
                                    )}>
                                        {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm leading-relaxed",
                                        m.role === "user" 
                                            ? "bg-slate-700 text-white rounded-tr-none shadow-md" 
                                            : "bg-white/5 text-slate-200 border border-white/5 rounded-tl-none shadow-sm"
                                    )}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 mr-auto items-center">
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/20 flex items-center justify-center animate-spin">
                                        <Loader2 className="w-4 h-4" />
                                    </div>
                                    <div className="p-3 bg-white/5 text-slate-400 text-xs italic rounded-2xl border border-white/5">
                                        جاري التفكير...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/20">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="اسألني أي شيء عن النظام..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full h-12 bg-[#1c2a36] border border-white/10 rounded-xl pl-12 pr-4 text-white text-sm focus:border-primary transition-all shadow-inner"
                                />
                                <Button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="absolute left-1.5 top-1.5 w-9 h-9 bg-primary hover:bg-primary/90 text-white rounded-lg flex items-center justify-center p-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl flex items-center justify-center p-0 border-2 border-white/20"
                >
                    {isOpen ? <X className="w-6 h-6" /> : (
                        <div className="relative">
                            <Bot className="w-8 h-8" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1c2a36]" />
                        </div>
                    )}
                </Button>
            </motion.div>
        </div>
    )
}
