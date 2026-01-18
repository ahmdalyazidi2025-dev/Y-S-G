"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { db } from "@/lib/firebase"
import {
    collection, addDoc, updateDoc, doc, deleteDoc,
    onSnapshot, query, orderBy, Timestamp, setDoc, getDoc
} from "firebase/firestore"

export type Banner = {
    id: string
    image: string
    active: boolean
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
}

export type CartItem = Product & {
    quantity: number
}

export type Category = {
    id: string
    nameAr: string
    nameEn: string
    image?: string
    icon?: string
}

export type Customer = {
    id: string
    name: string
    phone: string
    password?: string
    username: string
    location?: string
}

export type User = {
    id: string
    name: string
    role: "admin" | "customer"
    username: string
}

export type Order = {
    id: string
    customerName: string
    customerId: string
    items: CartItem[]
    total: number
    status: "pending" | "processing" | "shipped" | "delivered" | "canceled"
    createdAt: Date
    statusHistory: { status: string, timestamp: Date }[]
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
}

type StoreContextType = {
    products: Product[]
    cart: CartItem[]
    orders: Order[]
    categories: Category[]
    customers: Customer[]
    banners: Banner[]
    productRequests: ProductRequest[]
    addToCart: (product: Product) => void
    removeFromCart: (productId: string) => void
    clearCart: (asDraft?: boolean) => void
    createOrder: (isDraft?: boolean) => void
    scanProduct: (barcode: string) => Product | null
    addProduct: (product: Omit<Product, "id">) => void
    updateProduct: (product: Product) => void
    deleteProduct: (productId: string) => void
    addCategory: (category: Omit<Category, "id">) => void
    updateCategory: (category: Category) => void
    deleteCategory: (categoryId: string) => void
    addCustomer: (customer: Omit<Customer, "id">) => void
    updateCustomer: (customer: Customer) => void
    deleteCustomer: (customerId: string) => void
    updateOrderStatus: (orderId: string, status: Order["status"]) => void
    addBanner: (banner: Omit<Banner, "id">) => void
    deleteBanner: (bannerId: string) => void
    toggleBanner: (bannerId: string) => void
    addProductRequest: (request: Omit<ProductRequest, "id" | "status" | "createdAt">) => void
    updateProductRequestStatus: (requestId: string, status: ProductRequest["status"]) => void
    messages: Message[]
    sendMessage: (text: string, isAdmin: boolean, customerId?: string, customerName?: string) => void
    broadcastNotification: (text: string) => void
    currentUser: User | null
    login: (username: string, password: string, role: "admin" | "customer") => Promise<boolean>
    logout: () => void
    updateCartQuantity: (productId: string, delta: number) => void
    restoreDraftToCart: (orderId: string) => void
    storeSettings: StoreSettings
    updateStoreSettings: (settings: StoreSettings) => void
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
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        if (typeof window !== "undefined") {
            const savedUser = localStorage.getItem("ysg_user")
            return savedUser ? JSON.parse(savedUser) : null
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
        const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
            setProducts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)))
        })

        const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
            setCategories(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category)))
        })

        const unsubCustomers = onSnapshot(collection(db, "customers"), (snap) => {
            setCustomers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Customer)))
        })

        const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
            setOrders(snap.docs.map(doc => {
                const data = doc.data()
                return {
                    ...data,
                    id: doc.id,
                    createdAt: toDate(data.createdAt),
                    statusHistory: (data.statusHistory || []).map((h: { status: string, timestamp: Timestamp | Date | { seconds: number, nanoseconds: number } }) => ({ ...h, timestamp: toDate(h.timestamp) }))
                } as Order
            }))
        })

        const unsubBanners = onSnapshot(collection(db, "banners"), (snap) => {
            setBanners(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Banner)))
        })

        const unsubRequests = onSnapshot(query(collection(db, "requests"), orderBy("createdAt", "desc")), (snap) => {
            setProductRequests(snap.docs.map(doc => {
                const data = doc.data()
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as ProductRequest
            }))
        })

        const unsubMessages = onSnapshot(query(collection(db, "messages"), orderBy("createdAt", "asc")), (snap) => {
            setMessages(snap.docs.map(doc => {
                const data = doc.data()
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Message
            }))
        })

        const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
            if (snap.exists()) setStoreSettings(snap.data() as StoreSettings)
        })

        return () => {
            unsubProducts(); unsubCategories(); unsubCustomers();
            unsubOrders(); unsubBanners(); unsubRequests();
            unsubMessages(); unsubSettings();
        }
    }, [toDate])

    const updateStoreSettings = async (settings: StoreSettings) => {
        try {
            await setDoc(doc(db, "settings", "global"), settings)
            toast.success("تم تحديث إعدادات المتجر في السحابة")
        } catch (e) {
            toast.error("فشل تحديث الإعدادات")
        }
    }

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { ...product, quantity: 1 }]
        })
        toast.success(`تم إضافة ${product.name} للسلة`)
        hapticFeedback('light')
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId))
        toast.error("تم حذف المنتج من السلة")
        hapticFeedback('medium')
    }

    const updateCartQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
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
                const existing = newCart.find(i => i.id === orderItem.id)
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

    const createOrder = async (isDraft = false) => {
        if (cart.length === 0) return
        const orderData = {
            customerName: currentUser?.name || "عميل خارجي",
            customerId: currentUser?.id || "guest",
            items: cart,
            total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
            status: isDraft ? "pending" : "processing",
            createdAt: Timestamp.now(),
            statusHistory: [{ status: isDraft ? "pending" : "processing", timestamp: Timestamp.now() }]
        }
        try {
            await addDoc(collection(db, "orders"), orderData)
            setCart([])
            toast.success(isDraft ? "تم الحفظ كمسودة سحابية" : "تم إرسال الطلب للسحابة بنجاح")
            hapticFeedback('success')
        } catch (e) {
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
        await addDoc(collection(db, "products"), product)
        toast.success("تم إضافة المنتج للسحابة")
    }

    const updateProduct = async (product: Product) => {
        const { id, ...data } = product
        await updateDoc(doc(db, "products", id), data)
        toast.success("تم تحديث المنتج")
    }

    const deleteProduct = async (productId: string) => {
        await deleteDoc(doc(db, "products", productId))
        toast.error("تم حذف المنتج من السحابة")
    }

    const addCategory = async (category: Omit<Category, "id">) => {
        await addDoc(collection(db, "categories"), category)
        toast.success("تم إضافة القسم")
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

    const login = async (username: string, password: string, role: "admin" | "customer"): Promise<boolean> => {
        if (role === "admin" && username === "admin" && password === "admin") {
            const user: User = { id: "admin", name: "المشرف العام", role: "admin", username: "admin" }
            setCurrentUser(user); localStorage.setItem("ysg_user", JSON.stringify(user))
            return true
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
            addBanner, deleteBanner, toggleBanner, addProductRequest, updateProductRequestStatus,
            messages, sendMessage, broadcastNotification, currentUser, login, logout,
            updateCartQuantity, restoreDraftToCart, storeSettings, updateStoreSettings
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
