"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { db, auth } from "@/lib/firebase"
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import {
    collection, addDoc, updateDoc, doc, deleteDoc,
    onSnapshot, query, orderBy, Timestamp, setDoc,
    QuerySnapshot, DocumentSnapshot, DocumentData, getDoc, getDocs, where, writeBatch,
    runTransaction, or, limit
} from "firebase/firestore"
import { adminCreateOrUpdateUserAction, adminDeleteUserAction } from "@/app/actions/auth-actions"
import { sanitizeData } from "@/lib/utils/store-helpers"

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
    createdAt?: Date | any
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
    order?: number
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
    email?: string
    createdAt?: Date | any
    allowedCategories?: string[] | "all"
    fcmTokens?: string[]
    isNewCustomer?: boolean
    hasLoggedIn?: boolean
    firstLoginDate?: Date | any
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
    allowedCategories?: string[] | "all"
}

export type Order = {
    id: string
    customerName: string
    customerPhone?: string
    customerLocation?: string
    customerId: string
    items: CartItem[]
    total: number
    status: "draft" | "pending" | "processing" | "shipped" | "delivered" | "canceled"
    createdAt: Date
    statusHistory: { status: string, timestamp: Date }[]
    paymentMethod?: string
    deletedByCustomer?: boolean
}

