"use client"

import { useEffect, useRef } from "react"
import { useStore } from "@/context/store-context"
import { toast } from "sonner"
import { playNewOrderSound, playNotificationSound, playAlertSound } from "@/lib/sounds"
import { ShoppingBag, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react"
import { usePathname } from "next/navigation"

export function SystemNotifications() {
    const { orders, messages, productRequests: requests, currentUser } = useStore()
    const pathname = usePathname()

    // track previous counts to detect "new" items vs initial load
    const prevOrdersLength = useRef(orders.length)
    const prevMessagesLength = useRef(messages.length)
    const prevRequestsLength = useRef(requests.length)

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
                playNewOrderSound()
                toast.success(`طلب جديد بقيمة ${newOrder.total} د.ع`, {
                    description: `العميل: ${newOrder.customerName}`,
                    icon: <ShoppingBag className="w-5 h-5 text-green-500" />,
                    duration: 5000,
                    action: {
                        label: "عرض",
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
                    playNotificationSound() // Soft ping for update

                    let msg = `تغيرت حالة الطلب #${order.id.slice(0, 4)}`
                    let icon = <CheckCircle2 className="w-5 h-5 text-blue-500" />

                    if (order.status === 'accepted') {
                        msg = "تمت الموافقة على طلبك! سيصلك قريباً"
                        playNewOrderSound() // Happy sound!
                        icon = <CheckCircle2 className="w-5 h-5 text-green-500" />
                    } else if (order.status === 'rejected') {
                        msg = "عذراً، تم رفض الطلب. يرجى مراجعة الإشعارات"
                        playAlertSound()
                        icon = <AlertTriangle className="w-5 h-5 text-red-500" />
                    } else if (order.status === 'delivered') {
                        msg = "تم توصيل الطلب بنجاح. شكراً لتسوقك!"
                        playNewOrderSound()
                    }

                    toast(msg, { icon })
                }
                prevOrderStatuses.current[order.id] = order.status
            })
        }

        // Sync ref
        prevOrdersLength.current = orders.length
        orders.forEach(o => prevOrderStatuses.current[o.id] = o.status)

    }, [orders, isAdminUser, currentUser])


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
                    playNotificationSound()
                    toast.message(latestMsg.senderName, {
                        description: latestMsg.text,
                        icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
                        action: {
                            label: "رد",
                            onClick: () => window.location.href = isAdminUser ? `/admin/chat` : `/customer/chat`
                        }
                    })
                }
            }
        }
        prevMessagesLength.current = messages.length
    }, [messages, isAdminUser, currentUser])


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
                    playAlertSound()
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

    return null // Headless component
}
