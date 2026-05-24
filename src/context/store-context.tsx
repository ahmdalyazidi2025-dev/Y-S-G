"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { db } from "@/lib/firebase"
import {
    collection, addDoc, updateDoc, doc, deleteDoc,
    onSnapshot, query, orderBy, Timestamp, setDoc,
    QuerySnapshot, DocumentSnapshot, DocumentData
} from "firebase/firestore"

export type Banner = {
    id: string
    image: string
    active: boolean
    title?: string
    fontFamily?: string
    textColor?: string
    description?: string
}

export type Product = {
    id: string
    name: string
    price: number
    pricePiece: number
    oldPricePiece?: number
    priceDozen?: number
    oldPriceDozen?: number
    unit: string
    barcode: string
    category: string
    image?: string
    images?: string[]
    discountEndDate?: Date
    isDraft?: boolean
    notes?: string
    costPrice?: number
    description?: string
    barcodes?: string[]
}

export type CartItem = Product & {
    quantity: number
    selectedUnit: string
    selectedPrice: number
}

export type Category = {
    id: string
    nameAr: string
    nameEn: string
    image?: string
    icon?: string
    isHidden?: boolean
}

export type Customer = {
    id: string
    name: string
    phone: string
    password?: string
    username: string
    location?: string
    lastActive?: Date
    referralCount?: number
    referralCode?: string
}

export type Coupon = {
    id: string
    code: string
    discount: number
    type: "percentage" | "fixed"
    usageLimit?: number
    usedCount?: number
    active: boolean
    minOrderValue?: number
    categoryId?: string
    expiryDate: any
    startDate?: any
    customerUsageLimit?: number
    allowedCustomerTypes?: string | string[]
}

export type StaffMember = {
    id: string
    name: string
    username: string
    password?: string
    phone?: string
    email?: string
    role?: "admin" | "staff"
    permissions: string[] // "orders", "products", "customers", "settings", "chat", "sales"
    createdAt?: Date
}

export type User = {
    id: string
    name: string
    role: "admin" | "customer" | "staff"
    username: string
    phone?: string
    location?: string
    permissions?: string[]
    email?: string
}

export type Order = {
    id: string
    customerName: string
    customerPhone?: string
    customerLocation?: string
    customerId: string
    items: CartItem[]
    total: number
    status: "pending" | "processing" | "shipped" | "delivered" | "canceled"
    createdAt: Date
    statusHistory: { status: string, timestamp: Date }[]
    paymentMethod?: string
}

export type ProductRequest = {
    id: string
    customerName: string
    image?: string
    description?: string
    status: "pending" | "fulfilled" | "rejected"
    createdAt: Date
}

export type Message = {
    id: string
    senderId: string
    senderName: string
    text: string
    createdAt: Date
    isAdmin: boolean
    userId?: string
    isSystemNotification?: boolean
    read?: boolean
    actionLink?: string
    actionTitle?: string
}

export type Conversation = {
    customerId: string
    customerName: string
    lastMessage?: string
    lastMessageDate?: Date
    unreadCount: number
}

export type StoreSettings = {
    shippingTitle: string
    shippingDesc: string
    paymentTitle: string
    paymentDesc: string
    supportTitle: string
    supportDesc: string
    aboutTitle: string
    aboutText: string
    contactPhone: string
    contactAddress: string
    socialWhatsapp: string
    socialTwitter: string
    socialInstagram: string
    socialFacebook: string
    socialTiktok: string
    socialSnapchat: string
    footerTerms: string
    footerPrivacy: string
    footerReturns: string
    requireCustomerInfoOnCheckout: boolean
    enableBarcodeScanner?: boolean
    enableAiSystem?: boolean
    enableCoupons?: boolean
    logoUrl?: string
    groqApiKey?: string
}

