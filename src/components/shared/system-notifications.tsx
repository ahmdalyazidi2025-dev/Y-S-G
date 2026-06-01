"use client"

import { useEffect, useRef } from "react"
import { useStore } from "@/context/store-context"
import { toast } from "sonner"
import { ShoppingBag, MessageSquare, AlertTriangle, CheckCircle2, UserPlus, Phone } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export function SystemNotifications() {
    const { orders, messages, productRequests: requests, currentUser, playSound, joinRequests = [], passwordRequests = [] } = useStore()
    const pathname = usePathname()
    const router = useRouter()

    // track previous counts to detect "new" items vs initial load
    const prevOrdersLength = useRef(orders.length)
    const prevMessagesLength = useRef(messages.length)
    const prevRequestsLength = useRef(requests.length)
    const prevJoinRequestsLength = useRef(joinRequests.length)
    const prevPasswordRequestsLength = useRef(passwordRequests.length)

    // Track previous status of specific orders for customer updates
    const prevOrderStatuses = useRef<Record<string, string>>({})

    const isFirstLoad = useRef(true)

    // Helper to determine if we are in admin view
    const isAdminView = pathname?.startsWith('/admin')
    const isAdminUser = currentUser?.role === 'admin' || currentUser?.role === 'staff'

    // --------------------------------------------------------------------------
    // 1. ORDERS MONITORING (Admin + Customer)
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isFirstLoad.current) {
            // Just sync state on first load, don't ping
            prevOrdersLength.current = orders.length
            orders.forEach(o => prevOrderStatuses.current[o.id] = o.status)
            return
        }

        // --- ADMIN: New Order Detection ---
        if (isAdminUser && orders.length > prevOrdersLength.current) {
            // Find the new order (naive check: latest one)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newOrder = orders.sort((a, b) => {
                const timeA = (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt).getTime()
                const timeB = (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt).getTime()
                return timeB - timeA
            })[0]

            // Only alert if recent (avoid stale state alerts)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const orderTime = (newOrder.createdAt as any).toMillis ? (newOrder.createdAt as any).toMillis() : new Date(newOrder.createdAt).getTime()
            const isRecent = (Date.now() - orderTime) < 60000 // created in last minute

            if (isRecent) {
                if (playSound) playSound('newOrder')
                toast.success(`طلب جديد بقيمة ${newOrder.total} ر.س`, {
                    description: `العميل: ${newOrder.customerName}`,
                    icon: <ShoppingBag className="w-6 h-6 text-emerald-500" />,
                    duration: 8000,
                    className: "border-2 border-emerald-500/20 bg-emerald-500/5",
                    action: {
                        label: "عرض الطلب",
                        onClick: () => window.location.href = `/admin/orders`
                    }
                })
            }
        }

        // --- CUSTOMER: Order Status Update Detection ---
        if (!isAdminUser && currentUser) {
            orders.forEach(order => {
                const prevStatus = prevOrderStatuses.current[order.id]
                // If status changed and it's NOT the initial pending state (unless newly created, but that's separate)
                if (prevStatus && prevStatus !== order.status) {

                    let msg = `تغيرت حالة الطلب #${order.id.slice(0, 4)}`
                    let icon = <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    let sound: 'statusUpdate' | 'newOrder' | 'generalPush' = 'statusUpdate'

                    if (order.status === 'processing') {
                        msg = "تمت الموافقة على طلبك! سيصلك قريباً"
                        sound = 'newOrder' // Happy sound!
                        icon = <CheckCircle2 className="w-5 h-5 text-green-500" />
                    } else if (order.status === 'canceled') {
                        msg = "عذراً، تم رفض الطلب. يرجى مراجعة الإشعارات"
                        // Alert sound logic usually maps to statusUpdate or I can reuse generalPush
                        sound = 'statusUpdate'
                        icon = <AlertTriangle className="w-5 h-5 text-red-500" />
                    } else if (order.status === 'delivered') {
                        msg = "تم توصيل الطلب بنجاح. شكراً لتسوقك!"
                        sound = 'newOrder'
                    }

                    if (playSound) playSound(sound)

                    toast.custom((t) => (
                        <div className="p-4 rounded-xl border-l-4 shadow-xl backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 transition-all w-full max-w-[95vw] sm:max-w-[400px] flex flex-col gap-3 border-emerald-500/80 ring-1 ring-emerald-500/20">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-emerald-500/10">
                                        {icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">تحديث حالة الطلب</h4>
                                    </div>
                                </div>
                                <button onClick={() => toast.dismiss(t)} className="text-muted-foreground hover:text-foreground">
                                    X
                                </button>
                            </div>

                            <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                                {msg}
                            </p>

                            <div className="flex justify-end pt-2 border-t border-border/50">
                                <button
                                    onClick={() => {
                                        toast.dismiss(t)
                                        router.push(`/customer/orders/${order.id}`)
                                    }}
                                    className="text-xs font-bold px-4 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                                >
                                    عرض الطلب
                                </button>
                            </div>
                        </div>
                    ), { duration: 6000 })
                }
                prevOrderStatuses.current[order.id] = order.status
            })
        }

        // Sync ref
        prevOrdersLength.current = orders.length
        orders.forEach(o => prevOrderStatuses.current[o.id] = o.status)

    }, [orders, isAdminUser, currentUser, playSound])


    // --------------------------------------------------------------------------
    // 2. MESSAGES MONITORING
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isFirstLoad.current) {
            prevMessagesLength.current = messages.length
            return
        }

        if (messages.length > prevMessagesLength.current) {
            // Get latest message
            const sortedMsgs = [...messages].sort((a, b) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const timeA = (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt).getTime()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const timeB = (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt).getTime()
                return timeB - timeA
            })
            const latestMsg = sortedMsgs[0]

            // Only alert if I am NOT the sender
            const isMe = latestMsg.senderId === currentUser?.id || (latestMsg.isAdmin && isAdminUser)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const msgTime = (latestMsg.createdAt as any).toMillis ? (latestMsg.createdAt as any).toMillis() : (latestMsg.createdAt as any).getTime()
            const isRecent = (Date.now() - msgTime) < 30000 // 30s threshold

            if (!isMe && isRecent) {
                // Determine relevance
                if (isAdminUser || latestMsg.userId === currentUser?.id || latestMsg.text.includes(`@${currentUser?.id}`)) {
                    if (playSound) playSound('newMessage')

                    // Do not show toast if user is already on the chat page
                    const isCustomerOnChat = !isAdminUser && pathname === '/customer/chat'
                    const isAdminOnChat = isAdminUser && pathname === '/admin/chat'

                    if (!isCustomerOnChat && !isAdminOnChat) {
                        const isGlobal = latestMsg.userId === 'all'

                        toast.custom((t) => (
                            <div className={`p-4 rounded-xl border-l-4 shadow-xl backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 transition-all w-full max-w-[95vw] sm:max-w-[400px] flex flex-col gap-3
                            ${isGlobal ? 'border-primary/80 ring-1 ring-primary/20' : 'border-blue-500/80 ring-1 ring-blue-500/20'}`}>

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isGlobal ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">{latestMsg.senderName}</h4>
                                            <p className="text-xs text-muted-foreground">{isGlobal ? 'إشعار عام' : 'رسالة جديدة'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => toast.dismiss(t)} className="text-muted-foreground hover:text-foreground">
                                        X
                                    </button>
                                </div>

                                <p className="text-sm text-foreground/90 leading-relaxed font-medium line-clamp-3 overflow-hidden text-ellipsis">
                                    {latestMsg.text.replace(/\[بواسطة الآدمن\]/g, '').replace(/\(@[a-zA-Z0-9_-]+\)/g, '').trim()}
                                </p>

                                <div className="flex justify-end pt-2 border-t border-border/50">
                                    <button
                                        onClick={() => {
                                            toast.dismiss(t)
                                            const target = latestMsg.actionLink || (isAdminUser ? `/admin/chat` : `/customer/chat`)
                                            const match = target.match(/\?product=([a-zA-Z0-9_-]+)/i)
                                            if (match) {
                                                try {
                                                    localStorage.setItem("open_product_id", match[1])
                                                } catch (e) {}
                                                window.dispatchEvent(new CustomEvent("open-product-modal", { detail: match[1] }))
                                                if (window.location.pathname === "/customer" || window.location.pathname === "/customer/chat") return;
                                                // If not on customer home or chat, let it route, but localStorage is set now!
                                            }
                                            
                                            if (target.startsWith('/')) {
                                                router.push(target)
                                            } else {
                                                window.location.href = target
                                            }
                                        }}
                                        className="text-xs font-bold px-4 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                                    >
                                        {latestMsg.actionTitle || (latestMsg.actionLink ? "عرض" : "رد")}
                                    </button>
                                </div>
                            </div>
                        ), {
                            duration: 6000,
                        })
                    }
                }
            }
        }
        prevMessagesLength.current = messages.length
    }, [messages, isAdminUser, currentUser, playSound])


    // --------------------------------------------------------------------------
    // 3. REQUESTS MONITORING (Admin Only)
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isFirstLoad.current) {
            prevRequestsLength.current = requests.length
            isFirstLoad.current = false // END FIRST LOAD
            return
        }

        if (isAdminUser && requests.length > prevRequestsLength.current) {
            // Find the new request (latest one)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sortedRequests = [...requests].sort((a, b) => {
                const timeA = (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt).getTime()
                const timeB = (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt).getTime()
                return timeB - timeA
            })
            const newRequest = sortedRequests[0]

            if (newRequest) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const reqTime = (newRequest.createdAt as any).toMillis ? (newRequest.createdAt as any).toMillis() : new Date(newRequest.createdAt).getTime()
                const isRecent = (Date.now() - reqTime) < 60000 // created in last minute

                if (isRecent) {
                    if (playSound) playSound('statusUpdate')
                    toast.warning("طلب توفير منتج جديد", {
                        description: "قام أحد العملاء بطلب توفير منتج",
                        icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
                        action: {
                            label: "عرض",
                            onClick: () => window.location.href = `/admin/products`
                        }
                    })
                }
            }
        }
        prevRequestsLength.current = requests.length
    }, [requests, isAdminUser])

    // --------------------------------------------------------------------------
    // 4. JOIN REQUESTS MONITORING (Admin Only)
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isFirstLoad.current) {
            prevJoinRequestsLength.current = joinRequests.length
            return
        }

        if (isAdminUser && joinRequests.length > prevJoinRequestsLength.current) {
            // Find the new join request (latest one)
            const sortedJoins = [...joinRequests].sort((a, b) => {
                const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt).getTime()
                const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt).getTime()
                return timeB - timeA
            })
            const newJoin = sortedJoins[0]

            if (newJoin) {
                const reqTime = (newJoin.createdAt as any)?.toMillis ? (newJoin.createdAt as any).toMillis() : new Date(newJoin.createdAt).getTime()
                const isRecent = (Date.now() - reqTime) < 60000 // created in last minute

                if (isRecent) {
                    if (playSound) playSound('newMessage') // Ping sound
                    toast.success("طلب انضمام جديد", {
                        description: `العميل: ${newJoin.name} (${newJoin.phone})`,
                        icon: <UserPlus className="w-5 h-5 text-primary" />,
                        action: {
                            label: "عرض",
                            onClick: () => window.location.href = `/admin/join-requests`
                        }
                    })
                }
            }
        }
        prevJoinRequestsLength.current = joinRequests.length
    }, [joinRequests, isAdminUser, playSound])

    // --------------------------------------------------------------------------
    // 5. PASSWORD RECOVERY REQUESTS MONITORING (Admin Only)
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isFirstLoad.current) {
            prevPasswordRequestsLength.current = passwordRequests.length
            return
        }

        if (isAdminUser && passwordRequests.length > prevPasswordRequestsLength.current) {
            // Find the new password request (latest one)
            const sortedPasswords = [...passwordRequests].sort((a, b) => {
                const timeA = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt).getTime()
                const timeB = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt).getTime()
                return timeB - timeA
            })
            const newPassword = sortedPasswords[0]

            if (newPassword) {
                const reqTime = (newPassword.createdAt as any)?.toMillis ? (newPassword.createdAt as any).toMillis() : new Date(newPassword.createdAt).getTime()
                const isRecent = (Date.now() - reqTime) < 60000 // created in last minute

                if (isRecent) {
                    if (playSound) playSound('passwordRequest') // Alert beep sound
                    toast.warning("طلب استعادة كلمة المرور", {
                        description: `العميل: ${newPassword.customerName} (${newPassword.phone})`,
                        icon: <Phone className="w-5 h-5 text-amber-500" />,
                        action: {
                            label: "عرض",
                            onClick: () => window.location.href = `/admin/password-requests`
                        }
                    })
                }
            }
        }
        prevPasswordRequestsLength.current = passwordRequests.length
    }, [passwordRequests, isAdminUser, playSound])

    return null // Headless component
}
