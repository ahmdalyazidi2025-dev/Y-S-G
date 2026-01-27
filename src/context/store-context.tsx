"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import {
    collection, addDoc, onSnapshot, query, orderBy,
    updateDoc, doc, deleteDoc, Timestamp, getDoc, setDoc, runTransaction,
    QuerySnapshot, DocumentSnapshot, DocumentData
} from "firebase/firestore"
import { db, auth, getSecondaryAuth } from "@/lib/firebase"
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail // Added
} from "firebase/auth"
import { useRouter } from "next/navigation"

export type Banner = {
    id: string
    image: string
    active: boolean
    title: string
    description: string
    link?: string
    textColor?: string
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
    description?: string // Added optional description
    discountEndDate?: Date
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
}

export interface Customer {
    id: string
    name: string
    email: string
    username?: string // Added for better tracking
    password?: string // Should not store plain text ideally, but existing logic does
    phone: string
    location: string
    lastActive?: Date | null
    createdAt?: Date | Timestamp | null
    allowedCategories?: string[] | "all"
}

export type StaffMember = {
    id: string
    name: string
    email: string
    role: "staff" | "admin"
    permissions: string[]
    createdAt?: Date | Timestamp | null
}

export type User = {
    id: string
    name: string
    role: "admin" | "customer" | "staff"
    username: string
    email?: string // Added email field
    password?: string
    phone?: string
    location?: string
    permissions?: string[]
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

export type Coupon = {
    id: string
    code: string
    discount: number // Percentage (0-100)
    type: "percentage"
    expiryDate?: Timestamp
    usageLimit?: number
    minOrderValue?: number // New: Minimum order value
    categoryId?: string // New: Specific category ID (if any)
    usedCount: number
    active: boolean
    createdAt: Date
}

export type Notification = {
    id: string
    userId?: string // If null, global
    title: string
    body: string
    read: boolean
    createdAt: Date
    type: "info" | "success" | "warning" | "error"
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
    requireCustomerInfoOnCheckout: boolean
    googleGeminiApiKey?: string // Legacy, deprecate soon
    aiApiKeys?: { key: string, status: "valid" | "invalid" | "unchecked" }[] // Multi-key support
    logoUrl?: string
    geminiCustomPrompt?: string
    geminiReferenceImageUrl?: string
    enableCoupons?: boolean
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
    addCustomer: (customer: Omit<Customer, "id">) => void
    updateCustomer: (id: string, data: Partial<Customer>) => void
    deleteCustomer: (customerId: string) => void
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
    broadcastToCategory: (category: string, text: string) => void
    messages: Message[]
    sendMessage: (text: string, isAdmin: boolean, customerId?: string, customerName?: string) => void
    broadcastNotification: (text: string) => void
    currentUser: User | null
    login: (username: string, password: string, role: "admin" | "customer" | "staff") => Promise<boolean>
    logout: () => void
    updateCartQuantity: (productId: string, unit: string, delta: number) => void
    restoreDraftToCart: (orderId: string) => void
    storeSettings: StoreSettings
    updateStoreSettings: (settings: StoreSettings) => void
    coupons: Coupon[]
    addCoupon: (coupon: Omit<Coupon, "id" | "createdAt" | "usedCount">) => void
    deleteCoupon: (id: string) => void
    notifications: Notification[]
    sendNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void
    markNotificationRead: (id: string) => void
    sendNotificationToGroup: (segment: "vip" | "active" | "semi_active" | "interactive" | "dormant" | "all", title: string, body: string) => void
    sendGlobalMessage: (text: string) => void
    updateAdminCredentials: (username: string, password: string) => Promise<void>
    authInitialized: boolean
    resetPassword: (email: string) => Promise<boolean>
    loading: boolean // Added
    guestId: string
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const MOCK_SETTINGS: StoreSettings = {
    shippingTitle: "الشحن مجاناً",
    shippingDesc: "لكل الطلبات التي تفوق 500 ريال",
    paymentTitle: "الدفع عند الاستلام",
    paymentDesc: "الدفع عند استلام طلبك",
    enableCoupons: true,
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
    googleGeminiApiKey: "", // Added default empty key
    logoUrl: "", // Optional store logo URL for branding
    geminiCustomPrompt: "",
    geminiReferenceImageUrl: "",
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([])
    const [allCategories, setAllCategories] = useState<Category[]>([]) // Raw categories from DB
    const [categories, setCategories] = useState<Category[]>([]) // Filtered categories for display
    const [customers, setCustomers] = useState<Customer[]>([])
    const [banners, setBanners] = useState<Banner[]>([])
    const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [authInitialized, setAuthInitialized] = useState(false)
    const [guestId, setGuestId] = useState("")
    const router = useRouter()

    useEffect(() => {
        // Generate or retrieve persistent Guest ID
        const storedGuestId = localStorage.getItem("ysg_guest_id")
        if (storedGuestId) {
            setGuestId(storedGuestId)
        } else {
            const newGuestId = `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
            localStorage.setItem("ysg_guest_id", newGuestId)
            setGuestId(newGuestId)
        }
    }, [])

    // Listen to Auth State Changes
    useEffect(() => {
        // Optimistic Load from LocalStorage
        const savedUser = localStorage.getItem("ysg_user")
        if (savedUser && !currentUser) {
            try {
                setCurrentUser(JSON.parse(savedUser))
            } catch (e) {
                console.error("Failed to parse saved user", e)
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // User is signed in, fetch profile from Firestore
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User

                        // --- AUTO ADMIN FIX: Force promotion for these emails ---
                        if (["ahmd.alyazidi2030@gmail.com", "ahmd.alyazidi2025@gmail.com"].includes(firebaseUser.email || "")) {
                            if (userData.role !== "admin" || !userData.permissions?.includes("all")) {
                                const newUserData = { ...userData, role: "admin", permissions: ["all"] }
                                await setDoc(doc(db, "users", firebaseUser.uid), newUserData, { merge: true })
                                setCurrentUser(newUserData as User)
                                localStorage.setItem("ysg_user", JSON.stringify(newUserData))
                                toast.success("تم ترقية حسابك لمدير تلقائياً! 🚀")
                                return // Exit early as we set user
                            }
                        }
                        // --------------------------------------------------------

                        setCurrentUser(userData)
                        localStorage.setItem("ysg_user", JSON.stringify(userData))
                    } else {
                        // Fallback for Admin if not in 'users' collection yet (First run)
                        // Also auto-create admin doc for these emails
                        if (["admin@store.com", "ahmd.alyazidi2030@gmail.com", "ahmd.alyazidi2025@gmail.com"].includes(firebaseUser.email || "")) {
                            const adminUser: User = {
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || "المشرف العام",
                                role: "admin",
                                username: firebaseUser.email || "admin",
                                permissions: ["all"]
                            }
                            setCurrentUser(adminUser)
                            await setDoc(doc(db, "users", firebaseUser.uid), adminUser)
                            localStorage.setItem("ysg_user", JSON.stringify(adminUser))
                        }
                    }
                } else {
                    setCurrentUser(null)
                }
            } catch (error) {
                console.error("Auth State Change Error:", error)
                toast.error(`خطأ في تحميل البيانات: ${(error as Error).message || "خطأ غير معروف"}`)
            } finally {
                setLoading(false)
                setAuthInitialized(true)
            }
        })
        return () => unsubscribe()
    }, [])
    const [storeSettings, setStoreSettings] = useState<StoreSettings>(MOCK_SETTINGS)

    const toDate = useCallback((ts: Timestamp | Date | { seconds: number, nanoseconds: number } | null | undefined): Date => {
        if (!ts) return new Date()
        if (ts instanceof Timestamp) return ts.toDate()
        if (ts instanceof Date) return ts
        if (typeof ts === 'object' && 'seconds' in ts) return new Timestamp(ts.seconds, ts.nanoseconds).toDate()
        return new Date()
    }, [])

    useEffect(() => {
        // We allow fetching data immediately as our security rules allow public read for now.
        // This prevents "0 data" state while auth is hydrating.
        // if (!authInitialized) return

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
            setAllCategories(snap.docs.map((doc) => ({ ...doc.data() as Omit<Category, "id">, id: doc.id } as Category)))
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
            if (snap.exists()) {
                setStoreSettings(snap.data() as StoreSettings)
            } else {
                // Initialize checks if not exists
                setDoc(doc(db, "settings", "global"), MOCK_SETTINGS)
            }
        })

        const unsubCoupons = onSnapshot(query(collection(db, "coupons"), orderBy("createdAt", "desc")), (snap: QuerySnapshot<DocumentData>) => {
            setCoupons(snap.docs.map((doc) => {
                const data = doc.data() as Omit<Coupon, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt), expiryDate: data.expiryDate ? toDate(data.expiryDate) : undefined } as Coupon
            }))
        })

        const unsubNotifications = onSnapshot(query(collection(db, "notifications"), orderBy("createdAt", "desc")), (snap: QuerySnapshot<DocumentData>) => {
            setNotifications(snap.docs.map((doc) => {
                const data = doc.data() as Omit<Notification, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Notification
            }))
        })

        return () => {
            unsubProducts(); unsubCategories(); unsubCustomers(); unsubStaff();
            unsubOrders(); unsubBanners(); unsubRequests();
            unsubMessages(); unsubSettings(); unsubCoupons(); unsubNotifications();
        }
    }, [toDate, authInitialized])

    // Filter categories based on user permissions
    useEffect(() => {
        if (!currentUser || currentUser.role === "admin" || currentUser.role === "staff") {
            setCategories(allCategories)
            return
        }

        // It's a customer
        const customerAllowed = currentUser.allowedCategories

        if (!customerAllowed || customerAllowed === "all") {
            setCategories(allCategories)
        } else {
            // Filter categories
            setCategories(allCategories.filter(cat => customerAllowed.includes(cat.id)))
        }

    }, [currentUser, allCategories])

    const updateStoreSettings = async (settings: StoreSettings) => {
        try {
            await setDoc(doc(db, "settings", "global"), sanitizeData(settings), { merge: true })
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
            await runTransaction(db, async (transaction) => {
                // 1. Get the current order counter
                const counterRef = doc(db, "counters", "orders")
                const counterDoc = await transaction.get(counterRef)

                let newId = 1
                if (counterDoc.exists()) {
                    const current = counterDoc.data().current
                    if (typeof current === 'number') {
                        newId = current + 1
                    }
                }

                // 2. Set the new counter value
                transaction.set(counterRef, { current: newId }, { merge: true })

                // 3. Create the order with the sequential ID
                const orderId = newId.toString()
                const orderRef = doc(db, "orders", orderId)
                transaction.set(orderRef, sanitizeData(orderData))

                // 4. Update customer lastActive if applicable
                const customerId = currentUser?.id || "guest"
                if (customerId !== "guest" && currentUser?.role === "customer") {
                    const customerRef = doc(db, "customers", customerId)
                    transaction.update(customerRef, { lastActive: Timestamp.now() })
                }
            })

            setCart([])
            toast.success(isDraft ? "تم حفظ المسودة برقم تسلسلي" : "تم إرسال الطلب بنجاح")
            hapticFeedback('success')
        } catch (e) {
            console.error("Order Creation Error:", e)
            toast.error("فشل إرسال الطلب (خطأ في الرقم التسلسلي)")
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
            const dataToSave = { ...product }
            if (!dataToSave.barcode) {
                dataToSave.barcode = Math.floor(Math.random() * 1000000000000).toString()
            }
            await addDoc(collection(db, "products"), sanitizeData(dataToSave))
            toast.success("تم إضافة المنتج للسحابة")
        } catch (e) {
            console.error("Add Product Error:", e)
            toast.error(`فشل إضافة المنتج: ${(e as Error).message}`)
        }
    }

    const updateProduct = async (id: string, data: Partial<Product>) => {
        try {
            await updateDoc(doc(db, "products", id), sanitizeData(data))
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
            await addDoc(collection(db, "categories"), sanitizeData(category))
            toast.success("تم إضافة القسم")
        } catch (e) {
            console.error("Add Category Error:", e)
            toast.error(`فشل إضافة القسم: ${(e as Error).message}`)
        }
    }

    const updateCategory = async (category: Category) => {
        const { id, ...data } = category
        await updateDoc(doc(db, "categories", id), sanitizeData(data))
        toast.success("تم تحديث القسم")
    }

    const deleteCategory = async (categoryId: string) => {
        await deleteDoc(doc(db, "categories", categoryId))
        toast.error("تم حذف القسم")
    }

    const addCustomer = async (data: Omit<Customer, "id" | "createdAt"> & { password?: string, username?: string, email?: string }) => {
        try {
            // 1. Determine Email & Username
            // If email is provided (Recovery Email), use it. Otherwise generate fake one.
            const username = data.username || data.name.replace(/\s/g, '').toLowerCase();
            const email = data.email && data.email.includes('@') ? data.email : `${username}@ysg.local`;
            const password = data.password || "123456"; // Default if not provided

            // 2. Create Auth User
            const secondaryAuth = getSecondaryAuth();
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const uid = userCredential.user.uid;

            // 3. Create Username Mapping (Username -> Real Email)
            // Always map the username so they can login with it
            await setDoc(doc(db, "usernames", username.toLowerCase()), {
                email: email,
                uid: uid
            });

            // 4. Create User Profile (for auth/permissions check)
            await setDoc(doc(db, "users", uid), {
                id: uid,
                name: data.name,
                role: "customer",
                email: email,
                username: username,
                permissions: [] // Customers don't have admin panel permissions
            });

            // 5. Create Customer Document
            await setDoc(doc(db, "customers", uid), sanitizeData({
                ...data,
                id: uid,
                email: email, // Store the actual used email
                username: username,
                createdAt: Timestamp.now()
            }))

            await firebaseSignOut(secondaryAuth);
            toast.success("تم إضافة العميل بنجاح")
        } catch (error: any) {
            console.error("Add Customer Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل")
            } else {
                toast.error("فشل إضافة العميل: " + error.message)
            }
        }
    }

    const updateCustomer = async (id: string, data: Partial<Customer>) => {
        await updateDoc(doc(db, "customers", id), sanitizeData(data))

        // If email changed, we should ideally update Auth email too, but that's complex (requires admin SDK or re-auth).
        // For now, we update the DB records. If username changed, we update mapping.
        if (data.username && data.email) {
            await setDoc(doc(db, "usernames", data.username.toLowerCase()), {
                email: data.email,
                uid: id
            }, { merge: true });
        }

        toast.success("تم تحديث بيانات العميل")
    }

    const deleteCustomer = async (customerId: string) => {
        await deleteDoc(doc(db, "customers", customerId))
        toast.error("تم حذف العميل")
    }

    const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
        const order = orders.find(o => o.id === orderId)
        if (!order) return
        await updateDoc(doc(db, "orders", orderId), sanitizeData({
            status,
            statusHistory: [...order.statusHistory, { status, timestamp: Timestamp.now() }]
        }))
        toast.info(`تم تحديث الحالة سحابياً: ${status}`)
        hapticFeedback('medium')
    }

    const addBanner = async (banner: Omit<Banner, "id">) => {
        try {
            if (!banner.image || banner.image.length < 100) {
                throw new Error("بيانات الصورة غير صالحة")
            }
            await addDoc(collection(db, "banners"), sanitizeData(banner))
            toast.success("تم إضافة الصورة")
        } catch (error) {
            console.error("Add Banner Error:", error)
            toast.error("فشل إضافة الصورة (قد تكون كبيرة جداً)")
            throw error
        }
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
        await addDoc(collection(db, "requests"), sanitizeData({
            ...request,
            status: "pending",
            createdAt: Timestamp.now()
        }))
        toast.success("تم إرسال طلبك للسحابة")
    }

    const updateProductRequestStatus = async (requestId: string, status: ProductRequest["status"]) => {
        await updateDoc(doc(db, "requests", requestId), { status })
    }

    const sendMessage = async (text: string, isAdmin: boolean, customerId = "guest", customerName = "عميل") => {
        await addDoc(collection(db, "messages"), sanitizeData({
            senderId: isAdmin ? "admin" : (currentUser?.id || customerId),
            senderName: isAdmin ? "الإدارة" : (currentUser?.name || customerName),
            text,
            isAdmin,
            createdAt: Timestamp.now()
        }))
    }

    const broadcastNotification = (text: string) => {
        toast.info(text, { duration: 5000, icon: "🔔" })
    }

    // Helper: Reset Password
    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email)
            toast.success("تم إرسال رابط استعادة كلمة المرور للبريد الإلكتروني")
            return true
        } catch (error: any) {
            console.error("Reset Password Error:", error)
            toast.error("فشل إرسال الرابط: " + (error as Error).message)
            return false
        }
    }

    const addStaff = async (member: Omit<StaffMember, "id" | "createdAt" | "role"> & { password?: string, role: "admin" | "staff" }) => {
        try {
            // 1. Create Auth User
            const secondaryAuth = getSecondaryAuth();
            // Use the real email provided in member.email
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, member.email, member.password || "123456");
            const uid = userCredential.user.uid;

            // 2. Create User Profile in 'users' collection
            await setDoc(doc(db, "users", uid), {
                id: uid,
                name: member.name,
                role: member.role, // Use the passed role
                email: member.email,
                username: member.name, // Store username for reference if needed, but key is the mapping
                permissions: member.role === "admin"
                    ? ["orders", "products", "customers", "settings", "chat", "sales", "admins"] // Full perms for admin
                    : member.permissions
            });

            // 3. Create Username Mapping (Username -> Real Email)
            // Extract username from existing logic or we should ask for it explicitly?
            // For now, let's assume the UI passes a "username" field in member or we derive it.
            // But member type in arg doesn't have username explicit property in StaffMember type usually?
            // Let's modify the generic arg to include username if possible, or just rely on the UI passing it in `member` object as extra prop.
            // Casting member to any to extract username if it exists
            const username = (member as any).username;
            if (username) {
                const normalizedUsername = username.toLowerCase().trim();
                await setDoc(doc(db, "usernames", normalizedUsername), {
                    email: member.email,
                    uid: uid
                });
            }

            // 4. Create Staff Document
            await setDoc(doc(db, "staff", uid), sanitizeData({
                ...member,
                id: uid,
                password: null,
                createdAt: Timestamp.now()
            }))

            await firebaseSignOut(secondaryAuth);
            toast.success("تم إضافة الموظف وإعداد الدخول")
        } catch (error: any) {
            console.error("Add Staff Error:", error);
            toast.error("فشل إضافة الموظف: " + (error as Error).message)
        }
    }

    const updateStaff = async (member: StaffMember) => {
        const { id, ...data } = member

        // 1. Update Staff Document
        await updateDoc(doc(db, "staff", id), sanitizeData(data))

        // 2. Update User Document (Critical for Permissions/Auth)
        await setDoc(doc(db, "users", id), {
            id,
            name: member.name,
            role: member.role,
            email: member.email, // Keep email synced
            permissions: member.role === "admin"
                ? ["orders", "products", "customers", "settings", "chat", "sales", "admins"]
                : member.permissions
        }, { merge: true })

        toast.success("تم تحديث بيانات الموظف والصلاحيات")
    }

    const deleteStaff = async (memberId: string) => {
        try {
            await deleteDoc(doc(db, "staff", memberId))
            await deleteDoc(doc(db, "users", memberId)) // Revoke login access
            toast.error("تم حذف الموظف وسحب الصلاحيات")
        } catch (e) {
            console.error("Delete Staff Error:", e)
            toast.error("فشل حذف الموظف")
        }
    }

    const broadcastToCategory = async (category: string, text: string) => {
        toast.info(`بث إلى فئة ${category}: ${text}`, { icon: "📢" })
        hapticFeedback('success')
    }

    const addCoupon = async (coupon: Omit<Coupon, "id" | "createdAt" | "usedCount">) => {
        await addDoc(collection(db, "coupons"), sanitizeData({
            ...coupon,
            usedCount: 0,
            createdAt: Timestamp.now()
        }))
        toast.success("تم إنشاء الكوبون")
    }

    const deleteCoupon = async (id: string) => {
        await deleteDoc(doc(db, "coupons", id))
        toast.error("تم حذف الكوبون")
    }

    const sendNotification = async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
        await addDoc(collection(db, "notifications"), sanitizeData({
            ...notification,
            read: false,
            createdAt: Timestamp.now()
        }))
        toast.success("تم إرسال الإشعار")
    }

    const markNotificationRead = async (id: string) => {
        await updateDoc(doc(db, "notifications", id), { read: true })
    }

    const sendNotificationToGroup = async (segment: "vip" | "active" | "semi_active" | "interactive" | "dormant" | "all", title: string, body: string) => {
        let targetCustomers: Customer[] = []

        const getStats = (customerId: string) => {
            const customerOrders = orders.filter(o => o.customerId === customerId)
            const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0)
            const lastOrderDate = customerOrders.length > 0
                ? new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
                : null
            return { totalSpent, lastOrderDate, orderCount: customerOrders.length }
        }

        switch (segment) {
            case "all":
                targetCustomers = customers
                break
            case "vip":
                targetCustomers = customers.filter(c => getStats(c.id).totalSpent > 5000)
                break
            case "active":
                targetCustomers = customers.filter(c => {
                    const lastOrder = getStats(c.id).lastOrderDate
                    if (!lastOrder) return false
                    const days = (new Date().getTime() - lastOrder.getTime()) / (1000 * 3600 * 24)
                    return days <= 30
                })
                break
            case "semi_active":
                targetCustomers = customers.filter(c => {
                    const lastOrder = getStats(c.id).lastOrderDate
                    if (!lastOrder) return false
                    const days = (new Date().getTime() - lastOrder.getTime()) / (1000 * 3600 * 24)
                    return days > 30 && days <= 90
                })
                break
            case "interactive":
                targetCustomers = customers.filter(c => {
                    if (!c.lastActive) return false
                    const stats = getStats(c.id)
                    const daysSinceActive = (new Date().getTime() - new Date(c.lastActive).getTime()) / (1000 * 3600 * 24)
                    return daysSinceActive <= 7 && stats.orderCount === 0
                })
                break
            case "dormant":
                targetCustomers = customers.filter(c => {
                    if (!c.lastActive) return true
                    const daysSinceActive = (new Date().getTime() - new Date(c.lastActive).getTime()) / (1000 * 3600 * 24)
                    return daysSinceActive > 90
                })
                break
        }

        if (targetCustomers.length === 0) {
            toast.error("لا يوجد عملاء في هذه الفئة")
            return
        }

        const batchPromises = targetCustomers.map(customer =>
            addDoc(collection(db, "notifications"), sanitizeData({
                userId: customer.id,
                title,
                body,
                type: "info",
                read: false,
                createdAt: Timestamp.now()
            }))
        )

        try {
            await Promise.all(batchPromises)
            toast.success(`تم إرسال الإشعار لـ ${targetCustomers.length} عميل`)
        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ أثناء الإرسال")
        }
    }

    const sendGlobalMessage = async (text: string) => {
        if (customers.length === 0) {
            toast.error("لا يوجد عملاء لإرسال الرسالة لهم")
            return
        }

        const batchPromises = customers.map(customer =>
            addDoc(collection(db, "messages"), sanitizeData({
                senderId: "admin",
                senderName: "الإدارة",
                text: `${text} (@${customer.id})`, // Tagging to ensure visibility in customer view
                isAdmin: true,
                createdAt: Timestamp.now()
            }))
        )

        try {
            await Promise.all(batchPromises)
            toast.success(`تم إرسال الرسالة لـ ${customers.length} عميل`)
        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ أثناء الإرسال")
        }
    }

    const login = async (email: string, password: string, role: "admin" | "customer" | "staff"): Promise<boolean> => {
        try {
            let finalEmail = email.trim()

            // Fix for Customer Login: valid customer emails are username@ysg.local
            // If the user enters just "username", we append the domain.
            if (role === "customer" && !finalEmail.includes("@")) {
                const normalizedUsername = finalEmail.toLowerCase().replace(/\s/g, '')
                finalEmail = `${normalizedUsername}@ysg.local`
            }

            // Fix for Admin/Staff Login using Username
            if ((role === "admin" || role === "staff") && !finalEmail.includes("@")) {
                // Check 'usernames' collection for mapping
                try {
                    const normalizedUsername = finalEmail.toLowerCase().trim()
                    const usernameDoc = await getDoc(doc(db, "usernames", normalizedUsername))

                    if (usernameDoc.exists()) {
                        finalEmail = usernameDoc.data().email
                        console.log(`Resolved username ${normalizedUsername} to email ${finalEmail}`)
                    } else {
                        // Fallback to legacy behavior just in case
                        finalEmail = `${normalizedUsername}@ysg.local`
                    }
                } catch (err) {
                    console.error("Username lookup failed:", err)
                    // Fallback
                    finalEmail = `${finalEmail}@ysg.local`
                }
            }

            console.log(`Attempting login for ${role}: ${finalEmail}`) // Debug log

            await signInWithEmailAndPassword(auth, finalEmail, password)
            // The onAuthStateChanged hook will handle setting the currentUser
            return true
        } catch (error: any) {
            console.error("Login Error:", error)

            // Nice error handling
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                toast.error("بيانات الدخول غير صحيحة")
            } else if (error.code === 'auth/invalid-email') {
                toast.error("صيغة اسم المستخدم غير صحيحة")
            } else {
                toast.error("حدث خطأ غير متوقع في تسجيل الدخول")
            }

            return false
        }
    }

    const updateAdminCredentials = async (username: string, password: string) => {
        try {
            await setDoc(doc(db, "settings", "security"), { username, password }, { merge: true })
            toast.success("تم تحديث بيانات دخول الإدارة بنجاح")
        } catch (e) {
            console.error(e)
            toast.error("فشل تحديث البيانات")
            throw e
        }
    }

    const logout = async () => {
        await firebaseSignOut(auth)
        setCurrentUser(null)
        localStorage.removeItem("ysg_user")
        router.push("/login")
    }

    return (
        <StoreContext.Provider value={{
            products, cart, orders, categories, customers, banners, productRequests,
            addToCart, removeFromCart, clearCart, createOrder, scanProduct,
            addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory,
            addCustomer, updateCustomer, deleteCustomer, updateOrderStatus,
            addBanner, deleteBanner, toggleBanner, addProductRequest, updateProductRequestStatus,
            messages, sendMessage, broadcastNotification, currentUser, login, logout,
            updateCartQuantity, restoreDraftToCart, storeSettings, updateStoreSettings,
            staff, addStaff, updateStaff, deleteStaff, broadcastToCategory,
            coupons, addCoupon, deleteCoupon, notifications, sendNotification, markNotificationRead, sendNotificationToGroup, sendGlobalMessage,
            updateAdminCredentials, authInitialized, resetPassword, loading, guestId,
        }}>
            {children}
        </StoreContext.Provider>
    )
}

// Helper to remove undefined values recursively from objects before sending to Firestore
// Helper to remove undefined values recursively from objects before sending to Firestore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeData(data: any): any {
    if (data === null || data === undefined) return null
    if (data instanceof Date) return data
    if (data instanceof Timestamp) return data // Preserve Firebase Timestamps
    if (Array.isArray(data)) return data.map(item => sanitizeData(item))
    if (typeof data === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = {}
        for (const key in data) {
            const value = data[key]
            if (value !== undefined) {
                result[key] = sanitizeData(value)
            }
            // Skip undefined keys entirely instead of forcing null, 
            // causing less "dirty" data in Firestore
        }
        return result
    }
    return data
}

export function useStore() {
    const context = useContext(StoreContext)
    if (!context) throw new Error("useStore must be used within StoreProvider")
    return context
}