type StoreContextType = {
    products: Product[]
    cart: CartItem[]
    orders: Order[]
    categories: Category[]
    customers: Customer[]
    banners: Banner[]
    productRequests: ProductRequest[]
    addToCart: (product: Product, unit?: string, price?: number) => void
    removeFromCart: (productId: string, unit: string) => void
    clearCart: (asDraft?: boolean) => void
    createOrder: (isDraft?: boolean, additionalInfo?: { name?: string, phone?: string }) => void
    scanProduct: (barcode: string) => Product | null
    addProduct: (product: Omit<Product, "id">) => void
    updateProduct: (id: string, data: Partial<Product>) => void
    deleteProduct: (productId: string) => void
    addCategory: (category: Omit<Category, "id">) => void
    updateCategory: (category: Category) => void
    deleteCategory: (categoryId: string) => void
    reorderCategories?: (categories: Category[]) => Promise<void>
    addCustomer: (customer: Omit<Customer, "id">) => void
    updateCustomer: (customer: Customer) => void
    deleteCustomer: (customerId: string) => void
    coupons: Coupon[]
    addCoupon: (coupon: Omit<Coupon, "id">) => void
    deleteCoupon: (couponId: string) => void
    updateOrderStatus: (orderId: string, status: Order["status"]) => void
    addBanner: (banner: Omit<Banner, "id">) => void
    deleteBanner: (bannerId: string) => void
    toggleBanner: (bannerId: string) => void
    addProductRequest: (request: Omit<ProductRequest, "id" | "status" | "createdAt">) => void
    updateProductRequestStatus: (requestId: string, status: ProductRequest["status"]) => void
    staff: StaffMember[]
    addStaff: (member: Omit<StaffMember, "id" | "createdAt">) => void
    updateStaff: (member: StaffMember) => void
    deleteStaff: (memberId: string) => void
    resetPassword?: (userId: string) => Promise<void>
    addExistingUserAsStaff?: (userId: string) => Promise<void>
    broadcastToCategory: (category: string, text: string) => void
    messages: Message[]
    notifications?: any[]
    guestId?: string
    markAllNotificationsRead?: () => void
    markMessagesRead?: () => void
    sendMessage: (text: string, isAdmin: boolean, customerId?: string, customerName?: string) => void
    broadcastNotification: (text: string) => void
    currentUser: User | null
    login: (username: string, password: string, role: "admin" | "customer" | "staff") => Promise<boolean>
    logout: () => void
    updateCartQuantity: (productId: string, unit: string, delta: number) => void
    restoreDraftToCart: (orderId: string) => void
    storeSettings: StoreSettings
    updateStoreSettings: (settings: StoreSettings) => void
    loading?: boolean
    playSound?: (type: string) => void
    adminPreferences?: any
    joinRequests?: any[]
    markNotificationRead?: (id: string) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const MOCK_SETTINGS: StoreSettings = {
    shippingTitle: "الشحن مجاناً",
    shippingDesc: "لكل الطلبات التي تفوق 500 ريال",
    paymentTitle: "الدفع عند الاستلام",
    paymentDesc: "الدفع عند استلام طلبك",
    supportTitle: "دعم مخصص",
    supportDesc: "الدعم 6 أيام في الأسبوع خلال الدوام الرسمي",
    aboutTitle: "مجموعة يحيى سلمان غزواني التجارية",
    aboutText: "مجموعة يحيى سلمان غزواني التجارية لجميع متطلبات محلات صيانة السيارات توفر العديد من المنتجات ذات الجودة العالية (فلاتر - بطاريات - كفرات - زيوت - عدد يدوية - وغيرها).",
    contactPhone: "0534422707",
    contactAddress: "الدمام - شارع الملك عبدالعزيز - العزيزية",
    socialWhatsapp: "https://wa.me/0534422707",
    socialTwitter: "",
    socialInstagram: "",
    socialFacebook: "",
    socialTiktok: "",
    socialSnapchat: "",
    footerTerms: "شروط الاستخدام",
    footerPrivacy: "الشروط والأحكام",
    footerReturns: "سياسة الاسترجاع",
    requireCustomerInfoOnCheckout: false,
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [banners, setBanners] = useState<Banner[]>([])
    const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        if (typeof window !== "undefined") {
            const savedUser = localStorage.getItem("ysg_user")
            try {
                return savedUser ? JSON.parse(savedUser) : null
            } catch (e) {
                localStorage.removeItem("ysg_user")
                return null
            }
        }
        return null
    })
    const [storeSettings, setStoreSettings] = useState<StoreSettings>(MOCK_SETTINGS)

    const toDate = useCallback((ts: Timestamp | Date | { seconds: number, nanoseconds: number } | null | undefined): Date => {
        if (!ts) return new Date()
        if (ts instanceof Timestamp) return ts.toDate()
        if (ts instanceof Date) return ts
        if (typeof ts === 'object' && 'seconds' in ts) return new Timestamp(ts.seconds, ts.nanoseconds).toDate()
        return new Date()
    }, [])

    useEffect(() => {
        const unsubProducts = onSnapshot(collection(db, "products"), (snap: QuerySnapshot<DocumentData>) => {
            setProducts(snap.docs.map((doc) => {
                const data = doc.data() as Omit<Product, "id">
                return {
                    ...data,
                    id: doc.id,
                    discountEndDate: data.discountEndDate ? toDate(data.discountEndDate) : undefined
                } as Product
            }))
        })

        const unsubCategories = onSnapshot(collection(db, "categories"), (snap: QuerySnapshot<DocumentData>) => {
            setCategories(snap.docs.map((doc) => ({ ...doc.data() as Omit<Category, "id">, id: doc.id } as Category)))
        })

        const unsubCustomers = onSnapshot(collection(db, "customers"), (snap: QuerySnapshot<DocumentData>) => {
            setCustomers(snap.docs.map((doc) => {
                const data = doc.data()
                return {
                    ...data,
                    id: doc.id,
                    lastActive: data.lastActive ? toDate(data.lastActive) : undefined
                } as Customer
            }))
        })

        const unsubStaff = onSnapshot(collection(db, "staff"), (snap: QuerySnapshot<DocumentData>) => {
            setStaff(snap.docs.map((doc) => {
                const data = doc.data()
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt ? toDate(data.createdAt) : undefined
                } as StaffMember
            }))
        })

        const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap: QuerySnapshot<DocumentData>) => {
            setOrders(snap.docs.map((doc) => {
                const data = doc.data() as Omit<Order, "id">
                return {
                    ...data,
                    id: doc.id,
                    createdAt: toDate(data.createdAt),
                    statusHistory: (data.statusHistory || []).map((h: { status: string, timestamp: Timestamp | Date | { seconds: number, nanoseconds: number } }) => ({ ...h, timestamp: toDate(h.timestamp) }))
                } as Order
            }))
        })

        const unsubBanners = onSnapshot(collection(db, "banners"), (snap: QuerySnapshot<DocumentData>) => {
            setBanners(snap.docs.map((doc) => ({ ...doc.data() as Omit<Banner, "id">, id: doc.id } as Banner)))
        })

        const unsubRequests = onSnapshot(query(collection(db, "requests"), orderBy("createdAt", "desc")), (snap: QuerySnapshot<DocumentData>) => {
            setProductRequests(snap.docs.map((doc) => {
                const data = doc.data() as Omit<ProductRequest, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as ProductRequest
            }))
        })

        const unsubMessages = onSnapshot(query(collection(db, "messages"), orderBy("createdAt", "asc")), (snap: QuerySnapshot<DocumentData>) => {
            setMessages(snap.docs.map((doc) => {
                const data = doc.data() as Omit<Message, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Message
            }))
        })

        const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap: DocumentSnapshot<DocumentData>) => {
            if (snap.exists()) setStoreSettings(snap.data() as StoreSettings)
        })

        return () => {
            unsubProducts(); unsubCategories(); unsubCustomers(); unsubStaff();
            unsubOrders(); unsubBanners(); unsubRequests();
            unsubMessages(); unsubSettings();
        }
    }, [toDate])

    const updateStoreSettings = async (settings: StoreSettings) => {
        try {
            await setDoc(doc(db, "settings", "global"), settings)
            toast.success("تم تحديث إعدادات المتجر في السحابة")
        } catch {
            toast.error("فشل تحديث الإعدادات")
        }
    }

    const addToCart = (product: Product, unit: string = "حبة", price: number = product.price) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.selectedUnit === unit)
            if (existing) {
                return prev.map(item => (item.id === product.id && item.selectedUnit === unit) ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { ...product, quantity: 1, selectedUnit: unit, selectedPrice: price }]
        })
        toast.success(`تم إضافة ${product.name} (${unit}) للسلة`)
        hapticFeedback('light')
    }

    const removeFromCart = (productId: string, unit: string) => {
        setCart(prev => prev.filter(item => !(item.id === productId && item.selectedUnit === unit)))
        toast.error("تم حذف المنتج من السلة")
        hapticFeedback('medium')
    }

    const updateCartQuantity = (productId: string, unit: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId && item.selectedUnit === unit) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) }
            }
            return item
        }))
        hapticFeedback('light')
    }

    const restoreDraftToCart = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId)
        if (!order) return
        setCart(prev => {
            const newCart = [...prev]
            order.items.forEach(orderItem => {
                const existing = newCart.find(i => i.id === orderItem.id && i.selectedUnit === orderItem.selectedUnit)
                if (existing) existing.quantity += orderItem.quantity
                else newCart.push({ ...orderItem })
            })
            return newCart
        })
        await deleteDoc(doc(db, "orders", orderId))
        toast.success("تم استعادة الطلب للسلة بنجاح")
    }

    const clearCart = (asDraft = false) => {
        if (asDraft) toast.info("تم حفظ الفاتورة كمسودة")
        setCart([])
    }

    const createOrder = async (isDraft = false, additionalInfo?: { name?: string, phone?: string }) => {
        if (cart.length === 0) return

        // Use logged-in user name or the one provided in checkout
        const finalCustomerName = additionalInfo?.name || currentUser?.name || "عميل خارجي"
        const finalCustomerPhone = additionalInfo?.phone || currentUser?.phone || ""
        const finalCustomerLocation = currentUser?.location || ""

        const orderData = {
            customerName: finalCustomerName,
            customerPhone: finalCustomerPhone,
            customerLocation: finalCustomerLocation,
            customerId: currentUser?.id || "guest",
            items: cart,
            total: cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0),
            status: isDraft ? "pending" : "processing",
            createdAt: Timestamp.now(),
            statusHistory: [{ status: isDraft ? "pending" : "processing", timestamp: Timestamp.now() }]
        }
        try {
            await addDoc(collection(db, "orders"), orderData)

            // Update customer lastActive
            const customerId = currentUser?.id || "guest"
            if (customerId !== "guest" && currentUser?.role === "customer") {
                await updateDoc(doc(db, "customers", customerId), {
                    lastActive: Timestamp.now()
                })
            }

            setCart([])
            toast.success(isDraft ? "تم الحفظ كمسودة سحابية" : "تم إرسال الطلب للسحابة بنجاح")
            hapticFeedback('success')
        } catch {
            toast.error("فشل إرسال الطلب")
            hapticFeedback('error')
        }
    }

    const scanProduct = (barcode: string) => {
        const product = products.find(p => p.barcode === barcode)
        if (product) {
            addToCart(product)
            return product
        }
        return null
    }

    const addProduct = async (product: Omit<Product, "id">) => {
        try {
            await addDoc(collection(db, "products"), product)
            toast.success("تم إضافة المنتج للسحابة")
        } catch (e) {
            console.error("Add Product Error:", e)
            toast.error("فشل إضافة المنتج (تأكد من الصلاحيات)")
        }
    }

    const updateProduct = async (id: string, data: Partial<Product>) => {
        try {
            await updateDoc(doc(db, "products", id), data)
            toast.success("تم تحديث المنتج")
        } catch (e) {
            console.error("Update Product Error:", e)
            toast.error("فشل تحديث المنتج")
        }
    }

    const deleteProduct = async (productId: string) => {
        await deleteDoc(doc(db, "products", productId))
        toast.error("تم حذف المنتج من السحابة")
    }

    const addCategory = async (category: Omit<Category, "id">) => {
        try {
            await addDoc(collection(db, "categories"), category)
            toast.success("تم إضافة القسم")
        } catch (e) {
            console.error("Add Category Error:", e)
            toast.error("فشل إضافة القسم (تأكد من الصلاحيات)")
        }
    }

    const updateCategory = async (category: Category) => {
        const { id, ...data } = category
        await updateDoc(doc(db, "categories", id), data)
        toast.success("تم تحديث القسم")
    }

    const deleteCategory = async (categoryId: string) => {
        await deleteDoc(doc(db, "categories", categoryId))
        toast.error("تم حذف القسم")
    }

    const addCustomer = async (customer: Omit<Customer, "id">) => {
        await addDoc(collection(db, "customers"), customer)
        toast.success("تم إضافة العميل للسحابة")
    }

    const updateCustomer = async (customer: Customer) => {
        const { id, ...data } = customer
        await updateDoc(doc(db, "customers", id), data)
        toast.success("تم تحديث بيانات العميل")
    }

    const deleteCustomer = async (customerId: string) => {
        await deleteDoc(doc(db, "customers", customerId))
        toast.error("تم حذف العميل")
    }

    const addCoupon = async (coupon: Omit<Coupon, "id">) => {
        await addDoc(collection(db, "coupons"), coupon)
        toast.success("تم إضافة الكوبون")
    }

    const deleteCoupon = async (couponId: string) => {
        await deleteDoc(doc(db, "coupons", couponId))
        toast.error("تم حذف الكوبون")
    }

    const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
        const order = orders.find(o => o.id === orderId)
        if (!order) return
        await updateDoc(doc(db, "orders", orderId), {
            status,
            statusHistory: [...order.statusHistory, { status, timestamp: Timestamp.now() }]
        })
        toast.info(`تم تحديث الحالة سحابياً: ${status}`)
        hapticFeedback('medium')
    }

    const addBanner = async (banner: Omit<Banner, "id">) => {
        await addDoc(collection(db, "banners"), banner)
        toast.success("تم إضافة الصورة")
    }

    const deleteBanner = async (bannerId: string) => {
        await deleteDoc(doc(db, "banners", bannerId))
        toast.error("تم حذف الصورة")
    }

    const toggleBanner = async (bannerId: string) => {
        const banner = banners.find(b => b.id === bannerId)
        if (banner) await updateDoc(doc(db, "banners", bannerId), { active: !banner.active })
    }

    const addProductRequest = async (request: Omit<ProductRequest, "id" | "status" | "createdAt">) => {
        await addDoc(collection(db, "requests"), {
            ...request,
            status: "pending",
            createdAt: Timestamp.now()
        })
        toast.success("تم إرسال طلبك للسحابة")
    }

    const updateProductRequestStatus = async (requestId: string, status: ProductRequest["status"]) => {
        await updateDoc(doc(db, "requests", requestId), { status })
    }

    const sendMessage = async (text: string, isAdmin: boolean, customerId = "guest", customerName = "عميل") => {
        await addDoc(collection(db, "messages"), {
            senderId: isAdmin ? "admin" : (currentUser?.id || customerId),
            senderName: isAdmin ? "الإدارة" : (currentUser?.name || customerName),
            text,
            isAdmin,
            createdAt: Timestamp.now()
        })
    }

    const broadcastNotification = (text: string) => {
        toast.info(text, { duration: 5000, icon: "🔔" })
    }

    const addStaff = async (member: Omit<StaffMember, "id" | "createdAt">) => {
        await addDoc(collection(db, "staff"), {
            ...member,
            createdAt: Timestamp.now()
        })
        toast.success("تم إضافة الموظف")
    }

    const updateStaff = async (member: StaffMember) => {
        const { id, ...data } = member
        await updateDoc(doc(db, "staff", id), data)
        toast.success("تم تحديث بيانات الموظف")
    }

    const deleteStaff = async (memberId: string) => {
        await deleteDoc(doc(db, "staff", memberId))
        toast.error("تم حذف الموظف")
    }

    const broadcastToCategory = async (category: string, text: string) => {
        toast.info(`بث إلى فئة ${category}: ${text}`, { icon: "📢" })
        hapticFeedback('success')
    }

    const login = async (username: string, password: string, role: "admin" | "customer" | "staff"): Promise<boolean> => {
        if (role === "admin" && username === "admin" && password === "admin") {
            const user: User = { id: "admin", name: "المشرف العام", role: "admin", username: "admin", permissions: ["orders", "products", "customers", "settings", "chat", "sales"] }
            setCurrentUser(user); localStorage.setItem("ysg_user", JSON.stringify(user))
            return true
        }

        if (role === "staff") {
            const member = staff.find(s => s.username === username && s.password === password)
            if (member) {
                const user: User = { id: member.id, name: member.name, role: "staff", username: member.username, permissions: member.permissions }
                setCurrentUser(user); localStorage.setItem("ysg_user", JSON.stringify(user))
                return true
            }
        }

        if (role === "customer") {
            if (username === "b1" && password === "123") {
                const user: User = { id: "b1", name: "عميل b1", role: "customer", username: "b1" }
                setCurrentUser(user); localStorage.setItem("ysg_user", JSON.stringify(user))
                return true
            }
            const customer = customers.find(c => c.username === username && c.password === password)
            if (customer) {
                const user: User = { id: customer.id, name: customer.name, role: "customer", username: customer.username }
                setCurrentUser(user); localStorage.setItem("ysg_user", JSON.stringify(user))
                return true
            }
        }
        toast.error("خطأ في البيانات")
        return false
    }

    const logout = () => {
        setCurrentUser(null); localStorage.removeItem("ysg_user"); setCart([])
        toast.info("تم تسجيل الخروج")
    }

    return (
        <StoreContext.Provider value={{
            products, cart, orders, categories, customers, banners, productRequests,
            addToCart, removeFromCart, clearCart, createOrder, scanProduct,
            addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory,
            addCustomer, updateCustomer, deleteCustomer, updateOrderStatus,
            coupons, addCoupon, deleteCoupon,
            addBanner, deleteBanner, toggleBanner, addProductRequest, updateProductRequestStatus,
            messages, sendMessage, broadcastNotification, currentUser, login, logout,
            updateCartQuantity, restoreDraftToCart, storeSettings, updateStoreSettings,
            staff, addStaff, updateStaff, deleteStaff, broadcastToCategory
        }}>
            {children}
        </StoreContext.Provider>
    )
}

export function useStore() {
    const context = useContext(StoreContext)
    if (!context) throw new Error("useStore must be used within StoreProvider")
    return context
}