export type ProductRequest = {
    id: string
    customerName: string
    customerId?: string
    customerPhone?: string
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
    minimumOrderValue?: number
    enableAiSystem?: boolean
    enableCoupons?: boolean
    logoUrl?: string
    groqApiKey?: string
    sounds?: Record<string, boolean> | any
    autoDeleteChats?: boolean
    autoDeleteChatsDuration?: string
    hiddenSections?: string[] | any
    enableProductRequests?: boolean
    whatsappTemplates?: {
        newCustomer?: string;
        [key: string]: any;
    }
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
    markCustomerLoggedIn: (customerId: string) => Promise<void>
    coupons: Coupon[]
    addCoupon: (coupon: Omit<Coupon, "id">) => void
    deleteCoupon: (couponId: string) => void
    updateOrderStatus: (orderId: string, status: Order["status"]) => void
    addBanner: (banner: Omit<Banner, "id">) => void
    deleteBanner: (bannerId: string) => void
    toggleBanner: (bannerId: string) => void
    updateBanner: (bannerId: string, data: Partial<Banner>) => void
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
    globalSelectedProduct: Product | null
    setGlobalSelectedProduct: (product: Product | null) => void
    markAllNotificationsRead?: (userId: string) => void
    markMessagesRead?: (userId?: string, isAdminView?: boolean) => Promise<void>
    sendMessage: (text: string, isAdmin: boolean, customerId?: string, customerName?: string) => void
    broadcastNotification: (text: string) => void
    currentUser: User | null
    login: (username: string, password: string, role: "admin" | "customer" | "staff") => Promise<boolean>
    logout: () => void
    updateCartQuantity: (productId: string, unit: string, delta: number) => void
    restoreDraftToCart: (orderId: string) => void
    deleteOrdersBulk?: (orderIds: string[], softDeleteForCustomer?: boolean) => Promise<void>
    storeSettings: StoreSettings
    updateStoreSettings: (settings: StoreSettings) => void
    loading?: boolean
    playSound?: (type: string) => void
    adminPreferences?: any
    joinRequests?: any[]
    passwordRequests?: any[]
    deleteJoinRequest?: (id: string) => Promise<void>
    resolvePasswordRequest?: (id: string) => Promise<void>
    markNotificationRead?: (id: string) => void
    fetchProducts?: (categoryId?: string, isInitial?: boolean) => Promise<void>
    deleteAllChatsAndNotifications?: (onProgress?: (progress: number, status: string) => void) => Promise<void>
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
    whatsappTemplates: {
        newCustomer: "مرحباً بك {name} في متجرنا! تم تفعيل حسابك كعميل بنجاح. بيانات الدخول الخاصة بك هي:\nاسم المستخدم: {username}\nكلمة المرور: {password}",
        passwordRecovery: "مرحباً بك {name}. تم إعادة تعيين كلمة مرور حسابك بنجاح. بيانات الدخول الجديدة الخاصة بك هي:\nاسم المستخدم: {username}\nكلمة المرور: {password}",
        inviteFriend: "مرحباً بك يا صديقي! أدعوك للتسجيل والإنضمام إلى متجرنا المميز لجميع مستلزمات قطع غيار ومستلزمات السيارات! 🚗✨\n\nخطوات الإنضمام سهلة جداً وبسيطة:\n1. اضغط على رابط طلب الانضمام التالي:\n{url}\n2. اضغط على زر 'تقديم طلب انضمام كعميل جديد'.\n3. املأ بياناتك (الاسم، الجوال، اسم المستخدم المطلوب).\n4. بعد الإرسال، ستقوم الإدارة بمراجعة حسابك وتفعيله فوراً لتستمتع بأفضل الأسعار والعروض الحصرية! 🎁\n\nأرسلها لك صديقك: {name} 🤝"
    },
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
            const isAdmin = window.location.pathname.startsWith('/admin') || 
                            (window.location.pathname === '/login' && window.location.search.includes('role=admin')) ||
                            (window.location.pathname === '/login' && window.location.search.includes('role=staff'));
            const userKey = isAdmin ? "ysg_user_admin" : "ysg_user_customer";
            
            let savedUser = localStorage.getItem(userKey);
            // Fallback to legacy key if partitioned key does not exist
            if (!savedUser) {
                savedUser = localStorage.getItem("ysg_user");
                if (savedUser) {
                    try {
                        const parsed = JSON.parse(savedUser);
                        if (isAdmin && (parsed.role === 'admin' || parsed.role === 'staff')) {
                            localStorage.setItem("ysg_user_admin", savedUser);
                        } else if (!isAdmin && parsed.role === 'customer') {
                            localStorage.setItem("ysg_user_customer", savedUser);
                        }
                    } catch (e) {
                        console.error("Fallback user parse failed", e);
                    }
                }
            }
            try {
                return savedUser ? JSON.parse(savedUser) : null
            } catch (e) {
                localStorage.removeItem(userKey)
                return null
            }
        }
        return null
    })

    const [firebaseAuthReady, setFirebaseAuthReady] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseAuthReady(true)
        })
        return () => unsubscribe()
    }, [])
    const [storeSettings, setStoreSettings] = useState<StoreSettings>({
        minimumOrderValue: 0,
        enableBarcodeScanner: true
    } as StoreSettings)

    const [globalSelectedProduct, setGlobalSelectedProduct] = useState<Product | null>(null)
    const [guestId, setGuestId] = useState<string>("guest")

    useEffect(() => {
        if (typeof window !== "undefined") {
            let storedId = localStorage.getItem("store_guest_id")
            if (!storedId) {
                storedId = "guest_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
                localStorage.setItem("store_guest_id", storedId)
            }
            setGuestId(storedId)
        }
    }, [])

    const [joinRequests, setJoinRequests] = useState<any[]>([])
    const [passwordRequests, setPasswordRequests] = useState<any[]>([])
    const [notifications, setNotifications] = useState<any[]>([])

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
                    discountEndDate: data.discountEndDate ? toDate(data.discountEndDate) : undefined,
                    createdAt: data.createdAt ? toDate(data.createdAt) : undefined
                } as Product
            }))
        })

        const unsubCategories = onSnapshot(collection(db, "categories"), (snap: QuerySnapshot<DocumentData>) => {
            const list = snap.docs.map((doc) => ({ ...doc.data() as Omit<Category, "id">, id: doc.id } as Category))
            list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            setCategories(list)
        })

        const unsubBanners = onSnapshot(collection(db, "banners"), (snap: QuerySnapshot<DocumentData>) => {
            setBanners(snap.docs.map((doc) => ({ ...doc.data() as Omit<Banner, "id">, id: doc.id } as Banner)))
        })

        const unsubNotifications = onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snap: QuerySnapshot<DocumentData>) => {
            setNotifications(snap.docs.map((doc) => {
                const data = doc.data()
                return { ...data, id: doc.id, createdAt: data.createdAt ? toDate(data.createdAt) : undefined }
            }))
        })

        const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap: DocumentSnapshot<DocumentData>) => {
            if (snap.exists()) setStoreSettings(snap.data() as StoreSettings)
        })

        return () => {
            unsubProducts(); unsubCategories();
            unsubBanners();
            unsubSettings(); unsubNotifications();
        }
    }, [toDate])

    useEffect(() => {
        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff'
        const customerId = currentUser?.id || "guest"

        let ordersQuery;
        if (isAdmin) {
            ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(250))
        } else {
            ordersQuery = query(collection(db, "orders"), where("customerId", "in", [customerId, "guest"]))
        }

        const unsubOrders = onSnapshot(ordersQuery, (snap: QuerySnapshot<DocumentData>) => {
            let docs = snap.docs.map((doc) => {
                const data = doc.data() as Omit<Order, "id">
                return {
                    ...data,
                    id: doc.id,
                    createdAt: toDate(data.createdAt),
                    statusHistory: (data.statusHistory || []).map((h: { status: string, timestamp: Timestamp | Date | { seconds: number, nanoseconds: number } }) => ({
                        ...h,
                        timestamp: toDate(h.timestamp)
                    }))
                } as Order
            })

            if (isAdmin) {
                // Admin must NOT see drafts! Only real orders!
                docs = docs.filter(o => o.status !== "draft")
            } else {
                // Customer must NOT see soft-deleted orders!
                docs = docs.filter(o => !o.deletedByCustomer)
            }

            // Client-side sort is safe for small-medium sets and avoids index requirement
            if (!isAdmin) {
                docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            }

            setOrders(docs)
        }, (error) => {
            console.error("Firestore unsubOrders Listen Error:", error)
        })

        // Optimized Messages Query (Admin gets last 300, Customer gets own chats only)
        let messagesQuery;
        if (isAdmin) {
            messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(300))
        } else {
            messagesQuery = query(
                collection(db, "messages"),
                or(
                    where("userId", "==", customerId),
                    where("senderId", "==", customerId)
                )
            )
        }

        const unsubMessages = onSnapshot(messagesQuery, (snap: QuerySnapshot<DocumentData>) => {
            let docs = snap.docs.map((doc) => {
                const data = doc.data() as Omit<Message, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Message
            })

            // Auto-migrate legacy messages to contain userId for proper routing & customer views
            if (isAdmin) {
                snap.docs.forEach(async (d) => {
                    const data = d.data()
                    if (data.isAdmin && !data.userId) {
                        const match = data.text?.match(/\(@([a-zA-Z0-9_-]+)\)/)
                        if (match && match[1]) {
                            try {
                                await updateDoc(doc(db, "messages", d.id), {
                                    userId: match[1]
                                })
                            } catch (err) {
                                console.error("Message migration error:", err)
                            }
                        }
                    }
                })
            }

            // Sort ascending in memory to display messages chronologically in chat interface
            docs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            setMessages(docs)
        }, (error) => {
            console.error("Firestore unsubMessages Listen Error:", error)
        })

        return () => {
            unsubOrders()
            unsubMessages()
        }
    }, [currentUser, toDate, customers])

    useEffect(() => {
        if (!firebaseAuthReady || !currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'staff')) {
            setStaff([])
            setCustomers([])
            setProductRequests([])
            setJoinRequests([])
            setPasswordRequests([])
            return
        }

        const unsubStaff = onSnapshot(
            collection(db, "staff"),
            (snap: QuerySnapshot<DocumentData>) => {
                setStaff(snap.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt ? toDate(data.createdAt) : undefined
                    } as StaffMember
                }))
            },
            (err) => console.error("Error syncing staff:", err)
        )

        const unsubCustomers = onSnapshot(
            collection(db, "customers"),
            (snap: QuerySnapshot<DocumentData>) => {
                setCustomers(snap.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        ...data,
                        id: doc.id,
                        lastActive: data.lastActive ? toDate(data.lastActive) : undefined,
                        firstLoginDate: data.firstLoginDate ? toDate(data.firstLoginDate) : undefined
                    } as Customer
                }))
            },
            (err) => console.error("Error syncing customers:", err)
        )

        const unsubRequests = onSnapshot(
            query(collection(db, "requests"), orderBy("createdAt", "desc")),
            (snap: QuerySnapshot<DocumentData>) => {
                setProductRequests(snap.docs.map((doc) => {
                    const data = doc.data() as Omit<ProductRequest, "id">
                    return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as ProductRequest
                }))
            },
            (err) => console.error("Error syncing requests:", err)
        )

        const unsubJoin = onSnapshot(
            query(collection(db, "joinRequests"), orderBy("createdAt", "desc")),
            (snap) => {
                setJoinRequests(snap.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    createdAt: toDate(doc.data().createdAt)
                })))
            },
            (err) => console.error("Error syncing join requests:", err)
        )

        const unsubPassword = onSnapshot(
            query(collection(db, "password_requests"), orderBy("createdAt", "desc")),
            (snap) => {
                setPasswordRequests(snap.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    createdAt: toDate(doc.data().createdAt)
                })))
            },
            (err) => console.error("Error syncing password requests:", err)
        )

        return () => {
            unsubStaff()
            unsubCustomers()
            unsubRequests()
            unsubJoin()
            unsubPassword()
        }
    }, [currentUser, firebaseAuthReady, toDate])

    const deleteJoinRequest = async (id: string) => {
        try {
            await deleteDoc(doc(db, "joinRequests", id))
            toast.success("تم حذف طلب الانضمام بنجاح")
        } catch {
            toast.error("فشل حذف طلب الانضمام")
        }
    }

    const resolvePasswordRequest = async (id: string) => {
        try {
            await deleteDoc(doc(db, "password_requests", id))
            toast.success("تم إغلاق طلب استعادة كلمة المرور")
        } catch {
            toast.error("فشل إغلاق طلب استعادة كلمة المرور")
        }
    }

    const playSound = (type: string) => {
        import("@/lib/utils/store-helpers").then(({ playSound: playSoundHelper }) => {
            playSoundHelper(type as any, storeSettings?.sounds)
        }).catch(err => console.error("Error playing sound:", err))
    }

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

        try {
            let orderId: string
            try {
                const counterRef = doc(db, "counters", "orders")
                orderId = await runTransaction(db, async (transaction) => {
                    const counterSnap = await transaction.get(counterRef)
                    const newCounterValue = (counterSnap.exists() ? (counterSnap.data().current || 0) : 0) + 1
                    transaction.set(counterRef, { current: newCounterValue }, { merge: true })
                    return newCounterValue.toString()
                })
            } catch (counterError) {
                console.warn("Counter transaction failed, falling back to timestamp ID:", counterError)
                orderId = Date.now().toString().slice(-8) // Fallback to last 8 digits of timestamp
            }

            const orderData = {
                id: orderId,
                customerName: finalCustomerName,
                customerPhone: finalCustomerPhone,
                customerLocation: finalCustomerLocation,
                customerId: currentUser?.id || "guest",
                items: cart,
                total: cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0),
                status: isDraft ? "draft" : "pending",
                createdAt: Timestamp.now(),
                statusHistory: [{ status: isDraft ? "draft" : "pending", timestamp: Timestamp.now() }]
            }

            await setDoc(doc(db, "orders", orderId), sanitizeData(orderData))

            // Update customer lastActive (wrapped in safe try-catch so it never blocks checkout)
            const customerId = currentUser?.id || "guest"
            if (customerId !== "guest" && currentUser?.role === "customer") {
                try {
                    await updateDoc(doc(db, "customers", customerId), {
                        lastActive: Timestamp.now()
                    })
                } catch (customerUpdateErr) {
                    console.warn("Non-blocking error: Failed to update customer lastActive:", customerUpdateErr)
                }
            }

            setCart([])
            toast.success(isDraft ? "تم الحفظ كمسودة سحابية" : "تم إرسال الطلب للسحابة بنجاح")
            hapticFeedback('success')
        } catch (error: any) {
            console.error("Order creation failed:", error)
            toast.error("فشل إرسال الطلب: " + (error?.message || error || ""))
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
            await addDoc(collection(db, "products"), {
                ...product,
                createdAt: Timestamp.now()
            })
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
        try {
            if (!customer.username) throw new Error("اسم المستخدم مطلوب");
            const normalizedUsername = normalizeArabic(customer.username);
            const generatedEmail = `${normalizedUsername}@ysg.local`;

            // 1. Create or update user in Firebase Auth
            const result = await adminCreateOrUpdateUserAction(generatedEmail, customer.password || "Ysg@2025", customer.name, currentUser?.id);
            if (!result.success || !result.uid) {
                throw new Error(result.error || "فشل إنشاء حساب العميل في خادم المصادقة");
            }
            const uid = result.uid;

            // 2. Set Firestore documents under the created Auth UID
            await setDoc(doc(db, "users", uid), {
                id: uid,
                name: customer.name,
                role: "customer",
                email: generatedEmail,
                username: normalizedUsername,
                phone: customer.phone,
            });
            await setDoc(doc(db, "usernames", normalizedUsername), { email: generatedEmail, uid });
            await setDoc(doc(db, "customers", uid), {
                ...customer,
                id: uid,
                email: generatedEmail,
                username: normalizedUsername,
                createdAt: Timestamp.now(),
                isNewCustomer: true,
                hasLoggedIn: false
            });

            toast.success("تم إضافة وتفعيل العميل بنجاح ✅");
        } catch (error: any) {
            console.error("Failed to add customer:", error);
            toast.error("فشل إضافة العميل: " + error.message);
            throw error;
        }
    }

    const updateCustomer = async (customer: Customer) => {
        try {
            const { id, password, ...data } = customer;

            if (password) {
                const normalizedUsername = customer.username ? normalizeArabic(customer.username) : "";
                const generatedEmail = `${normalizedUsername}@ysg.local`;
                const result = await adminCreateOrUpdateUserAction(generatedEmail, password, customer.name, currentUser?.id);
                if (!result.success) {
                    throw new Error(result.error || "فشل تحديث كلمة المرور في الخادم");
                }
            }

            const normalizedUsername = customer.username ? normalizeArabic(customer.username) : "";
            await updateDoc(doc(db, "customers", id), {
                ...data,
                username: normalizedUsername,
                updatedAt: Timestamp.now()
            });
            await setDoc(doc(db, "users", id), {
                id,
                name: customer.name,
                role: "customer",
                email: `${normalizedUsername}@ysg.local`,
                username: normalizedUsername,
                phone: customer.phone,
            }, { merge: true });

            toast.success("تم تحديث بيانات العميل بنجاح");
        } catch (error: any) {
            console.error("Failed to update customer:", error);
            toast.error("فشل تحديث بيانات العميل: " + error.message);
        }
    }

    const deleteCustomer = async (customerId: string) => {
        try {
            // Find customer details to remove username
            const customerDoc = await getDoc(doc(db, "customers", customerId));
            const cData = customerDoc.data();

            // Securely delete from Firebase Auth
            const result = await adminDeleteUserAction(customerId, currentUser?.id);
            if (!result.success) {
                console.warn("Auth user deletion warning (continuing):", result.error);
            }

            await deleteDoc(doc(db, "customers", customerId));
            await deleteDoc(doc(db, "users", customerId));
            if (cData?.username) {
                await deleteDoc(doc(db, "usernames", cData.username.toLowerCase().trim()));
            }

            toast.error("تم حذف العميل بالكامل");
        } catch (error: any) {
            console.error("Failed to delete customer:", error);
            toast.error("فشل حذف العميل: " + error.message);
        }
    }

    const markCustomerLoggedIn = async (customerId: string) => {
        try {
            await updateDoc(doc(db, "customers", customerId), {
                isNewCustomer: false,
                hasLoggedIn: true,
                firstLoginDate: Timestamp.now(),
                lastActive: Timestamp.now()
            });
        } catch (e) {
            console.error("Failed to mark customer as logged in:", e);
        }
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
            statusHistory: [...(order.statusHistory || []), { status, timestamp: Timestamp.now() }]
        })
        toast.info(`تم تحديث الحالة سحابياً: ${status}`)
        hapticFeedback('medium')

        // Trigger customer in-app and push notification
        try {
            const statusLabels: Record<string, string> = {
                pending: "لم تجهز بعد وهي قيد المراجعة",
                processing: "قيد التجهيز والتحضير حالياً 📦",
                shipped: "تم الشحن وهي في الطريق إليك 🚚",
                delivered: "تم التسليم بنجاح، شكراً لتعاملك معنا! ✅",
                canceled: "تم إلغاؤها من قبل الإدارة ❌"
            }
            const statusLabel = statusLabels[status] || status
            const title = `تحديث حالة الفاتورة #${orderId}`
            const body = `تغيرت حالة فاتورتك رقم #${orderId} لتصبح: ${statusLabel}`

            // Write to notifications collection
            await addDoc(collection(db, "notifications"), {
                userId: order.customerId,
                title,
                body,
                link: "/customer/invoices",
                read: false,
                targetLabel: order.customerName,
                createdAt: Timestamp.now()
            })

            // Trigger Push Notification via FCM
            const { sendPushToUsers } = await import("@/app/actions/notifications")
            await sendPushToUsers([order.customerId], title, body, "/customer/invoices")
        } catch (notifErr) {
            console.error("Failed to send status update notification:", notifErr)
        }
    }

    const deleteOrdersBulk = async (orderIds: string[], softDeleteForCustomer = false) => {
        try {
            if (softDeleteForCustomer) {
                // Customer bulk soft delete: mark as deletedByCustomer: true
                await Promise.all(orderIds.map(id => 
                    updateDoc(doc(db, "orders", id), { deletedByCustomer: true })
                ))
                toast.success("تم حذف الفواتير المحددة بنجاح")
            } else {
                // Admin bulk permanent delete: deleteDoc
                // But check if any order is pending/processing, and notify the customer!
                await Promise.all(orderIds.map(async (id) => {
                    const order = orders.find(o => o.id === id)
                    if (order) {
                        // Send notification if canceled while pending/processing
                        if (order.status === "pending" || order.status === "processing") {
                            try {
                                const title = `إلغاء الفاتورة #${id}`
                                const body = `تم إلغاء فاتورتك رقم #${id}، يرجى إعادة الطلب مرة أخرى ❌`
                                await addDoc(collection(db, "notifications"), {
                                    userId: order.customerId,
                                    title,
                                    body,
                                    link: "/customer/invoices",
                                    read: false,
                                    targetLabel: order.customerName,
                                    createdAt: Timestamp.now()
                                })
                                const { sendPushToUsers } = await import("@/app/actions/notifications")
                                await sendPushToUsers([order.customerId], title, body, "/customer/invoices")
                            } catch (notifErr) {
                                console.error("Failed to send order cancellation notification:", notifErr)
                            }
                        }
                    }
                    await deleteDoc(doc(db, "orders", id))
                }))
                toast.success("تم إلغاء وحذف الطلبات المحددة بنجاح ✅")
            }
            hapticFeedback('medium')
        } catch (error) {
            console.error("Bulk delete failed:", error)
            toast.error("فشل حذف الفواتير")
        }
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

    const updateBanner = async (bannerId: string, data: Partial<Banner>) => {
        await updateDoc(doc(db, "banners", bannerId), data)
        toast.success("تم تحديث البانر بنجاح! 🎨")
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
        const finalCustomerId = isAdmin ? customerId : (currentUser?.id || customerId)
        await addDoc(collection(db, "messages"), {
            senderId: isAdmin ? "admin" : finalCustomerId,
            senderName: isAdmin ? "الإدارة" : (currentUser?.name || customerName),
            text,
            isAdmin,
            userId: finalCustomerId,
            createdAt: Timestamp.now()
        })
    }

    const broadcastNotification = (text: string) => {
        toast.info(text, { duration: 5000, icon: "🔔" })
    }

    const addStaff = async (member: Omit<StaffMember, "id" | "createdAt"> & { password?: string }) => {
        try {
            if (!member.phone) throw new Error("رقم الهاتف مطلوب")
            const normalizedUsername = member.username?.toLowerCase().trim() || member.name.replace(/\s/g, '').toLowerCase()
            const generatedEmail = `${normalizedUsername}@staff.ysg.local`

            const result = await adminCreateOrUpdateUserAction(generatedEmail, member.password || "Ysg@2025", member.name, currentUser?.id);
            if (!result.success || !result.uid) {
                throw new Error(result.error || "فشل إنشاء حساب المشرف في خادم المصادقة");
            }
            const uid = result.uid;

            await setDoc(doc(db, "users", uid), {
                id: uid, name: member.name, role: member.role, email: generatedEmail, username: normalizedUsername, phone: member.phone,
                permissions: member.role === "admin" ? ["all"] : member.permissions
            })
            await setDoc(doc(db, "usernames", normalizedUsername), { email: generatedEmail, uid })
            await setDoc(doc(db, "staff", uid), sanitizeData({ ...member, id: uid, email: generatedEmail, createdAt: Timestamp.now() }))

            toast.success("تم إضافة الموظف بنجاح ✅")
        } catch (error: any) {
            toast.error("فشل إضافة الموظف: " + error.message)
        }
    }

    const updateStaff = async (member: StaffMember & { password?: string }) => {
        try {
            const { id, password, ...data } = member

            // Update Auth if password changed
            if (password) {
                const result = await adminCreateOrUpdateUserAction(member.email || `${member.username}@staff.ysg.local`, password, member.name, currentUser?.id);
                if (!result.success) {
                    console.error("Admin Auth update warning:", result.error);
                    throw new Error(result.error || "فشل تحديث كلمة المرور في الخادم");
                }
            }

            await updateDoc(doc(db, "staff", id), sanitizeData(data))
            await setDoc(doc(db, "users", id), {
                id, name: member.name, role: member.role, email: member.email, phone: member.phone,
                permissions: member.role === "admin" ? ["all"] : member.permissions
            }, { merge: true })
            toast.success("تم تحديث بيانات الموظف")
        } catch (e: any) {
            toast.error("فشل تحديث البيانات: " + e.message)
        }
    }

    const deleteStaff = async (memberId: string) => {
        try {
            const member = staff.find(s => s.id === memberId)

            // Delete from Auth securely via Admin SDK Server Action
            const result = await adminDeleteUserAction(memberId, currentUser?.id);
            if (!result.success) {
                console.error("Admin Auth delete warning:", result.error);
            }

            await deleteDoc(doc(db, "staff", memberId))
            await deleteDoc(doc(db, "users", memberId))
            if (member?.username) await deleteDoc(doc(db, "usernames", member.username.toLowerCase()))
            toast.error("تم حذف الموظف بالكامل")
        } catch (e: any) {
            toast.error("فشل حذف الموظف: " + e.message)
        }
    }

    const resetPassword = async (email: string) => {
        try {
            const { sendPasswordResetEmail } = await import("firebase/auth")
            await sendPasswordResetEmail(auth, email)
            toast.success("تم إرسال رابط إعادة تعيين كلمة المرور للبريد الإلكتروني")
        } catch (error: any) {
            console.error("Password reset error:", error)
            toast.error("فشل إرسال الرابط: " + error.message)
        }
    }

    const addExistingUserAsStaff = async (userId: string) => {
        if (!currentUser) {
            toast.error("غير مصرح: يجب تسجيل الدخول أولاً")
            return
        }

        // Security check: only allow if staff list is empty, or the current user is already an admin
        const isStaffEmpty = staff.length === 0
        const isAuthorized = isStaffEmpty || currentUser.role === "admin"

        if (!isAuthorized) {
            toast.error("غير مصرح: ليس لديك صلاحيات لتنفيذ هذا الإجراء")
            return
        }

        try {
            const staffRef = doc(db, "staff", userId)
            const staffDoc = await getDoc(staffRef)
            if (staffDoc.exists()) {
                toast.info("هذا الحساب موجود بالفعل في قائمة المشرفين")
                return
            }

            const staffData = {
                id: userId,
                name: currentUser.name,
                username: currentUser.username || "admin",
                phone: currentUser.phone || "",
                email: currentUser.email || `${currentUser.username || "admin"}@ysg.local`,
                role: "admin" as const,
                permissions: ["all"],
                createdAt: Timestamp.now()
            }

            await setDoc(staffRef, staffData, { merge: true })
            
            // Also update the users collection to set their role to admin
            const userRef = doc(db, "users", userId)
            const userDoc = await getDoc(userRef)
            if (userDoc.exists()) {
                await setDoc(userRef, { role: "admin", permissions: ["all"], updatedAt: Timestamp.now() }, { merge: true })
            }

            toast.success("تم إضافة حسابك الحالي كمسؤول بنجاح! 🚀")
        } catch (error: any) {
            console.error("Failed to add existing user as staff:", error)
            toast.error("فشل إضافة الحساب كمسؤول: " + error.message)
            throw error
        }
    }

    const broadcastToCategory = async (category: string, text: string) => {
        try {
            const getCategory = (lastActive?: any) => {
                if (!lastActive) return "Disconnected"
                const dateObj = lastActive.toDate ? lastActive.toDate() : new Date(lastActive)
                const days = Math.floor((new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
                if (days <= 7) return "Active"
                if (days <= 14) return "Average"
                if (days <= 30) return "Weak"
                return "Disconnected"
            }

            const targetCustomers = category === "all" ? customers : customers.filter(c => getCategory(c.lastActive) === category)

            if (targetCustomers.length === 0) {
                toast.warning("لا يوجد عملاء في هذه الفئة حالياً")
                return
            }

            // Create Firestore system messages for each customer
            const promises = targetCustomers.map(async (customer) => {
                await addDoc(collection(db, "messages"), {
                    senderId: "admin",
                    senderName: "الإدارة",
                    text,
                    isAdmin: true,
                    read: false,
                    userId: customer.id,
                    isSystemNotification: true,
                    createdAt: Timestamp.now()
                })
            })

            await Promise.all(promises)

            // Send dynamic push notification
            const { sendPushToUsers } = await import("@/app/actions/notifications")
            const customerIds = targetCustomers.map(c => c.id)
            await sendPushToUsers(customerIds, "إشعار من الإدارة", text)

            toast.success(`تم بث الرسالة بنجاح إلى ${targetCustomers.length} عميل في فئة ${
                category === "all" ? "الكل" :
                category === "Active" ? "نشط" :
                category === "Average" ? "متوسط" :
                category === "Weak" ? "ضعيف" : "منقطع"
            }`)
            hapticFeedback('success')
        } catch (error) {
            console.error("Error in broadcastToCategory:", error)
            toast.error("حدث خطأ أثناء بث الرسالة للفئة")
        }
    }

const normalizeArabic = (str: string | null | undefined): string => {
    if (!str) return ""
    return str
        .trim()
        .toLowerCase()
        .replace(/[\s\.\-_]/g, "") // Remove spaces, dots, dashes, underscores
        .replace(/[أإآ]/g, "ا")    // Normalize Alef
        .replace(/ة/g, "ه")        // Normalize Teh Marbuta
        .replace(/ى/g, "ي")        // Normalize Yeh
}

    const login = async (username: string, password: string, role: "admin" | "customer" | "staff"): Promise<boolean> => {
        const cleanUsername = username.trim()
        const cleanPassword = password.trim()
        const normalizedInput = normalizeArabic(cleanUsername)

        // If it's a customer, check if they have a pending join request in Firestore
        if (role === "customer") {
            try {
                // Match phone number written in join request
                const joinReqSnap = await getDocs(query(collection(db, "joinRequests"), where("phone", "==", cleanUsername)))
                if (!joinReqSnap.empty) {
                    toast.info("طلب الانضمام الخاص بك قيد المراجعة حالياً من قبل الإدارة. سيتم تفعيل حسابك قريباً وتصلك رسالة ترحيبية!", { duration: 6000 })
                    return false
                }
            } catch (err) {
                console.error("Failed to check pending join requests:", err)
            }
        }

        // 1. Hardcoded Emergency Admin
        if (role === "admin" && normalizedInput === "admin" && cleanPassword === "admin") {
            const user: User = { id: "admin", name: "المشرف العام", role: "admin", username: "admin", permissions: ["orders", "products", "customers", "settings", "chat", "sales"] }
            setCurrentUser(user)
            localStorage.setItem("ysg_user_admin", JSON.stringify(user))
            
            // Set cookies for middleware
            document.cookie = `firebase-auth-token-admin=emergency-admin-token; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
            document.cookie = `user-role-admin=admin; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
            return true
        }

        try {
            // 2. Resolve final email
            let finalEmail = cleanUsername
            if (normalizedInput.includes("@")) {
                finalEmail = normalizedInput
            } else if (role === "customer") {
                finalEmail = `${normalizedInput}@ysg.local`
            } else {
                // Admin or Staff
                const usernameDoc = await getDoc(doc(db, "usernames", normalizedInput))
                if (usernameDoc.exists()) {
                    finalEmail = usernameDoc.data().email
                } else {
                    finalEmail = `${normalizedInput}@ysg.local`
                }
            }

            // 3. Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, finalEmail, cleanPassword)
            const uid = userCredential.user.uid

            // 4. Retrieve details and set role
            let user: User | null = null

            if (role === "customer") {
                const customerDoc = await getDoc(doc(db, "customers", uid))
                if (customerDoc.exists()) {
                    const cData = customerDoc.data()
                    user = {
                        id: uid,
                        name: cData.name || "عميل",
                        role: "customer",
                        username: cData.username || normalizedInput,
                        phone: cData.phone || "",
                        location: cData.location || "",
                        email: cData.email || "",
                        allowedCategories: cData.allowedCategories || "all"
                    }
                } else {
                    throw new Error("عذراً، هذا الحساب غير موجود في النظام أو تم حذفه من قبل الإدارة.")
                }
            } else {
                // Admin or Staff
                const staffDoc = await getDoc(doc(db, "staff", uid))
                if (staffDoc.exists()) {
                    const sData = staffDoc.data()
                    user = {
                        id: uid,
                        name: sData.name || "موظف",
                        role: (sData.role as "admin" | "staff") || role,
                        username: sData.username || normalizedInput,
                        permissions: sData.permissions || []
                    }
                } else {
                    throw new Error("عذراً، هذا الحساب غير مسجل في النظام أو تم إلغاء صلاحياته.")
                }
            }

            if (user) {
                setCurrentUser(user)
                const userKey = role === "customer" ? "ysg_user_customer" : "ysg_user_admin"
                localStorage.setItem(userKey, JSON.stringify(user))

                if (role === "customer") {
                    try {
                        const pendingReq = localStorage.getItem("ysg_pending_request")
                        if (pendingReq) {
                            localStorage.removeItem("ysg_pending_request")
                            localStorage.setItem("ysg_accepted_welcome", "true")
                        }
                    } catch (e) {
                        console.error("Failed to update welcome flags in localStorage:", e)
                    }
                }

                // Get auth token and set cookies for middleware
                const token = await userCredential.user.getIdToken()
                const tokenCookieName = role === "customer" ? "firebase-auth-token-customer" : "firebase-auth-token-admin"
                const roleCookieName = role === "customer" ? "user-role-customer" : "user-role-admin"
                
                document.cookie = `${tokenCookieName}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                document.cookie = `${roleCookieName}=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                return true
            }

            return false
        } catch (error: any) {
            console.error("Login authentication failed:", error)
            
            // Try local fallback as secondary mechanism if network issues or offline
            if (role === "customer") {
                if (normalizedInput === "b1" && cleanPassword === "123") {
                    const user: User = { id: "b1", name: "عميل b1", role: "customer", username: "b1" }
                    setCurrentUser(user)
                    localStorage.setItem("ysg_user_customer", JSON.stringify(user))
                    document.cookie = `firebase-auth-token-customer=customer-b1-token; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                    document.cookie = `user-role-customer=customer; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                    return true
                }

                const customer = customers.find(c => normalizeArabic(c.username) === normalizedInput && c.password && c.password.trim() === cleanPassword)
                if (customer) {
                    const user: User = { 
                        id: customer.id, 
                        name: customer.name, 
                        role: "customer", 
                        username: customer.username,
                        phone: customer.phone || "",
                        location: customer.location || "",
                        email: customer.email || "",
                        allowedCategories: customer.allowedCategories || "all"
                    }
                    setCurrentUser(user)
                    localStorage.setItem("ysg_user_customer", JSON.stringify(user))
                    document.cookie = `firebase-auth-token-customer=customer-token-${customer.id}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                    document.cookie = `user-role-customer=customer; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                    return true
                }
            } else {
                const member = staff.find(s => normalizeArabic(s.username) === normalizedInput && s.password && s.password.trim() === cleanPassword)
                if (member) {
                    const user: User = { 
                        id: member.id, 
                        name: member.name, 
                        role: member.role as "admin" | "staff", 
                        username: member.username, 
                        permissions: member.permissions 
                    }
                    setCurrentUser(user)
                    localStorage.setItem("ysg_user_admin", JSON.stringify(user))
                    document.cookie = `firebase-auth-token-admin=staff-token-${member.id}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                    document.cookie = `user-role-admin=${member.role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
                    return true
                }
            }

            toast.error("خطأ في البيانات")
            return false
        }
    }

    const logout = () => {
        const isAdmin = typeof window !== "undefined" && (
            window.location.pathname.startsWith('/admin') || 
            currentUser?.role === 'admin' || 
            currentUser?.role === 'staff'
        );
        
        setCurrentUser(null)
        
        if (isAdmin) {
            localStorage.removeItem("ysg_user_admin")
            localStorage.removeItem("ysg_user") // Clear legacy
            document.cookie = "firebase-auth-token-admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie = "user-role-admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie = "firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        } else {
            localStorage.removeItem("ysg_user_customer")
            localStorage.removeItem("ysg_user") // Clear legacy
            setCart([])
            document.cookie = "firebase-auth-token-customer=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie = "user-role-customer=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie = "firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
        toast.info("تم تسجيل الخروج")
    }

    const fetchProducts = async (categoryId?: string, isInitial?: boolean) => {
        return
    }

    const markNotificationRead = async (id: string) => {
        try {
            await updateDoc(doc(db, "notifications", id), { read: true })
        } catch (e) {
            console.error("Error marking notification read:", e)
        }
    }

    const markAllNotificationsRead = async (userId: string) => {
        try {
            const unread = notifications.filter(n => n.userId === userId && !n.read)
            const batch = writeBatch(db)
            unread.forEach(n => {
                batch.update(doc(db, "notifications", n.id), { read: true })
            })
            await batch.commit()
        } catch (e) {
            console.error("Error marking all notifications read:", e)
        }
    }

    const markMessagesRead = async (userId?: string, isAdminView = false) => {
        if (!userId) return
        try {
            const unread = messages.filter(m => {
                if (m.read) return false
                if (isAdminView) {
                    return (m.senderId === userId || m.userId === userId) && !m.isAdmin
                } else {
                    return m.userId === userId && m.isAdmin
                }
            })
            if (unread.length === 0) return
            const batch = writeBatch(db)
            unread.forEach(m => {
                batch.update(doc(db, "messages", m.id), { read: true })
            })
            await batch.commit()
        } catch (e) {
            console.error("Error marking messages as read:", e)
        }
    }

    const deleteAllChatsAndNotifications = async (onProgress?: (progress: number, status: string) => void) => {
        try {
            onProgress?.(10, "البدء في حذف الرسائل...")
            const msgSnap = await getDocs(collection(db, "messages"))
            let deletedCount = 0
            const total = msgSnap.docs.length
            
            if (total > 0) {
                for (let i = 0; i < msgSnap.docs.length; i++) {
                    await deleteDoc(doc(db, "messages", msgSnap.docs[i].id))
                    deletedCount++
                    onProgress?.(10 + Math.floor((deletedCount / total) * 40), `تم حذف ${deletedCount} رسالة...`)
                }
            } else {
                onProgress?.(50, "لا توجد رسائل لحذفها")
            }

            onProgress?.(50, "البدء في حذف الإشعارات...")
            const notifSnap = await getDocs(collection(db, "notifications"))
            deletedCount = 0
            const notifTotal = notifSnap.docs.length

            if (notifTotal > 0) {
                for (let i = 0; i < notifSnap.docs.length; i++) {
                    await deleteDoc(doc(db, "notifications", notifSnap.docs[i].id))
                    deletedCount++
                    onProgress?.(50 + Math.floor((deletedCount / notifTotal) * 40), `تم حذف ${deletedCount} إشعار...`)
                }
            } else {
                onProgress?.(100, "لا توجد إشعارات لحذفها")
            }

            onProgress?.(100, "اكتمل حذف جميع البيانات بنجاح!")
            toast.success("تم مسح جميع الرسائل والإشعارات بنجاح")
        } catch (e: any) {
            console.error("Failed to delete chats and notifications:", e)
            toast.error("فشل حذف البيانات: " + e.message)
        }
    }

    const visibleProducts = React.useMemo(() => {
        const dbCustomer = customers.find(c => c.id === currentUser?.id)
        const allowedCategories = dbCustomer ? dbCustomer.allowedCategories : (currentUser?.allowedCategories || "all")

        if (currentUser?.role === "customer" && allowedCategories && allowedCategories !== "all") {
            const allowed = allowedCategories as string[]
            return products.filter(p => allowed.includes(p.category))
        }
        return products
    }, [products, currentUser, customers])

    const visibleCategories = React.useMemo(() => {
        const dbCustomer = customers.find(c => c.id === currentUser?.id)
        const allowedCategories = dbCustomer ? dbCustomer.allowedCategories : (currentUser?.allowedCategories || "all")

        if (currentUser?.role === "customer" && allowedCategories && allowedCategories !== "all") {
            const allowed = allowedCategories as string[]
            return categories.filter(c => allowed.includes(c.id) || allowed.includes(c.nameAr) || allowed.includes(c.nameEn))
        }
        return categories
    }, [categories, currentUser, customers])

    return (
        <StoreContext.Provider value={{
            products: visibleProducts, cart, orders, categories: visibleCategories, customers, banners, productRequests,
            addToCart, removeFromCart, clearCart, createOrder, scanProduct,
            addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory,
            addCustomer, updateCustomer, deleteCustomer, updateOrderStatus, markCustomerLoggedIn,
            coupons, addCoupon, deleteCoupon,
            addBanner, deleteBanner, toggleBanner, updateBanner, addProductRequest, updateProductRequestStatus,
            messages, sendMessage, broadcastNotification, currentUser, login, logout,
            updateCartQuantity, restoreDraftToCart, storeSettings, updateStoreSettings,
            staff, addStaff, updateStaff, deleteStaff, broadcastToCategory,
            resetPassword, addExistingUserAsStaff,
            fetchProducts, deleteAllChatsAndNotifications,
            joinRequests, passwordRequests, deleteJoinRequest, resolvePasswordRequest, playSound,
            notifications, markNotificationRead, markAllNotificationsRead, deleteOrdersBulk,
            globalSelectedProduct, setGlobalSelectedProduct, guestId, markMessagesRead
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
