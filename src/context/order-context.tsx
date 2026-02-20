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
    createOrder: (currentUser: User | null, cart: CartItem[], isDraft?: boolean, additionalInfo?: { name?: string, phone?: string }) => Promise<boolean>
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
            ordersQuery = query(collection(db, "orders"), where("customerId", "==", customerId), orderBy("createdAt", "desc"), limit(50))
        }

        const unsubOrders = onSnapshot(ordersQuery, (snap) => {
            setOrders(snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Order)))
            setLastOrderDoc(snap.docs[snap.docs.length - 1] || null)
            setHasMoreOrders(snap.docs.length === 50)
        })
        return () => { unsubCoupons(); unsubOrders() }
    }, [currentUser])

    const createOrder = async (currentUser: User | null, cart: CartItem[], isDraft = false, additionalInfo?: { name?: string, phone?: string }): Promise<boolean> => {
        if (!currentUser || !auth.currentUser) {
            toast.error("يجب تسجيل الدخول لإتمام الطلب")
            router.push("/auth/login")
            return false
        }
        if (cart.length === 0) return false

        const orderData = {
            customerName: additionalInfo?.name?.trim() || currentUser?.name || "عميل",
            customerPhone: additionalInfo?.phone?.trim() || currentUser?.phone || "",
            accountName: currentUser?.name || "زائر",
            customerId: auth.currentUser.uid,
            items: cart.map(item => ({ ...item })),
            total: cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0),
            status: isDraft ? "pending" : "processing",
            createdAt: Timestamp.now(),
            isRead: false
        }

        try {
            const counterRef = doc(db, "counters", "orders")
            const counterSnap = await getDoc(counterRef)
            const newCounterValue = (counterSnap.exists() ? (counterSnap.data().current || 0) : 0) + 1
            const orderId = newCounterValue.toString()

            await setDoc(doc(db, "orders", orderId), sanitizeData({ ...orderData, id: orderId }))
            await setDoc(counterRef, { current: newCounterValue }, { merge: true })

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
        if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
            toast.error(`القيمة الأدنى لاستخدام الكوبون هي ${coupon.minOrderValue}`)
            return null
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
