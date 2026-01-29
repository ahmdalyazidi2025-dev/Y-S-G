"use client"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, MessageCircle, Bell, Megaphone, User, ChevronLeft, Search } from "lucide-react"
import { useStore, Conversation } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import Link from "next/link"
export default function AdminChatPage() {
    const { messages, sendMessage, sendNotificationToGroup, sendGlobalMessage, customers } = useStore()
    const [msg, setMsg] = useState("")
    const [title, setTitle] = useState("") // Title for notification
    const [mode, setMode] = useState<"direct" | "broadcast" | "global_chat">("direct")
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Group messages into conversations
    const conversations = useMemo(() => {
        // ... existing logic ...
        const convs: Record<string, Conversation> = {}

        // Initialize with customers to ensure names are correct
        customers.forEach(c => {
            convs[c.id] = {
                customerId: c.id,
                customerName: c.name || "عميل بدون اسم",
                unreadCount: 0
            }
        })

        messages.forEach(m => {
            if (m.isAdmin) return // Admin messages don't create new conversations in list

            const cid = m.senderId
            if (!convs[cid]) {
                convs[cid] = {
                    customerId: cid,
                    customerName: m.senderName || "عميل غير معروف",
                    lastMessage: m.text,
                    lastMessageDate: m.createdAt,
                    unreadCount: 0
                }
            } else {
                if (!convs[cid].lastMessageDate || m.createdAt > convs[cid].lastMessageDate!) {
                    convs[cid].lastMessage = m.text
                    convs[cid].lastMessageDate = m.createdAt
                }
            }
        })

        return Object.values(convs)
            .filter(c => c.lastMessage || customers.some(cust => cust.id === c.customerId))
            .filter(c => c.customerName.toLowerCase().includes(searchQuery.toLowerCase())) // Filter by search
            .sort((a, b) => {
                if (!a.lastMessageDate) return 1
                if (!b.lastMessageDate) return -1
                return b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
            })
    }, [messages, customers, searchQuery])

    // ... existing activeChatMessages and handleSend ...
    const activeChatMessages = useMemo(() => {
        if (!selectedCustomer) return []
        return messages.filter(m => m.senderId === selectedCustomer || (m.senderId === "admin" && m.text.includes(`@${selectedCustomer}`)))
    }, [messages, selectedCustomer])

    const handleSend = async () => {
        if (!msg.trim()) return

        if (mode === "broadcast") {
            if (!title.trim()) return
            // Send as notification to ALL
            sendNotificationToGroup("all", title, msg)
            setMsg("")
            setTitle("")
        } else if (mode === "global_chat") {
            // Send as chat message to ALL
            await sendGlobalMessage(msg)
            setMsg("")
        } else if (selectedCustomer) {
            sendMessage(`${msg} (@${selectedCustomer})`, true, selectedCustomer)
            setMsg("")
        }
    }

    const currentCustomerName = conversations.find(c => c.customerId === selectedCustomer)?.customerName

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col w-full overflow-hidden relative">
            <div className="flex items-center gap-4">
                {/* ... existing header ... */}
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
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

            <div className="flex gap-2 text-xs">
                {/* ... existing mode buttons ... */}
                <Button
                    variant="glass"
                    className={cn("flex-1 gap-2 h-10", mode === "direct" && "bg-primary text-white border-primary/20", mode !== "direct" && "opacity-50")}
                    onClick={() => { setMode("direct"); setSelectedCustomer(null); }}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة (فردي)</span>
                </Button>
                <Button
                    variant="glass"
                    className={cn("flex-1 gap-2 h-10", mode === "global_chat" && "bg-blue-500 text-white border-blue-500/20", mode !== "global_chat" && "opacity-50")}
                    onClick={() => { setMode("global_chat"); setSelectedCustomer(null); }}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>رسالة للكل (شات)</span>
                </Button>
                <Button
                    variant="glass"
                    className={cn("flex-1 gap-2 h-10", mode === "broadcast" && "bg-orange-500 text-white border-orange-500/20", mode !== "broadcast" && "opacity-50")}
                    onClick={() => { setMode("broadcast"); setSelectedCustomer(null); }}
                >
                    <Megaphone className="w-4 h-4" />
                    <span>إشعار للكل (تنبيه)</span>
                </Button>
            </div>

            <div className="flex-1 glass-card overflow-hidden flex flex-col">
                {mode === "broadcast" ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        {/* ... broadcast view ... */}
                        <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center">
                            <Bell className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">إرسال إشعار عام</h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-[200px] mx-auto">
                                سيصل كإشعار منبثق لجميع العملاء (ليس رسالة دردشة)
                            </p>
                        </div>
                    </div>
                ) : mode === "global_chat" ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        {/* ... global chat view ... */}
                        <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">رسالة دردشة جماعية</h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-[200px] mx-auto">
                                ستصل هذه الرسالة داخل صندوق الدردشة لكل عميل
                            </p>
                        </div>
                    </div>
                ) : selectedCustomer ? (
                    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 no-scrollbar">
                        {/* ... active chat messages ... */}
                        {activeChatMessages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                                لا توجد رسائل سابقة مع هذا العميل
                            </div>
                        ) : (
                            activeChatMessages.map((m) => (
                                <div key={m.id} className={cn(
                                    "max-w-[80%] p-3 rounded-2xl text-xs space-y-1",
                                    m.isAdmin ? "bg-primary text-white self-end rounded-br-none" : "bg-white/10 text-slate-200 self-start rounded-bl-none"
                                )}>
                                    <p>{m.isAdmin ? m.text.replace(`(@${selectedCustomer})`, "").trim() : m.text}</p>
                                    <p className="text-[8px] opacity-50 text-left">{format(m.createdAt, "hh:mm a", { locale: ar })}</p>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                        {/* Search Input */}
                        <div className="p-4 pb-2 sticky top-0 bg-[#0f172a]/95 backdrop-blur z-10">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    className="bg-white/5 border-white/10 rounded-xl pr-10 text-right h-10 w-full focus:bg-white/10 transition-colors"
                                    placeholder="بحث عن عميل..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {conversations.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs py-10">
                                {searchQuery ? "لا يوجد عملاء بهذا الاسم" : "لا توجد محادثات"}
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.customerId}
                                    onClick={() => setSelectedCustomer(conv.customerId)}
                                    // ... existing conversation card
                                    className="p-4 border-b border-white/5 flex items-center gap-4 hover:bg-white/5 cursor-pointer transition-colors active:bg-white/10 w-full"
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-slate-400 relative">
                                        <User className="w-6 h-6" />
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1c2a36]">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-white truncate">{conv.customerName}</h4>
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
                            ))
                        )}
                    </div>

            {(mode === "broadcast" || mode === "global_chat" || selectedCustomer) && (
                    <div className="flex flex-col gap-2 bg-[#1c2a36] p-3 rounded-2xl border border-white/10">
                        {mode === "broadcast" && (
                            <Input
                                placeholder="عنوان الإشعار..."
                                className="bg-black/20 border-white/5 rounded-xl h-10 mb-1"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        )}
                        <div className="flex gap-2">
                            <Input
                                placeholder={mode === "broadcast" ? "نص الإشعار..." : "اكتب رسالتك..."}
                                className="bg-black/20 border-white/5 rounded-xl h-12"
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <Button
                                size="icon"
                                className={cn(
                                    "h-12 w-12 rounded-[18px] flex-shrink-0 transition-all border border-white/10 shadow-lg",
                                    mode === "broadcast" ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20" :
                                        mode === "global_chat" ? "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20" :
                                            "bg-primary hover:bg-primary/90 shadow-primary/20"
                                )}
                                onClick={handleSend}
                            >
                                <Send className="w-5 h-5 text-white" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            )
}
