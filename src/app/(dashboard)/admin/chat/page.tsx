"use client"
import { useState, useMemo, useEffect, Fragment } from "react"
import { differenceInDays, isSameDay } from "date-fns" // Ensure this is available or use native JS
import { Button } from "@/components/ui/button"
import { ArrowRight, Send, MessageCircle, Bell, Megaphone, User, ChevronLeft, Search } from "lucide-react"
import { useStore, Conversation } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShoppingBag, Link as LinkIcon, X, Copy, Plus } from "lucide-react"
export default function AdminChatPage() {
    const { messages, sendMessage, sendNotificationToGroup, sendGlobalMessage, customers, markMessagesRead, markSectionAsViewed } = useStore() // Added markMessagesRead
    const [msg, setMsg] = useState("")
    const [title, setTitle] = useState("") // Title for notification
    const [mode, setMode] = useState<"direct" | "broadcast" | "global_chat">("direct")
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Link & Product Picker State
    const [link, setLink] = useState("")
    const [linkTitle, setLinkTitle] = useState("")
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false)
    const [productSearch, setProductSearch] = useState("")

    const { products } = useStore() // Get products for picker
    // Auto-mark messages as read when chat is opened
    useEffect(() => {
        markSectionAsViewed('chat')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (selectedCustomer) {
            markMessagesRead(selectedCustomer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomer]) // Only run when customer selection changes, avoiding message update loop


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
                    unreadCount: !m.read && !m.isAdmin ? 1 : 0
                }
            } else {
                if (!convs[cid].lastMessageDate || m.createdAt > convs[cid].lastMessageDate!) {
                    convs[cid].lastMessage = m.text
                    convs[cid].lastMessageDate = m.createdAt
                }
                if (!m.read && !m.isAdmin) {
                    convs[cid].unreadCount += 1
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
        if (!msg.trim() && !link.trim()) return

        if (mode === "broadcast") {
            if (!title.trim()) return
            // Send as notification to ALL (Broadcasts use 'link' as the push target mainly)
            // But my update to sendNotificationToGroup allows passing a link.
            // Let's assume broadcast link is the action link.
            sendNotificationToGroup("all", title, msg, link || undefined)
            setMsg("")
            setTitle("")
            setLink("")
        } else if (mode === "global_chat") {
            // Send as chat message to ALL
            await sendGlobalMessage(msg, link, linkTitle)
            setMsg("")
            setLink("")
            setLinkTitle("")
            setShowLinkInput(false)
        } else if (selectedCustomer) {
            sendMessage(`${msg} (@${selectedCustomer})`, true, selectedCustomer, currentCustomerName, link, linkTitle)
            setMsg("")
            setLink("")
            setLinkTitle("")
            setShowLinkInput(false)
        }
    }

    const currentCustomerName = conversations.find(c => c.customerId === selectedCustomer)?.customerName

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col w-full overflow-hidden relative">
            <div className="flex items-center gap-4">
                {/* ... existing header ... */}
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted text-foreground">
                        <ArrowRight className="w-5 h-5 rotate-180 rtl:rotate-0 transform" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1 text-foreground">
                    {selectedCustomer ? `دردشة: ${currentCustomerName}` : "الدردشة والإشعارات"}
                </h1>
                {selectedCustomer && (
                    <Button variant="ghost" onClick={() => setSelectedCustomer(null)} className="text-primary text-xs font-bold">
                        رجوع للكل
                    </Button>
                )}
            </div>

            <div className="flex gap-2 text-xs p-1 bg-muted/30 rounded-xl border border-border/50">
                <Button
                    variant="ghost"
                    className={cn(
                        "flex-1 gap-2 h-10 transition-all rounded-lg",
                        mode === "direct"
                            ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                            : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm"
                    )}
                    onClick={() => { setMode("direct"); setSelectedCustomer(null); }}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة (فردي)</span>
                </Button>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex-1 gap-2 h-10 transition-all rounded-lg",
                        mode === "global_chat"
                            ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600"
                            : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm"
                    )}
                    onClick={() => { setMode("global_chat"); setSelectedCustomer(null); }}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>رسالة للكل (شات)</span>
                </Button>
                <Button
                    variant="ghost"
                    className={cn(
                        "flex-1 gap-2 h-10 transition-all rounded-lg",
                        mode === "broadcast"
                            ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                            : "text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm"
                    )}
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
                            (() => {
                                let lastDate: Date | null = null;
                                return activeChatMessages.map((m) => {
                                    // Robust Date Parsing
                                    let messageDate: Date;
                                    if (m.createdAt instanceof Date) {
                                        messageDate = m.createdAt;
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    } else if ((m.createdAt as any)?.toDate) {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        messageDate = (m.createdAt as any).toDate();
                                    } else {
                                        messageDate = new Date(m.createdAt as any);
                                    }

                                    const showDateSeparator = !lastDate || !isSameDay(messageDate, lastDate);
                                    lastDate = messageDate;

                                    return (
                                        <Fragment key={m.id}>
                                            {showDateSeparator && (
                                                <div className="flex items-center justify-center my-4">
                                                    <span className="bg-muted/50 text-muted-foreground text-[10px] px-3 py-1 rounded-full shadow-sm border border-border/50">
                                                        {format(messageDate, "eeee, d MMMM yyyy", { locale: ar })}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={cn(
                                                "max-w-[75%] p-3 rounded-2xl text-xs space-y-1 shadow-sm relative group transition-all hover:shadow-md",
                                                m.isAdmin
                                                    ? "bg-primary text-primary-foreground self-end rounded-br-none shadow-primary/10"
                                                    : "bg-white text-gray-800 self-start rounded-bl-none border border-gray-100"
                                            )}>
                                                <p className="leading-relaxed whitespace-pre-wrap">
                                                    {m.isAdmin ? m.text.replace(`(@${selectedCustomer})`, "").trim() : m.text}
                                                </p>
                                                <div className={cn(
                                                    "text-[9px] flex items-center justify-end gap-1 opacity-70",
                                                    m.isAdmin ? "text-primary-foreground/80" : "text-gray-500"
                                                )}>
                                                    <span>{format(messageDate, "hh:mm a", { locale: ar })}</span>
                                                    {m.isAdmin && (
                                                        <span>{m.read ? "✓✓" : "✓"}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Fragment>
                                    );
                                });
                            })()
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                        {/* Search Input */}
                        <div className="p-4 pb-2 sticky top-0 bg-background/95 backdrop-blur z-10 supports-[backdrop-filter]:bg-background/60">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="bg-secondary/50 border-transparent focus:bg-background focus:border-primary/50 rounded-xl pr-10 text-right h-10 w-full transition-all"
                                    placeholder="بحث عن عميل..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {conversations.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs py-10">
                                {searchQuery ? "لا يوجد عملاء بهذا الاسم" : "لا توجد محادثات"}
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.customerId}
                                    onClick={() => setSelectedCustomer(conv.customerId)}
                                    // ... existing conversation card
                                    className="p-4 border-b border-border/50 flex items-center gap-4 hover:bg-accent/50 cursor-pointer transition-colors active:bg-accent w-full group"
                                >
                                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-muted-foreground relative group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <User className="w-6 h-6" />
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-sm animate-in zoom-in">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-foreground truncate">{conv.customerName}</h4>
                                            {conv.lastMessageDate && (
                                                <span className="text-[10px] text-muted-foreground">{format(conv.lastMessageDate, "hh:mm a", { locale: ar })}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                                            {conv.lastMessage || "ابدأ الدردشة الآن..."}
                                        </p>
                                    </div>
                                    <ChevronLeft className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors rtl:rotate-180" />
                                </div>
                            ))
                        )}
                    </div>
                )}

                {(mode === "broadcast" || mode === "global_chat" || selectedCustomer) && (
                    <div className="flex flex-col gap-2 bg-background p-3 rounded-2xl border border-border shadow-sm m-2">
                        {/* Link Input Section */}
                        {showLinkInput && (
                            <div className="flex gap-2 animate-in slide-in-from-bottom-2 mb-2">
                                <Input
                                    placeholder="رابط (مثال: /product/123)"
                                    className="flex-1 bg-secondary/50 text-xs h-9"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                />
                                <Input
                                    placeholder="عنوان الزر (اختياري)"
                                    className="w-1/3 bg-secondary/50 text-xs h-9"
                                    value={linkTitle}
                                    onChange={(e) => setLinkTitle(e.target.value)}
                                />
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-red-500" onClick={() => {
                                    setLink("")
                                    setLinkTitle("")
                                    setShowLinkInput(false)
                                }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {mode === "broadcast" && (
                            <Input
                                placeholder="عنوان الإشعار..."
                                className="bg-secondary/50 border-transparent rounded-xl h-10 mb-1 focus:bg-background focus:border-primary/50"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        )}
                        <div className="flex gap-2 items-end">
                            {/* Tools Buttons */}
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn("h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10", showLinkInput && "text-primary bg-primary/10")}
                                    onClick={() => setShowLinkInput(!showLinkInput)}
                                    title="إضافة رابط"
                                >
                                    <LinkIcon className="w-5 h-5" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="إرفاق منتج"
                                    onClick={() => setIsProductPickerOpen(true)}
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                </Button>

                                <Dialog open={isProductPickerOpen} onOpenChange={setIsProductPickerOpen}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>اختر منتجاً للإرفاق</DialogTitle>
                                        </DialogHeader>
                                        <Input
                                            placeholder="بحث عن منتج..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="mb-4"
                                        />
                                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                                            {products
                                                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                                .map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer border border-transparent hover:border-border"
                                                        onClick={() => {
                                                            setLink(`/customer?product=${p.id}`)
                                                            setLinkTitle(`عرض ${p.name.split(" ").slice(0, 3).join(" ")}`) // Shorten title
                                                            setShowLinkInput(true)
                                                            setIsProductPickerOpen(false)
                                                        }}
                                                    >
                                                        {p.image && <img src={p.image} alt={p.name} className="w-10 h-10 rounded-md object-cover" />}
                                                        <div className="flex-1">
                                                            <p className="text-sm font-bold">{p.name}</p>
                                                            <p className="text-xs text-muted-foreground">{p.price} ر.س</p>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-primary" />
                                                    </div>
                                                ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Input
                                placeholder={mode === "broadcast" ? "نص الإشعار..." : "اكتب رسالتك..."}
                                className="bg-secondary/50 border-transparent rounded-xl h-12 focus:bg-background focus:border-primary/50 flex-1"
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <Button
                                size="icon"
                                className={cn(
                                    "h-12 w-12 rounded-[18px] flex-shrink-0 transition-all shadow-md",
                                    mode === "broadcast" ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 text-white" :
                                        mode === "global_chat" ? "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20 text-white" :
                                            "bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground"
                                )}
                                onClick={handleSend}
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
