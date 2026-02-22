"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { db, auth } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, getDocs, where, limit, startAfter, getDoc, setDoc } from "firebase/firestore"
import { toast } from "sonner"
import { Order, Coupon, CartItem, User } from "@/types/store"
import { sanitizeData, toDate, hapticFeedback } from "@/lib/utils/store-helpers"
import { useRouter } from "next/navigation"
import { useCart } from "./cart-context"
import { useAuth } from "./auth-context"

interface OrderContextType {
    orders: Order[]
    coupons: Coupon[]
    hasMoreOrders: boolean
    createOrder: (currentUser: User | null, cart: CartItem[], isDraft?: boolean, additionalInfo?: { name?: string, phone?: string }, couponId?: string) => Promise<boolean>
    updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>
    loadMoreOrders: (currentUser?: User | null) => Promise<void>
    searchOrders: (term: string) => Promise<Order[]>
    markOrderAsRead: (orderId: string) => Promise<void>
    addCoupon: (coupon: Omit<Coupon, "id" | "createdAt" | "usedCount">) => Promise<void>
    deleteCoupon: (id: string) => Promise<void>
    applyCoupon: (code: string, cartTotal: number, currentUser: User | null) => Promise<Coupon | null>
    restoreDraftToCart: (orderId: string) => Promise<void>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: React.ReactNode }) {
    const [orders, setOrders] = useState<Order[]>([])
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [lastOrderDoc, setLastOrderDoc] = useState<any>(null)
    const [hasMoreOrders, setHasMoreOrders] = useState(true)
    const router = useRouter()
    const { restoreCart } = useCart()

    const { currentUser } = useAuth()
    useEffect(() => {
        const unsubCoupons = onSnapshot(collection(db, "coupons"), (snap) => {
            setCoupons(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Coupon)))
        })

        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff'
        const customerId = currentUser?.id || "guest"

        let ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50))
        if (!isAdmin && customerId) {
            // REMOVED orderBy and limit to avoid index requirement
            ordersQuery = query(collection(db, "orders"), where("customerId", "==", customerId))
        }

        const unsubOrders = onSnapshot(ordersQuery, (snap) => {
            const docs = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Order))
            if (!isAdmin && customerId) {
                // Client-side sort
                docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                const limitedDocs = docs.slice(0, 50)
                setOrders(limitedDocs)
                setLastOrderDoc(limitedDocs[limitedDocs.length - 1] || null)
                setHasMoreOrders(docs.length > 50) // Simplified hasMore for client-side
            } else {
                setOrders(docs)
                setLastOrderDoc(snap.docs[snap.docs.length - 1] || null)
                setHasMoreOrders(snap.docs.length === 50)
            }
        })
        return () => { unsubCoupons(); unsubOrders() }
    }, [currentUser])

    const createOrder = async (currentUserArg: User | null, cart: CartItem[], isDraft = false, additionalInfo?: { name?: string, phone?: string }, couponId?: string): Promise<boolean> => {
        const user = currentUserArg || currentUser
        if (!user) {
            toast.error("يجب تسجيل الدخول لإتمام الطلب")
            router.push("/auth/login")
            return false
        }
        if (cart.length === 0) return false

        const orderData = {
            customerName: additionalInfo?.name?.trim() || user?.name || "عميل",
            customerPhone: additionalInfo?.phone?.trim() || user?.phone || "",
            accountName: user?.name || "زائر",
            customerId: user.id,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                selectedPrice: item.selectedPrice,
                quantity: item.quantity,
                selectedUnit: item.selectedUnit,
                barcode: item.barcode,
                category: item.category
            })),
            total: cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0),
            status: isDraft ? "pending" : "processing",
            createdAt: Timestamp.now(),
            isRead: false
        }

        try {
            let orderId: string
            try {
                const counterRef = doc(db, "counters", "orders")
                const counterSnap = await getDoc(counterRef)
                const newCounterValue = (counterSnap.exists() ? (counterSnap.data().current || 0) : 0) + 1
                orderId = newCounterValue.toString()
                await setDoc(counterRef, { current: newCounterValue }, { merge: true })
            } catch (counterError) {
                console.warn("Counter logic failed, falling back to timestamp ID:", counterError)
                orderId = Date.now().toString().slice(-8) // Fallback to last 8 digits of timestamp
            }

            await setDoc(doc(db, "orders", orderId), sanitizeData({ ...orderData, id: orderId, appliedCouponId: couponId || null }))

            if (couponId && !isDraft) {
                try {
                    const couponRef = doc(db, "coupons", couponId)
                    const couponSnap = await getDoc(couponRef)
                    if (couponSnap.exists()) {
                        await updateDoc(couponRef, {
                            usedCount: (couponSnap.data().usedCount || 0) + 1
                        })
                    }
                } catch (e) {
                    console.error("Error updating coupon count:", e)
                }
            }

            toast.success(isDraft ? "تم حفظ المسودة" : "تم استلام طلبك بنجاح! 🚀")
            hapticFeedback('success')
            return true
        } catch (e) {
            console.error("Error creating order:", e)
            toast.error("حدث خطأ أثناء حفظ الطلب")
            return false
        }
    }

    const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
        await updateDoc(doc(db, "orders", orderId), { status })
        toast.info(`تم تحديث الحالة إلى: ${status}`)
    }

    const loadMoreOrders = async (currentUserArg?: User | null) => {
        if (!lastOrderDoc || !hasMoreOrders) return

        let q = query(collection(db, "orders"), orderBy("createdAt", "desc"), startAfter(lastOrderDoc), limit(50))
        if (currentUserArg?.role === 'customer') {
            q = query(collection(db, "orders"), where("customerId", "==", currentUserArg.id), orderBy("createdAt", "desc"), startAfter(lastOrderDoc), limit(50))
        }

        const snap = await getDocs(q)
        const newOrders = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Order))
        setOrders(prev => [...prev, ...newOrders])
        setLastOrderDoc(snap.docs[snap.docs.length - 1] || null)
        setHasMoreOrders(snap.docs.length === 50)
    }

    const searchOrders = async (term: string) => {
        const q = query(collection(db, "orders"), where("id", "==", term))
        const snap = await getDocs(q)
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Order))
    }

    const markOrderAsRead = async (orderId: string) => {
        await updateDoc(doc(db, "orders", orderId), { isRead: true })
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isRead: true } : o))
    }

    const addCoupon = async (coupon: Omit<Coupon, "id" | "createdAt" | "usedCount">) => {
        await addDoc(collection(db, "coupons"), sanitizeData({ ...coupon, usedCount: 0, createdAt: Timestamp.now() }))
        toast.success("تم إنشاء الكوبون")
    }

    const deleteCoupon = async (id: string) => {
        await deleteDoc(doc(db, "coupons", id))
        toast.error("تم حذف الكوبون")
    }

    const applyCoupon = async (code: string, cartTotal: number, currentUser: User | null) => {
        const coupon = coupons.find(c => c.code === code && c.active)
        if (!coupon) {
            toast.error("كود الخصم غير صحيح")
            return null
        }

        // 1. Check Usage Limit
        if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
            toast.error("عذراً، هذا الكوبون وصل للحد الأقصى من الاستخدام")
            return null
        }

        // 2. Check Dates
        const now = Timestamp.now().toMillis()
        if (coupon.startDate && coupon.startDate.toMillis() > now) {
            toast.error("هذا الكوبون لم يبدأ تفعيله بعد")
            return null
        }
        if (coupon.expiryDate && coupon.expiryDate.toMillis() < now) {
            toast.error("عذراً، هذا الكوبون منتهي الصلاحية")
            return null
        }

        // 3. Check Minimum Order Value
        if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
            toast.error(`القيمة الأدنى لاستخدام الكوبون هي ${coupon.minOrderValue} ر.س`)
            return null
        }

        // 4. Check Customer Types / Segments
        if (coupon.allowedCustomerTypes && coupon.allowedCustomerTypes !== "all") {
            if (!currentUser) {
                toast.error("هذا الكوبون مخصص لفئات معينة من العملاء")
                return null
            }

            // Calculate segments for the user
            const userOrders = orders.filter(o => o.customerId === currentUser.id)
            const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0)
            const lastOrderDate = userOrders.length > 0
                ? new Date(Math.max(...userOrders.map(o => new Date(o.createdAt).getTime())))
                : null

            const stats = { totalSpent, lastOrderDate, orderCount: userOrders.length }

            const satisfiesSegmentation = (Array.isArray(coupon.allowedCustomerTypes) ? coupon.allowedCustomerTypes : [coupon.allowedCustomerTypes]).some(type => {
                if (type === "vip") return stats.totalSpent > 5000
                if (type === "active") {
                    if (!stats.lastOrderDate) return false
                    const days = (new Date().getTime() - stats.lastOrderDate.getTime()) / (1000 * 3600 * 24)
                    return days <= 30
                }
                if (type === "semi_active") {
                    if (!stats.lastOrderDate) return false
                    const days = (new Date().getTime() - stats.lastOrderDate.getTime()) / (1000 * 3600 * 24)
                    return days > 30 && days <= 90
                }
                if (type === "interactive") {
                    const daysSinceActive = currentUser.lastActive ? (new Date().getTime() - new Date(currentUser.lastActive).getTime()) / (1000 * 3600 * 24) : Infinity
                    return daysSinceActive <= 7 && stats.orderCount === 0
                }
                if (type === "dormant") {
                    const daysSinceActive = currentUser.lastActive ? (new Date().getTime() - new Date(currentUser.lastActive).getTime()) / (1000 * 3600 * 24) : Infinity
                    return daysSinceActive > 90
                }
                if (type === "wholesale") return false // Needs explicit wholesale check if available
                return false
            })

            if (!satisfiesSegmentation) {
                toast.error("هذا الكوبون غير متاح لفئة حسابك حالياً")
                return null
            }
        }

        // 5. Check Customer Usage Limit (already used by THIS user)
        if (coupon.customerUsageLimit && currentUser) {
            const count = orders.filter(o => o.customerId === currentUser.id && (o as any).appliedCouponId === coupon.id).length
            if (count >= coupon.customerUsageLimit) {
                toast.error(`لقد استنفدت حد استخدام هذا الكوبون (${coupon.customerUsageLimit} مرات)`)
                return null
            }
        }

        return coupon
    }

    const restoreDraftToCart = useCallback(async (orderId: string) => {
        const order = orders.find(o => o.id === orderId)
        if (!order) return
        restoreCart(order.items)
    }, [orders, restoreCart])

    return (
        <OrderContext.Provider value={{
            orders, coupons, hasMoreOrders, createOrder, updateOrderStatus, loadMoreOrders, searchOrders, markOrderAsRead, addCoupon, deleteCoupon, applyCoupon, restoreDraftToCart
        }}>
            {children}
        </OrderContext.Provider>
    )
}

export const useOrders = () => {
    const context = useContext(OrderContext)
    if (!context) throw new Error("useOrders must be used within OrderProvider")
    return context
}
