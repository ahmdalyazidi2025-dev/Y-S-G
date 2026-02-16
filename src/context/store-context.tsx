"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import {
    collection, addDoc, onSnapshot, query, orderBy, where,
    updateDoc, doc, deleteDoc, Timestamp, getDoc, setDoc, runTransaction,
    QuerySnapshot, DocumentSnapshot, DocumentData, getDocs, limit, startAfter, startAt, endAt
} from "firebase/firestore"
import { db, auth, getSecondaryAuth } from "@/lib/firebase"
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail, // Added
    signInAnonymously // Added for guest support
} from "firebase/auth"
import { useRouter } from "next/navigation"
import { sendPushNotification, sendPushToUsers } from "@/app/actions/notifications"

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
    isDraft?: boolean // New: Draft status (hidden from store)
    notes?: string // New: Internal admin notes
    costPrice?: number // New: Admin only cost price
    createdAt?: Date // New: For date-based filtering
    isFeatured?: boolean // New: Pin to top
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
    icon?: any
    isHidden?: boolean // New: Visibility toggle
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
    referralCode?: string
    referredBy?: string
    referralCount?: number
}

export type StaffMember = {
    id: string
    name: string
    email: string
    username?: string
    phone: string // Added phone
    role: "staff" | "admin"
    permissions: string[]
    createdAt?: Date | Timestamp | null
}

export type PasswordRequest = {
    id: string
    phone: string
    createdAt: Date | Timestamp
}

export type User = {
    id: string
    name: string
    role: "admin" | "customer" | "staff" | "guest" // Added guest
    username: string
    permissions?: string[]
    email?: string
    password?: string
    phone?: string
    location?: string
    allowedCategories?: string[] | "all"
    referralCode?: string
    referralCount?: number
    isAnonymous?: boolean // Added for guest tracking
    lastActive?: Date // Added
}

export type Order = {
    id: string
    customerName: string
    customerPhone?: string
    customerLocation?: string
    customerId: string
    paymentMethod?: string
    items: CartItem[]
    total: number
    status: "pending" | "processing" | "shipped" | "delivered" | "canceled" | "accepted" | "rejected"
    createdAt: Date
    statusHistory: { status: string, timestamp: Date }[]
}

export type ProductRequest = {
    id: string
    customerName: string
    customerId?: string // Added
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
    startDate?: Timestamp // New: Start Date
    usageLimit?: number
    customerUsageLimit?: number // New: Usage limit per customer
    minOrderValue?: number
    categoryId?: string // New: Specific category ID (if any)
    allowedCustomerTypes?: string[] | "all" // New: Customer Category Restriction
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
    link?: string // Added for deep linking
}

export type Message = {
    id: string
    senderId: string
    senderName: string
    text: string
    createdAt: Date
    isAdmin: boolean
    read: boolean // Added
    userId?: string // To track which user this message belongs to
    actionLink?: string // Optional link
    actionTitle?: string // Optional button text
    image?: string // Added support for images
    isSystemNotification?: boolean // New: To hide from chat history
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
    aiApiKeys?: { key: string, status: "valid" | "invalid" | "unchecked" }[] // Multi-key support
    logoUrl?: string
    geminiCustomPrompt?: string
    geminiReferenceImageUrl?: string
    enableMaintenance: boolean
    enableCoupons?: boolean
    enableAIChat?: boolean // New Toggle
    enableProductRequests?: boolean // New Toggle for Product Requests
    enableBarcodeScanner?: boolean // New Toggle for Barcode Scanner
    sounds?: {
        newOrder?: string;      // Admin: New order alert
        newMessage?: string;    // Direct/Global chat alert
        statusUpdate?: string;  // Customer: Order status change alert
        generalPush?: string;   // Customer: Global/Bulk notification alert
        passwordRequest?: string; // Admin: Password reset request alert
    }
    hiddenSections?: ("products" | "offers" | "categories" | "search")[] // New: Hide specific home sections
}

export type AdminPreferences = {
    lastViewed: {
        orders?: Date | Timestamp
        requests?: Date | Timestamp
        chat?: Date | Timestamp
        joinRequests?: Date | Timestamp
        customers?: Date | Timestamp
    }
}

export type JoinRequest = {
    id: string
    name: string
    phone: string
    createdAt: Date
}

type StoreContextType = {
    products: Product[]
    orders: Order[]
    loadMoreOrders: () => Promise<void>
    hasMoreOrders: boolean
    categories: Category[]
    customers: Customer[]
    banners: Banner[]
    productRequests: ProductRequest[]
    addToCart: (product: Product, unit?: string, price?: number) => void
    removeFromCart: (productId: string, unit: string) => void
    clearCart: (asDraft?: boolean) => void
    createOrder: (isDraft?: boolean, additionalInfo?: { name?: string, phone?: string }) => void
    scanProduct: (barcode: string) => Promise<Product | null>
    fetchProducts: (categoryId?: string, isInitial?: boolean) => Promise<void>
    loadMoreProducts: (categoryId?: string) => Promise<void>
    searchProducts: (queryTerm: string) => Promise<Product[]>
    searchOrders: (term: string) => Promise<Order[]>
    hasMoreProducts: boolean
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
    deleteProductRequest: (requestId: string) => void
    staff: StaffMember[]
    addStaff: (member: Omit<StaffMember, "id" | "createdAt">) => Promise<void>
    updateStaff: (member: StaffMember) => Promise<void>
    deleteStaff: (memberId: string) => void
    broadcastToCategory: (category: string, text: string) => void
    messages: Message[]
    sendMessage: (text: string, isAdmin: boolean, customerId?: string, customerName?: string, actionLink?: string, actionTitle?: string, image?: string, isSystemNotification?: boolean) => void
    broadcastNotification: (text: string) => void
    markNotificationsAsRead: (type: "chat" | "system" | "orders", id?: string) => Promise<void>
    currentUser: User | null
    login: (username: string, password: string, role: "admin" | "customer" | "staff") => Promise<boolean>
    logout: () => void
    updateCartQuantity: (productId: string, unit: string, delta: number) => void
    restoreDraftToCart: (orderId: string) => void
    storeSettings: StoreSettings
    updateStoreSettings: (settings: StoreSettings) => void
    coupons: Coupon[]
    addCoupon: (coupon: Omit<Coupon, "id" | "createdAt" | "usedCount">) => void
    applyCoupon: (code: string) => Promise<Coupon | null> // New Export
    deleteCoupon: (id: string) => void
    notifications: Notification[]
    sendNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void
    markNotificationRead: (id: string) => void
    sendNotificationToGroup: (segment: "vip" | "active" | "semi_active" | "interactive" | "dormant" | "all", title: string, body: string, link?: string) => void
    sendGlobalMessage: (text: string, actionLink?: string, actionTitle?: string) => void
    updateAdminCredentials: (username: string, password: string) => Promise<void>
    authInitialized: boolean
    resetPassword: (email: string) => Promise<boolean>
    cleanupOrphanedUsers: () => Promise<number> // Added
    loading: boolean
    guestId: string
    markAllNotificationsRead: () => void
    markMessagesRead: (customerId?: string) => void
    playSound: (event: 'newOrder' | 'newMessage' | 'statusUpdate' | 'generalPush' | 'passwordRequest') => void
    joinRequests: JoinRequest[]
    addJoinRequest: (name: string, phone: string) => Promise<void>
    deleteJoinRequest: (id: string) => Promise<void>
    passwordRequests: any[] // Defining as any for simplicity, or define strict type
    resolvePasswordRequest: (id: string) => Promise<void>
    requestPasswordReset: (phone: string) => Promise<{ success: boolean; message: string }>
    adminPreferences: AdminPreferences
    markSectionAsViewed: (section: keyof AdminPreferences['lastViewed']) => Promise<void>
    addExistingUserAsStaff: (user: User) => Promise<void>
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
    logoUrl: "", // Optional store logo URL for branding
    geminiCustomPrompt: "",
    geminiReferenceImageUrl: "",
    enableMaintenance: false,
    enableCoupons: true,
    enableAIChat: true,
    enableProductRequests: true,
    enableBarcodeScanner: true,
    sounds: {} // Defaults will be handled in the hook fallbacks
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([])
    const [allCategories, setAllCategories] = useState<Category[]>([]) // Raw categories from DB
    const [categories, setCategories] = useState<Category[]>([]) // Filtered categories for display
    const [customers, setCustomers] = useState<Customer[]>([])
    const [banners, setBanners] = useState<Banner[]>([])
    const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
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
    const [lastProductDoc, setLastProductDoc] = useState<DocumentData | null>(null)
    const [hasMoreProducts, setHasMoreProducts] = useState(true)
    const [lastOrderDoc, setLastOrderDoc] = useState<DocumentData | null>(null)
    const [hasMoreOrders, setHasMoreOrders] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // ... (existing Guest ID logic)
        const storedGuestId = localStorage.getItem("ysg_guest_id")
        if (storedGuestId) {
            setGuestId(storedGuestId)
        } else {
            const newGuestId = `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
            localStorage.setItem("ysg_guest_id", newGuestId)
            setGuestId(newGuestId)
        }

        // Join Requests Listener
        const unsubJoin = onSnapshot(query(collection(db, "joinRequests"), orderBy("createdAt", "desc")), (snap) => {
            setJoinRequests(snap.docs.map(doc => {
                const data = doc.data() as JoinRequest
                return {
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt ? toDate(data.createdAt) : new Date()
                }
            }))
        })
        return () => unsubJoin()
    }, [])

    // Listen to Auth State Changes
    useEffect(() => {
        // Optimistic Load from LocalStorage
        const savedUser = localStorage.getItem("ysg_user")
        if (savedUser && !currentUser) {
            try {
                // If it's a guest session, ensure we don't overwrite with old data if invalid
                // But for now, just load it
                setCurrentUser(JSON.parse(savedUser))
            } catch (e) {
                console.error("Failed to parse saved user", e)
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    if (firebaseUser.isAnonymous) {
                        // It's a Guest
                        const guestUser: User = {
                            id: firebaseUser.uid,
                            name: "زائر",
                            role: "guest",
                            email: "guest@ysg.local", // Placeholder
                            username: `guest_${firebaseUser.uid.substring(0, 5)}`,
                            isAnonymous: true,
                            lastActive: new Date()
                        }
                        setCurrentUser(guestUser)
                        // Ensure guestId matches uid for consistency
                        setGuestId(firebaseUser.uid)
                        localStorage.setItem("ysg_guest_id", firebaseUser.uid)
                    } else {
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
                    }
                } else {
                    // No user -> Sign in Anonymously immediately
                    console.log("No user found, signing in anonymously...")
                    await signInAnonymously(auth).catch(e => console.error("Anon Auth Failed", e));
                    // Don't set currentUser to null here, wait for the auth state change to fire again
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

    // Sound Logic inside Provider (No circular hook dependency)
    const playSound = (event: 'newOrder' | 'newMessage' | 'statusUpdate' | 'generalPush' | 'passwordRequest') => {
        if (typeof window === 'undefined') return
        try {
            const defaultSounds = {
                newOrder: "data:audio/wav;base64,UklGRiQIAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAIAACAgYCBgoKDA4SEhYUGhobHBweIiIiJCQoKCwwMDQ4ODxAQERITExQVFhcXFxgZGRobGxwcHR4eHyAgISIiIyQkJSUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/",
                newMessage: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzM2CfutvKZDY2YZ/K381iNjZhmMbV4GU4N2CSutXVZzg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YIA=",
                statusUpdate: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzM2CfutvKZDY2YZ/K381iNjZhmMbV4GU4N2CSutXVZzg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YIA=",
                generalPush: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzM2CfutvKZDY2YZ/K381iNjZhmMbV4GU4N2CSutXVZzg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YIA=",
                passwordRequest: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEzM2CfutvKZDY2YZ/K381iNjZhmMbV4GU4N2CSutXVZzg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YI+51dRmODhgj7nV1GY4OGCPudXUZjg4YIA="
            }
            const source = (storeSettings as any).sounds?.[event] || defaultSounds[event]
            if (source) {
                const audio = new Audio(source)
                audio.volume = event === 'newOrder' ? 0.8 : 0.5
                audio.play().catch(e => console.error("Sound play failed", e))
            }
        } catch (e) {
            console.error("Sound init failed", e)
        }
    }

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

        // 1. Products (Public - Optimized check, initial load handled by component or fetchProducts)
        // Removed global listener for performance (5000+ products scaling)

        // 2. Categories (Public)
        const unsubCategories = onSnapshot(collection(db, "categories"), (snap: QuerySnapshot<DocumentData>) => {
            setAllCategories(snap.docs.map((doc) => ({ ...doc.data() as Omit<Category, "id">, id: doc.id } as Category)))
        })

        // 3. Customers (Admin/Staff Only)
        // Only subscribe if user is admin/staff to save bandwidth
        let unsubCustomers = () => { }
        if (currentUser?.role === 'admin' || currentUser?.role === 'staff') {
            unsubCustomers = onSnapshot(collection(db, "customers"), (snap: QuerySnapshot<DocumentData>) => {
                setCustomers(snap.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        ...data,
                        id: doc.id,
                        lastActive: data.lastActive ? toDate(data.lastActive) : undefined
                    } as Customer
                }))
            })
        }

        // 4. Staff (Public/Admin? Usually Admin)
        let unsubStaff = () => { }
        if (currentUser?.role === 'admin' || currentUser?.role === 'staff') {
            unsubStaff = onSnapshot(collection(db, "staff"), (snap: QuerySnapshot<DocumentData>) => {
                setStaff(snap.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt ? toDate(data.createdAt) : undefined
                    } as StaffMember
                }))
            })
        }

        // 6. Banners (Public)
        const unsubBanners = onSnapshot(collection(db, "banners"), (snap: QuerySnapshot<DocumentData>) => {
            setBanners(snap.docs.map((doc) => ({ ...doc.data() as Omit<Banner, "id">, id: doc.id } as Banner)))
        })

        // 5. Orders (Request with Pagination Limit)
        const fetchInitialOrders = async () => {
            if (!currentUser) return;

            let q;
            if (currentUser.role === 'customer' || currentUser.role === 'guest') {
                try {
                    q = query(
                        collection(db, "orders"),
                        where("customerId", "==", currentUser.id),
                        orderBy("createdAt", "desc"),
                        limit(5)
                    )
                } catch (e) {
                    q = query(collection(db, "orders"), where("customerId", "==", currentUser.id), limit(5))
                }
            } else {
                // Admin: Last 20 orders
                q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(20))
            }

            const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
                const loadedOrders = snap.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    createdAt: toDate(doc.data().createdAt),
                    statusHistory: (doc.data().statusHistory || []).map((h: any) => ({ ...h, timestamp: toDate(h.timestamp) }))
                })) as Order[]

                setOrders(loadedOrders)
                setLastOrderDoc(snap.docs[snap.docs.length - 1] || null)
                setHasMoreOrders(snap.docs.length === (currentUser.role === 'admin' ? 20 : 5))
            }, (error) => {
                console.error("Order Listener Error:", error)
                if (error.code === 'failed-precondition') {
                    toast.error("النظام يحتاج إلى فهرس قاعدة بيانات للترتيب. راجع المسؤول.")
                    // Emergency Fallback
                    getDocs(query(collection(db, "orders"), where("customerId", "==", currentUser!.id), limit(10))).then(snap => {
                        const loaded = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) })) as Order[]
                        loaded.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                        setOrders(loaded)
                    })
                }
            })

            return unsub;
        }

        const unsubOrdersPromise = fetchInitialOrders();
        return () => { unsubOrdersPromise.then(unsub => unsub && unsub()) }

        // 7. Requests (Admin Only usually, or public?)
        let requestsQuery;
        if (currentUser?.role === 'customer' || currentUser?.role === 'guest') {
            requestsQuery = query(collection(db, "requests"), where("customerId", "==", currentUser.id), orderBy("createdAt", "desc"))
        } else {
            requestsQuery = query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(50))
        }

        const unsubRequests = onSnapshot(requestsQuery, (snap: QuerySnapshot<DocumentData>) => {
            setProductRequests(snap.docs.map((doc) => {
                const data = doc.data() as Omit<ProductRequest, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as ProductRequest
            }))
        }, (error) => {
            console.error("Requests Listener Error:", error)
            if (error.code === 'permission-denied') {
                // toast.error("ليس لديك صلاحية لعرض الطلبات (Admin only)") 
                // Suppress for customers/guests to avoid spam, mainly for debugging Admin
                if (currentUser?.role === 'admin') toast.error("خطأ صلاحيات في عرض الطلبات")
            } else if (error.code === 'failed-precondition') {
                toast.error("مطلوب إنشاء فهرس (Index) لعرض الطلبات. راجع المنصة.")
            }
        })

        // 8. Messages (Role Based & Caching)
        let messagesQuery;
        if (currentUser?.role === 'customer' || currentUser?.role === 'guest') {
            // Customer/Guest: Only my thread
            // REMOVED orderBy to avoid "Missing Index" issues. Sorting in memory.
            messagesQuery = query(collection(db, "messages"), where("userId", "==", currentUser.id))
        } else {
            // Admin: Recent active messages (Limit 50 for speed)
            messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(50))
        }

        // Optimistic Load from Cache for Customers
        if (currentUser?.role === 'customer' || currentUser?.role === 'guest') {
            const cachedParams = localStorage.getItem(`chat_cache_${currentUser.id}`)
            if (cachedParams) {
                try {
                    const parsed = JSON.parse(cachedParams)
                    // Transform dates back to objects if needed, or just use as is for initial render
                    // For simplicity, we just rely on the fast listener below, but this is where hydration would happen
                } catch (e) { }
            }
        }

        const unsubMessages = onSnapshot(messagesQuery, (snap: QuerySnapshot<DocumentData>) => {
            const msgs = snap.docs.map((doc) => {
                const data = doc.data() as Omit<Message, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Message
            })

            // Sort in memory (Newest Last for Chat)
            msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

            setMessages(msgs)

            // Update Cache for Customers
            if (currentUser?.role === 'customer' && msgs.length > 0) {
                // cache essential data
                localStorage.setItem(`chat_cache_${currentUser.id}`, JSON.stringify(msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() }))))
            }
        }, (error) => {
            console.error("Messages Listener Error:", error)
            // toast.error("Error fetching messages: " + error.message)
        })

        // 9. Settings (Public)
        const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap: DocumentSnapshot<DocumentData>) => {
            if (snap.exists()) {
                setStoreSettings(snap.data() as StoreSettings)
            } else {
                setDoc(doc(db, "settings", "global"), MOCK_SETTINGS)
            }
        })

        // 10. Coupons (Optimized)
        const unsubCoupons = onSnapshot(query(collection(db, "coupons"), orderBy("createdAt", "desc")), (snap: QuerySnapshot<DocumentData>) => {
            setCoupons(snap.docs.map((doc) => {
                const data = doc.data() as Omit<Coupon, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt), expiryDate: data.expiryDate ? toDate(data.expiryDate) : undefined } as Coupon
            }))
        })

        // 11. Notifications (User Specific)
        let notifQuery;
        if (currentUser) {
            notifQuery = query(collection(db, "notifications"), where("userId", "==", currentUser.id), orderBy("createdAt", "desc"), limit(50))
        } else {
            // Guest or Global
            notifQuery = query(collection(db, "notifications"), where("userId", "==", guestId || 'guest'), orderBy("createdAt", "desc"), limit(20))
        }

        const unsubNotifications = onSnapshot(notifQuery, (snap: QuerySnapshot<DocumentData>) => {
            setNotifications(snap.docs.map((doc) => {
                const data = doc.data() as Omit<Notification, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Notification
            }))
        })

        return () => {
            unsubCategories(); unsubCustomers(); unsubStaff();
            unsubOrdersPromise.then(unsub => unsub && unsub()); unsubBanners(); unsubRequests();
            unsubMessages(); unsubSettings(); unsubCoupons(); unsubNotifications();
        }
    }, [toDate, authInitialized, currentUser, guestId]) // Added currentUser dependence to trigger re-subscription on login/logout

    // Fetch Admin Preferences
    const [adminPreferences, setAdminPreferences] = useState<AdminPreferences>({ lastViewed: {} })

    useEffect(() => {
        const unsubscribeAdminPrefs = onSnapshot(doc(db, "settings", "admin_preferences"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                // Convert Timestamps to Dates if needed
                const lastViewed = data.lastViewed || {}
                Object.keys(lastViewed).forEach(key => {
                    if (lastViewed[key] instanceof Timestamp) {
                        lastViewed[key] = lastViewed[key].toDate()
                    }
                })
                setAdminPreferences({ lastViewed })
            } else {
                // If preferences don't exist, initialize them
                setDoc(doc(db, "settings", "admin_preferences"), { lastViewed: {} }, { merge: true })
            }
        })
        return () => unsubscribeAdminPrefs()
    }, [])

    // Filter categories based on user permissions
    useEffect(() => {
        if (!currentUser || currentUser.role === "admin" || currentUser.role === "staff") {
            setCategories(allCategories)
            return
        }

        // It's a customer
        const customerAllowed = currentUser.allowedCategories

        if (!customerAllowed || customerAllowed === "all") {
            // Filter out hidden categories for general customers
            setCategories(allCategories.filter(cat => !cat.isHidden))
        } else {
            // Filter categories
            setCategories(allCategories.filter(cat => customerAllowed.includes(cat.id)))
        }

    }, [currentUser, allCategories])

    const updateStoreSettings = async (settings: StoreSettings) => {
        try {
            await setDoc(doc(db, "settings", "global"), sanitizeData(settings), { merge: true })

            // Educational Feedback for AI
            if (settings.enableAIChat !== storeSettings.enableAIChat) {
                if (settings.enableAIChat) {
                    toast.success("تم تفعيل المساعد الذكي ✅", {
                        description: "سيقوم النظام الآن بالرد تلقائياً على استفسارات العملاء واقتراح المنتجات عند توفرها.",
                        duration: 5000
                    })
                } else {
                    toast.info("تم إيقاف المساعد الذكي 🛑", {
                        description: "ستحتاج للرد على جميع المحادثات يدوياً. لن يقوم النظام بالرد نيابة عنك.",
                        duration: 5000
                    })
                }
            } else {
                toast.success("تم تحديث إعدادات المتجر في السحابة", {
                    description: "سيتم تطبيق التغييرات فوراً على تطبيق العملاء."
                })
            }
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
        // 1. Initial State Check (Optimistic)
        if (!currentUser) {
            toast.error("يجب تسجيل الدخول لإتمام الطلب")
            router.push("/auth/login")
            return
        }

        // 2. Strict SDK Auth Check (Prevents Permission Denied on Rules)
        if (!auth.currentUser) {
            console.error("Create Order Failed: currentUser set but auth.currentUser is null (stale session)")
            toast.error("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى للمتابعة.")
            // Optional: Clear stale state?
            // setCurrentUser(null) 
            // localStorage.removeItem("ysg_user")
            router.push("/auth/login")
            return
        }

        if (cart.length === 0) return

        // Use logged-in user name or the one provided in checkout
        const finalCustomerName = additionalInfo?.name || currentUser?.name || "عميل"
        const finalCustomerPhone = additionalInfo?.phone || currentUser?.phone || ""
        const finalCustomerLocation = currentUser?.location || ""

        const orderData = {
            customerName: finalCustomerName,
            customerPhone: finalCustomerPhone,
            customerLocation: finalCustomerLocation,
            customerId: auth.currentUser.uid, // Use SDK ID for consistency
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price, // Required by Product type
                pricePiece: item.pricePiece, // Required by Product type
                unit: item.unit, // Required by Product type
                selectedPrice: item.selectedPrice,
                selectedUnit: item.selectedUnit,
                quantity: item.quantity,
                // Optimization: Only keep the main image to save space
                image: item.image || (item.images && item.images.length > 0 ? item.images[0] : ""),
                barcode: item.barcode || "",
                category: item.category || "",
                // Optional but useful? No, strip them. Just satisfy type.
                costPrice: item.costPrice || 0, // Keep if needed for profit calculation later? Maybe store 0 if optimizing.
            })),
            total: cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0),
            status: isDraft ? "pending" : "processing",
            createdAt: Timestamp.now(),
            statusHistory: [{ status: isDraft ? "pending" : "processing", timestamp: Timestamp.now() }]
        }


        // Optimistic UI: Clear cart and show success immediately
        const tempCart = [...cart];
        setCart([])
        toast.success(isDraft ? "تم حفظ المسودة" : "تم استلام طلبك بنجاح! 🚀")
        hapticFeedback('success')
        playSound('newOrder')

        // Capture auth state *before* async process to ensure validity
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            console.error("Critical: No firebaseUser available for background order creation")
            setCart(tempCart)
            toast.error("خطأ: يجب تسجيل الدخول مجدداً")
            return;
        }

        // Run in background to not block UI
        const processOrder = async () => {
            try {
                // Non-transactional approach for maximum reliability
                let orderId = "";
                let newCounterValue = 0;

                try {
                    const counterRef = doc(db, "counters", "orders");
                    const counterSnap = await getDoc(counterRef);

                    if (counterSnap.exists()) {
                        newCounterValue = (counterSnap.data().current || 0) + 1;
                    } else {
                        newCounterValue = 1;
                    }
                    orderId = newCounterValue.toString();
                } catch (counterError) {
                    console.error("Counter Read Failed, using fallback ID", counterError);
                    // Fallback to timestamp ID if counter fails (to prevent blocking orders)
                    orderId = `ORD-${Date.now()}`;
                }

                // 1. Create the Order
                // Re-construct orderData with verified user ID
                const finalOrderData = {
                    ...orderData,
                    id: orderId,
                    customerId: firebaseUser.uid, // Use captured UID
                };

                const orderRef = doc(db, "orders", orderId);
                await setDoc(orderRef, sanitizeData(finalOrderData));

                // VERIFICATION: Check if it actually wrote
                const verifySnap = await getDoc(orderRef);
                if (!verifySnap.exists()) {
                    throw new Error("Order write verification failed - Document not found after write");
                }

                // 2. Try to update counter (Fire and forget if it fails, or log)
                if (newCounterValue > 0) {
                    try {
                        await setDoc(doc(db, "counters", "orders"), { current: newCounterValue }, { merge: true });
                    } catch (writeError) {
                        console.error("Failed to update counter, but order was created", writeError);
                    }
                }

                // 3. Update customer lastActive
                const customerId = currentUser?.id || "guest"
                if (customerId !== "guest" && currentUser?.role === "customer") {
                    const customerRef = doc(db, "customers", customerId)
                    updateDoc(customerRef, { lastActive: Timestamp.now() }).catch(e => console.error("Update lastActive failed", e));
                }



                // Send Notification (Optimistic - fire and forget)
                const notificationMsg = "تم رفع طلبك بنجاح! سنقوم بمراجعته قريباً."
                const notifUserId = currentUser?.id || guestId || "guest"

                addDoc(collection(db, "notifications"), sanitizeData({
                    userId: notifUserId,
                    title: "تم رفع طلبك",
                    body: notificationMsg,
                    type: "success",
                    read: false,
                    createdAt: Timestamp.now()
                })).catch(console.error)

                sendPushNotification(
                    notifUserId,
                    "تم رفع الطلب",
                    notificationMsg,
                    `/customer/invoices`
                ).catch(console.error)


            } catch (e) {
                console.error("Order Creation Error (Background):", e)
                // Revert UI changes on critical failure
                setCart(tempCart)
                toast.error("حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى")
                hapticFeedback('error')
            }
        };

        // Execute background process without awaiting
        processOrder();
    }

    const fetchProducts = useCallback(async (categoryId?: string, isInitial = false) => {
        setLoading(true)
        try {
            let q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(50))
            if (categoryId && categoryId !== 'all') {
                // Note: This requires a composite index (category + createdAt)
                // If it fails, check console for index creation link
                q = query(collection(db, "products"), where("category", "==", categoryId), orderBy("createdAt", "desc"), limit(50))
            }

            const snap = await getDocs(q)
            const newProducts = snap.docs.map((doc) => {
                const data = doc.data() as Omit<Product, "id">
                return {
                    ...data,
                    id: doc.id,
                    discountEndDate: data.discountEndDate ? toDate(data.discountEndDate) : undefined,
                    createdAt: data.createdAt ? toDate(data.createdAt) : undefined
                } as Product
            })

            setProducts(newProducts)
            setLastProductDoc(snap.docs[snap.docs.length - 1] || null)
            setHasMoreProducts(snap.docs.length === 50)
        } catch (e) {
            console.error("Fetch Products Error", e)
            toast.error("فشل تحميل المنتجات. تحقق من الاتصال أو الفهارس.")
        } finally {
            setLoading(false)
        }
    }, [toDate])

    const loadMoreProducts = useCallback(async (categoryId?: string) => {
        if (!lastProductDoc || !hasMoreProducts) return

        let q = query(
            collection(db, "products"),
            orderBy("createdAt", "desc"),
            startAfter(lastProductDoc),
            limit(50)
        )
        if (categoryId && categoryId !== 'all') {
            q = query(
                collection(db, "products"),
                where("category", "==", categoryId),
                orderBy("createdAt", "desc"),
                startAfter(lastProductDoc),
                limit(50)
            )
        }

        const snap = await getDocs(q)
        const newProducts = snap.docs.map((doc) => {
            const data = doc.data() as Omit<Product, "id">
            return {
                ...data,
                id: doc.id,
                discountEndDate: data.discountEndDate ? toDate(data.discountEndDate) : undefined,
                createdAt: data.createdAt ? toDate(data.createdAt) : undefined
            } as Product
        })

        setProducts(prev => [...prev, ...newProducts])
        setLastProductDoc(snap.docs[snap.docs.length - 1] || null)
        setHasMoreProducts(snap.docs.length === 50)
    }, [lastProductDoc, hasMoreProducts, toDate])

    const searchProducts = async (term: string) => {
        if (!term) return []
        try {
            // Simple prefix search on Name (case sensitive unfortunately in Firestore)
            // or use a dedicated search field
            const q = query(
                collection(db, "products"),
                orderBy("name"),
                startAt(term),
                endAt(term + '\uf8ff'),
                limit(20)
            )
            const snap = await getDocs(q)
            return snap.docs.map((doc) => {
                const data = doc.data() as Omit<Product, "id">
                return { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Product
            })
        } catch (e) {
            console.error("Search Error", e)
            return []
        }
    }

    const scanProduct = async (barcode: string) => {
        const normalize = (s: string) => s.replace(/[-\s]/g, "").toUpperCase()
        const normalizedInput = normalize(barcode)
        if (!normalizedInput) return null

        // 1. Check loaded products (Local Cache First)
        const activeProducts = products.filter(p => !p.isDraft)
        let product = activeProducts.find(p => {
            if (!p.barcode) return false
            const normalizedStored = normalize(p.barcode)
            return normalizedStored === normalizedInput || p.barcode === barcode
        })

        // 2. Server Side Check (New)
        if (!product) {
            try {
                const q = query(collection(db, "products"), where("barcode", "==", barcode))
                const snap = await getDocs(q)
                if (!snap.empty) {
                    const doc = snap.docs[0]
                    const data = doc.data() as Omit<Product, "id">
                    product = { ...data, id: doc.id, createdAt: toDate(data.createdAt) } as Product
                }
            } catch (e) {
                console.error("Scan Error", e)
            }
        }

        if (product) {
            addToCart(product)
            return product
        }
        return null
    }

    const addProduct = async (product: Omit<Product, "id">) => {
        try {
            const dataToSave = { ...product, createdAt: Timestamp.now() }
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

    // --- JOIN REQUESTS LOGIC ---
    // (Type defined at top of file)

    const startJoinRequestsListener = (setRequests: React.Dispatch<React.SetStateAction<JoinRequest[]>>) => {
        return onSnapshot(query(collection(db, "joinRequests"), orderBy("createdAt", "desc")), (snap) => {
            setRequests(snap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                createdAt: doc.data().createdAt?.toDate() || new Date()
            } as JoinRequest)))
        })
    }

    const addJoinRequest = async (name: string, phone: string) => {
        try {
            // Use Server Action to bypass client-side rules
            const { submitJoinRequest } = await import("@/app/actions");
            const result = await submitJoinRequest(name, phone);

            if (result.success) {
                toast.success("تم إرسال طلب الانضمام بنجاح")
            } else {
                throw new Error(result.error || "Failed")
            }
        } catch (e) {
            console.error("Add Request Error:", e)
            toast.error("فشل إرسال الطلب")
        }
    }

    const deleteJoinRequest = async (id: string) => {
        try {
            await deleteDoc(doc(db, "joinRequests", id))
            toast.success("تم حذف الطلب")
        } catch (e) {
            console.error("Delete Request Error:", e)
            toast.error("فشل حذف الطلب")
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

            // --- REFERRAL SYSTEM (Generate Early) ---
            const referralCode = (username.substring(0, 3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase();

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
                permissions: [], // Customers don't have admin panel permissions
                referralCode,
                referralCount: 0
            });

            if (data.referredBy) {
                try {
                    const q = query(collection(db, "customers"), where("referralCode", "==", data.referredBy));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const referrerDoc = snap.docs[0];
                        const referrerData = referrerDoc.data();
                        const newCount = (referrerData.referralCount || 0) + 1;

                        await updateDoc(referrerDoc.ref, {
                            referralCount: newCount
                        });

                        // --- REWARDS CHECKS ---
                        if (newCount === 3) {
                            // Milestone Reached: 3 Referrals
                            const couponCode = `GIFT-${referrerData.username?.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

                            // 1. Create Coupon
                            await addDoc(collection(db, "coupons"), {
                                code: couponCode,
                                discount: 15,
                                type: "percentage",
                                active: true,
                                expiryDate: null, // No expiry or set one? Let's say unlimited for now
                                usageLimit: 1, // One time use
                                usedCount: 0,
                                createdAt: Timestamp.now(),
                                createdReason: "referral_reward",
                                ownerId: referrerDoc.id
                            });

                            // 2. Notify Referrer
                            const title = "🎁 مبروك! حصلت على هدية";
                            const body = `شكراً لدعوتك 3 أصدقاء! لقد حصلت على كوبون خصم 15% خاص بك: ${couponCode}`;

                            await addDoc(collection(db, "notifications"), {
                                userId: referrerDoc.id,
                                title,
                                body,
                                type: "success",
                                read: false,
                                createdAt: Timestamp.now()
                            });

                            // Send Push
                            sendPushNotification(referrerDoc.id, title, body, "/customer?notifications=open");
                        }
                    }
                } catch (err) {
                    console.error("Referral Error:", err);
                }
            }

            // 5. Create Customer Document
            await setDoc(doc(db, "customers", uid), sanitizeData({
                ...data,
                id: uid,
                email: email, // Store the actual used email
                username: username,
                referralCode, // Save Generated Code
                referralCount: 0,
                createdAt: Timestamp.now()
            }))

            await firebaseSignOut(secondaryAuth);

            // Send Welcome Notification (First time interaction)
            const welcomeTitle = "مرحباً بك في YSG GROUP! 👋"
            const welcomeBody = "سعداء بانضمامك إلينا! 🌹 هذا القسم مخصص لإشعاراتك الخاصة، حيث ستصلك تحديثات حالة الطلب والعروض الحصرية هنا."

            await addDoc(collection(db, "notifications"), sanitizeData({
                userId: uid,
                title: welcomeTitle,
                body: welcomeBody,
                type: "success",
                read: false,
                createdAt: Timestamp.now()
            }))

            // Trigger Welcome Push
            sendPushNotification(uid, welcomeTitle, welcomeBody, "/customer?notifications=open")

            // Send Welcome Chat Message
            await addDoc(collection(db, "messages"), sanitizeData({
                senderId: "admin", // Admin sender
                senderName: "الإدارة",
                text: "مرحباً بك! 👋 هذا قسم الدردشة المباشرة مع الإدارة. نحن هنا لمساعدتك.",
                isAdmin: true,
                read: false,
                userId: uid, // Target user
                createdAt: Timestamp.now()
            }))

            // Send Welcome Chat Message
            await addDoc(collection(db, "messages"), sanitizeData({
                senderId: "admin", // Admin sender
                senderName: "الإدارة",
                text: "مرحباً بك! 👋 هذا قسم الدردشة المباشرة مع الإدارة. نحن هنا لمساعدتك.",
                isAdmin: true,
                read: false,
                userId: uid, // Target user
                createdAt: Timestamp.now()
            }))

            toast.success("تم إضافة العميل وإرسال ترحيب")
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
        // 1. Get Customer to find username (if we want to be precise) or just try to delete common patterns
        // We need to delete: customers/{id}, users/{id}, usernames/{username}

        const customer = customers.find(c => c.id === customerId)

        await deleteDoc(doc(db, "customers", customerId))
        await deleteDoc(doc(db, "users", customerId)) // Delete Auth Profile

        if (customer?.username) {
            await deleteDoc(doc(db, "usernames", customer.username.toLowerCase()))
        }

        toast.error("تم حذف العميل وبيانات دخوله نهائياً")
    }

    const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
        const order = orders.find(o => o.id === orderId)
        if (!order) return

        // 1. Update Order Document
        await updateDoc(doc(db, "orders", orderId), sanitizeData({
            status,
            statusHistory: [...order.statusHistory, { status, timestamp: Timestamp.now() }]
        }))

        // 2. Create Persistent Notification for Customer
        const statusMessages: Record<string, string> = {
            processing: `🛠️ نعمل بجد! طلبك رقم #${orderId} الآن في مرحلة التحضير والتحقق.`,
            shipped: `🚚 بشرى سارة! طلبك رقم #${orderId} في الطريق إليك. ترقب وصوله!`,
            delivered: `✨ تم التوصيل! تم تسليم طلبك رقم #${orderId} بنجاح. نسعد بخدمتك دائماً.`,
            canceled: `🚫 تنبيه: تم إلغاء طلبك رقم #${orderId}. نعتذر عن أي إزعاج.`
        }

        if (statusMessages[status]) {
            await addDoc(collection(db, "notifications"), sanitizeData({
                userId: order.customerId,
                title: "تحديث حالة الطلب",
                body: statusMessages[status],
                type: status === "rejected" || status === "canceled" ? "error" : "success",
                read: false,
                createdAt: Timestamp.now()
            }))

            // 3. Send Push Notification
            await sendPushNotification(
                order.customerId,
                "تحديث طلبك",
                statusMessages[status],
                `/customer/invoices` // Deep link to order history
            )

            // Play Status Update Sound for Customer
            playSound('statusUpdate')
        }

        toast.info(`تم تحديث الحالة: ${status}`)
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
        if (banner) {
            const newState = !banner.active
            await updateDoc(doc(db, "banners", bannerId), { active: newState })
            toast.success(newState ? "تم تفعيل البانر ✅" : "تم إخفاء البانر 🙈", {
                description: newState
                    ? "سيظهر هذا البانر الآن في الصفحة الرئيسية للعملاء."
                    : "لن يظهر هذا البانر للعملاء بعد الآن."
            })
        }
    }

    const addProductRequest = async (request: Omit<ProductRequest, "id" | "status" | "createdAt">) => {
        try {
            await addDoc(collection(db, "requests"), sanitizeData({
                ...request,
                status: "pending",
                createdAt: Timestamp.now()
            }))
            toast.success("تم إرسال طلبك للسحابة")
        } catch (error: any) {
            console.error("Add Request Error:", error)
            if (error.code === 'permission-denied') {
                toast.error("عفواً، ليس لديك صلاحية لإرسال الطلب")
            } else {
                toast.error("فشل إرسال الطلب، حاول مرة أخرى")
            }
        }
    }

    const updateProductRequestStatus = async (requestId: string, status: ProductRequest["status"]) => {
        try {
            await updateDoc(doc(db, "requests", requestId), { status })
            toast.success("تم تحديث حالة الطلب")
        } catch (e) {
            console.error("Update Request Status Error:", e)
            toast.error("فشل تحديث حالة الطلب")
        }
    }

    const deleteProductRequest = async (requestId: string) => {
        try {
            await deleteDoc(doc(db, "requests", requestId))
            toast.success("تم حذف الطلب بنجاح")
        } catch (e) {
            console.error("Delete Request Error:", e)
            toast.error("فشل حذف الطلب")
        }
    }

    const sendMessage = async (text: string, isAdmin: boolean, customerId = "guest", customerName = "عميل", actionLink?: string, actionTitle?: string, image?: string, isSystemNotification = false) => {
        // Determine the target user. If admin sends, they must target a user (logic handled in UI usually via tagging or implicit context)
        // For general chat, if customer sends, userId is their ID.
        // If admin sends, we should probably store the target userId to avoid reliance on @mentions only.

        const targetUserId = isAdmin ? customerId : (currentUser?.id || customerId)

        try {
            await addDoc(collection(db, "messages"), sanitizeData({
                senderId: isAdmin ? "admin" : (currentUser?.id || customerId),
                senderName: isAdmin ? "الإدارة" : (currentUser?.name || customerName),
                text,
                isAdmin,
                read: false, // Default unread
                // Store userId so we can filter messages belonging to this user conversation easily
                userId: targetUserId,
                createdAt: Timestamp.now(),
                actionLink, // Save link
                actionTitle,
                image, // Save image
                isSystemNotification // Save flag
            }))

            // Send Push if Admin replying to a Customer
            if (isAdmin && customerId && customerId !== "guest") {
                await sendPushNotification(
                    customerId,
                    isSystemNotification ? "تحديث بخصوص طلبك" : "رسالة جديدة من الدعم الفني",
                    text,
                    isSystemNotification ? "/customer?notifications=open" : "/customer/chat"
                )
            }

            // Play Sound
            playSound('newMessage')

        } catch (e) {
            console.error("Send Message Error:", e)
            toast.error("فشل إرسال الرسالة")
        }
    }

    const markMessagesRead = async (customerId?: string) => {
        const targetId = customerId || currentUser?.id
        if (!targetId) return

        // If I am customer, I want to mark messages FROM admin as read.
        // If I am admin, I want to mark messages FROM customer as read.
        // Assuming this function is called by the viewer of the messages.

        const isViewerAdmin = currentUser?.role === "admin" || currentUser?.role === "staff"

        const unreadMessages = messages.filter(m => {
            if (isViewerAdmin) {
                // Admin reading customer messages
                return m.senderId === targetId && !m.isAdmin && !m.read
            } else {
                // Customer reading admin messages
                // Filter messages that are from admin AND directed to this user (or global)
                // Legacy logic used @mention in text. New logic might use userId field if present.
                // Let's handle both for backward compat.
                const isForMe = m.text.includes(`(@${targetId})`) || m.userId === targetId
                return m.isAdmin && isForMe && !m.read
            }
        })

        if (unreadMessages.length === 0) return

        const batchPromises = unreadMessages.map(m =>
            updateDoc(doc(db, "messages", m.id), { read: true })
        )

        try {
            await Promise.all(batchPromises)
        } catch (e) {
            console.error("Failed to mark messages read", e)
        }
    }

    const broadcastNotification = (text: string) => {
        toast.info(text, { duration: 5000, icon: "🔔" })
        hapticFeedback('success')
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
            // 1. Validate Phone Uniqueness
            if (!member.phone) throw new Error("رقم الهاتف مطلوب");

            const phoneQueryStaff = query(collection(db, "staff"), where("phone", "==", member.phone));
            const phoneQueryCustomers = query(collection(db, "customers"), where("phone", "==", member.phone));

            const [staffSnap, customerSnap] = await Promise.all([getDocs(phoneQueryStaff), getDocs(phoneQueryCustomers)]);

            if (!staffSnap.empty || !customerSnap.empty) {
                throw new Error("رقم الهاتف مستخدم بالفعل (كموظف أو عميل)");
            }

            // 2. Determine Email from Username (or generate one)
            // The member.email passed here might be empty now from UI.
            const username = (member as any).username || member.name.replace(/\s/g, '').toLowerCase();
            const normalizedUsername = username.toLowerCase().trim();
            const generatedEmail = `${normalizedUsername}@staff.ysg.local`;

            // 3. Create Auth User
            const secondaryAuth = getSecondaryAuth();
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, generatedEmail, member.password || "123456");
            const uid = userCredential.user.uid;

            // 4. Create User Profile
            await setDoc(doc(db, "users", uid), {
                id: uid,
                name: member.name,
                role: member.role,
                email: generatedEmail,
                username: normalizedUsername,
                phone: member.phone,
                permissions: member.role === "admin"
                    ? ["orders", "products", "customers", "settings", "chat", "sales", "admins"]
                    : member.permissions
            });

            // 5. Create Username Mapping
            await setDoc(doc(db, "usernames", normalizedUsername), {
                email: generatedEmail,
                uid: uid
            });

            // 6. Create Staff Document
            await setDoc(doc(db, "staff", uid), sanitizeData({
                ...member,
                id: uid,
                email: generatedEmail, // Store generated email
                username: normalizedUsername,
                password: null, // Don't store password in plain text
                createdAt: Timestamp.now()
            }))

            await firebaseSignOut(secondaryAuth);
            toast.success("تم إضافة الموظف بنجاح ✅", {
                description: `اسم المستخدم للدخول: ${normalizedUsername}`
            })
        } catch (error: any) {
            console.error("Add Staff Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("اسم المستخدم مستخدم بالفعل")
            } else {
                toast.error("فشل إضافة الموظف: " + (error.message || "خطأ غير معروف"))
            }
        }
    }


    const addExistingUserAsStaff = async (user: User) => {
        try {
            if (!user.id) throw new Error("بيانات المستخدم غير مكتملة");

            // 1. Create Staff Document using EXISTING ID
            await setDoc(doc(db, "staff", user.id), sanitizeData({
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                phone: user.phone || "",
                role: "admin",
                permissions: ["orders", "products", "customers", "settings", "chat", "sales", "admins"],
                createdAt: Timestamp.now()
            }), { merge: true })

            // 2. Update User Document to be Admin
            await setDoc(doc(db, "users", user.id), {
                role: "admin",
                permissions: ["orders", "products", "customers", "settings", "chat", "sales", "admins"],
                updatedAt: Timestamp.now()
            }, { merge: true })

            // 3. Update Username Mapping (Just in case)
            if (user.username) {
                await setDoc(doc(db, "usernames", user.username.toLowerCase()), {
                    email: user.email,
                    uid: user.id
                }, { merge: true });
            }

            toast.success("تم ترقية حسابك لمدير بنجاح! 🚀 يرجى تحديث الصفحة لرؤية التغييرات.")
            // trigger sound
            playSound('statusUpdate')

        } catch (error: any) {
            console.error("Promote Error:", error);
            toast.error("فشل الترقية: " + error.message)
        }
    }

    const loadMoreOrders = async () => {
        if (!lastOrderDoc || !hasMoreOrders || !currentUser) return

        try {
            let q;
            if (currentUser.role === 'customer') {
                q = query(
                    collection(db, "orders"),
                    where("customerId", "==", currentUser.id),
                    orderBy("createdAt", "desc"),
                    startAfter(lastOrderDoc),
                    limit(5)
                )
            } else {
                q = query(
                    collection(db, "orders"),
                    orderBy("createdAt", "desc"),
                    startAfter(lastOrderDoc),
                    limit(20)
                )
            }

            const snap = await getDocs(q)
            const newOrders = snap.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                createdAt: toDate(doc.data().createdAt),
                statusHistory: (doc.data().statusHistory || []).map((h: any) => ({ ...h, timestamp: toDate(h.timestamp) }))
            })) as Order[]

            setOrders(prev => [...prev, ...newOrders])
            setLastOrderDoc(snap.docs[snap.docs.length - 1] || null)
            setHasMoreOrders(snap.docs.length === (currentUser.role === 'admin' ? 20 : 5))

            if (newOrders.length > 0) {
                toast.success("تم تحميل المزيد من الطلبات")
            }
        } catch (error) {
            console.error("Load More Orders Error:", error)
            toast.error("فشل تحميل المزيد")
        }
    }

    const searchOrders = async (term: string) => {
        if (!term) return []
        setLoading(true)
        try {
            // Priority 1: Search by ID (Exact Match)
            const idQuery = query(collection(db, "orders"), where("id", "==", term))
            const idSnap = await getDocs(idQuery)

            if (!idSnap.empty) {
                return idSnap.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    createdAt: toDate(doc.data().createdAt),
                    statusHistory: (doc.data().statusHistory || []).map((h: any) => ({ ...h, timestamp: toDate(h.timestamp) }))
                })) as Order[]
            }

            // Priority 2: Try fetching by Doc ID (if term is a valid doc ID)
            try {
                const docRef = doc(db, "orders", term)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    return [{
                        ...docSnap.data(),
                        id: docSnap.id,
                        createdAt: toDate(docSnap.data().createdAt),
                        statusHistory: (docSnap.data().statusHistory || []).map((h: any) => ({ ...h, timestamp: toDate(h.timestamp) }))
                    } as Order]
                }
            } catch (e) {
                // Ignore invalid doc ID format errors
            }

            // Priority 3: Search by Customer Name (Prefix)
            // This requires a composite index or single index on customerName.
            try {
                const nameQuery = query(
                    collection(db, "orders"),
                    orderBy("customerName"),
                    startAt(term),
                    endAt(term + '\uf8ff'),
                    limit(20)
                )
                const nameSnap = await getDocs(nameQuery)
                if (!nameSnap.empty) {
                    return nameSnap.docs.map(doc => ({
                        ...doc.data(),
                        id: doc.id,
                        createdAt: toDate(doc.data().createdAt),
                        statusHistory: (doc.data().statusHistory || []).map((h: any) => ({ ...h, timestamp: toDate(h.timestamp) }))
                    })) as Order[]
                }
            } catch (e) {
                // console.warn("Name search failed (likely missing index)")
            }

            return []

        } catch (error) {
            console.error("Search Orders Error:", error)
            toast.error("حدث خطأ أثناء البحث")
            return []
        } finally {
            setLoading(false)
        }
    }


    const updateStaff = async (member: StaffMember) => {
        try {
            // 1. Check Phone Uniqueness (if changed)
            const oldMember = staff.find(s => s.id === member.id);
            if (oldMember && oldMember.phone !== member.phone) {
                const phoneQueryStaff = query(collection(db, "staff"), where("phone", "==", member.phone));
                const phoneQueryCustomers = query(collection(db, "customers"), where("phone", "==", member.phone));
                const [staffSnap, customerSnap] = await Promise.all([getDocs(phoneQueryStaff), getDocs(phoneQueryCustomers)]);

                // Exclude self from staff check (though ID check handles it usually, query returns docs)
                const duplicateStaff = staffSnap.docs.some(d => d.id !== member.id);
                if (duplicateStaff || !customerSnap.empty) {
                    toast.error("رقم الهاتف مستخدم بالفعل");
                    return;
                }
            }

            const { id, ...data } = member

            // 2. Update Staff Document
            await updateDoc(doc(db, "staff", id), sanitizeData(data))

            // 3. Update User Document
            await setDoc(doc(db, "users", id), {
                id,
                name: member.name,
                role: member.role,
                email: member.email,
                phone: member.phone, // Sync phone
                permissions: member.role === "admin"
                    ? ["orders", "products", "customers", "settings", "chat", "sales", "admins"]
                    : member.permissions
            }, { merge: true })

            toast.success("تم تحديث بيانات الموظف والصلاحيات")
        } catch (e) {
            console.error("Update Staff Error:", e);
            toast.error("فشل تحديث البيانات");
        }
    }

    const deleteStaff = async (memberId: string) => {
        try {
            const member = staff.find(s => s.id === memberId)

            await deleteDoc(doc(db, "staff", memberId))
            await deleteDoc(doc(db, "users", memberId)) // Revoke login access

            if (member?.username) {
                await deleteDoc(doc(db, "usernames", member.username.toLowerCase()))
            } else if (member?.email && member.email.includes("@ysg.local")) {
                // Try to guess username from legacy email if not present
                const username = member.email.split("@")[0]
                await deleteDoc(doc(db, "usernames", username))
            }

            toast.error("تم حذف الموظف وسحب الصلاحيات نهائياً")
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
        toast.success("تم إنشاء الكوبون بنجاح 🎫", {
            description: "سيتمكن العملاء من استخدام هذا الكود في سلة المشتريات للحصول على الخصم."
        })
    }

    const deleteCoupon = async (id: string) => {
        await deleteDoc(doc(db, "coupons", id))
        toast.error("تم حذف الكوبون")
    }

    const applyCoupon = async (code: string) => {
        const coupon = coupons.find(c => c.code === code && c.active)

        if (!coupon) {
            toast.error("كود الخصم غير صحيح")
            return null
        }

        // 1. Expiry Check
        if (coupon.expiryDate && coupon.expiryDate.toDate() < new Date()) {
            toast.error("الخصم منتهي الصلاحية")
            return null
        }

        // 2. Start Date Check
        if (coupon.startDate && coupon.startDate.toDate() > new Date()) {
            toast.error("الخصم لم يبدأ بعد")
            return null
        }

        // 3. Global Usage Limit Check
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            toast.error("تم تجاوز الحد الأقصى لاستخدام هذا الكوبون")
            return null
        }

        // 4. Minimum Order Value Check
        const currentTotal = cart.reduce((acc, item) => acc + (item.selectedPrice * item.quantity), 0)
        if (coupon.minOrderValue && currentTotal < coupon.minOrderValue) {
            toast.error(`يجب أن تكون قيمة الطلب أعلى من ${coupon.minOrderValue} ريال لاستخدام هذا الكوبون`)
            return null
        }

        // 5. Customer Category Check
        // Placeholder for category logic if we implement strict customer types
        if (currentUser && coupon.allowedCustomerTypes !== "all" && coupon.allowedCustomerTypes) {
            // Logic to be refined when Customer Types are strictly defined
        }

        // 6. Per Customer Usage Limit Check
        if (currentUser && coupon.customerUsageLimit) {
            const userUsageCount = orders.filter(o =>
                o.customerId === currentUser.id &&
                (o as any).couponCode === code
            ).length

            if (userUsageCount >= coupon.customerUsageLimit) {
                toast.error(`لقد استخدمت هذا الكوبون الحد الأقصى المسموح به (${coupon.customerUsageLimit} مرات)`)
                return null
            }
        }

        return coupon
    }

    const sendNotification = async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
        await addDoc(collection(db, "notifications"), sanitizeData({
            ...notification,
            read: false,
            createdAt: Timestamp.now()
        }))

        // Trigger Push Notification with deep link to notifications sheet
        sendPushNotification(
            notification.userId,
            notification.title,
            notification.body,
            notification.link || "/customer?notifications=open"
        )

        // Local feedback for admin
        playSound('newMessage')
        hapticFeedback('medium')

        toast.success("تم إرسال الإشعار")
    }

    const markNotificationRead = async (id: string) => {
        await updateDoc(doc(db, "notifications", id), { read: true })
    }

    const markAllNotificationsRead = async () => {
        if (!currentUser) return

        // Filter unread notifications for current user
        const unread = notifications.filter(n => n.userId === currentUser.id && !n.read)
        if (unread.length === 0) return

        // Create batch update
        const batchPromises = unread.map(n =>
            updateDoc(doc(db, "notifications", n.id), { read: true })
        )

        try {
            await Promise.all(batchPromises)
        } catch (error) {
            console.error("Failed to mark all read:", error)
        }
    }

    const sendNotificationToGroup = async (segment: "vip" | "active" | "semi_active" | "interactive" | "dormant" | "all", title: string, body: string, link: string = "/customer?notifications=open") => {
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
                link, // Add link
                createdAt: Timestamp.now()
            }))
        )

        try {
            await Promise.all(batchPromises)

            // Trigger Batch Push Notification for the whole segment
            const targetIds = targetCustomers.map(c => c.id)
            sendPushToUsers(targetIds, "رسالة جماعية جديدة 💬", body, "/customer/chat")

            // Local feedback for admin
            playSound('newMessage')
            hapticFeedback('success')

            toast.success(`تم إرسال الإشعار لـ ${targetCustomers.length} عميل`)
        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ أثناء الإرسال")
        }
    }

    const sendGlobalMessage = async (text: string, actionLink?: string, actionTitle?: string) => {
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
                actionLink, // Save link
                actionTitle,
                createdAt: Timestamp.now()
            }))
        )

        try {
            await Promise.all(batchPromises)

            // Trigger Global Push Notification for Chat
            const targetIds = customers.map(c => c.id)
            sendPushToUsers(targetIds, "رسالة جماعية جديدة 💬", text, "/customer/chat")

            // Play Sound
            playSound('newMessage')

            toast.success(`تم إرسال الرسالة لـ ${customers.length} عميل`)
        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ أثناء الإرسال")
        }
    }

    // markMessagesRead function moved to be declared once

    const markNotificationsAsRead = async (type: "chat" | "system" | "orders", id?: string) => {
        if (!currentUser) return;

        try {
            if (type === "chat") {
                // If ID is provided, it's a specific conversation (Customer ID)
                // If no ID, maybe mark all? But usually we mark by conversation.
                // For Admin: Mark all messages from this customer as read
                // For Customer: Mark all messages from Admin as read

                // Logic: Query messages where read=false AND (if admin: sender!=admin / if customer: sender=admin)
                // This might be heavy to do "all".
                // Let's assume we pass the CustomerID (id) when admin opens a chat.
                // If customer is logged in, they mark their own received messages as read.

                const q = query(
                    collection(db, "messages"),
                    where("read", "==", false),
                    // Optimization: We should filter by conversation ID or User ID if possible
                    // But our message structure is flat. 
                    // Let's just find messages that are targeted to us or sent by the other party.
                )

                // This is a bit complex for a quick fix without a proper conversation sub-collection.
                // A better approach for the badge:
                // The badge counts `!m.read && !m.isAdmin` (for admin).
                // So we need to update those messages to `read: true`.

                // Let's implement a simple batch update for visual feedback
                const querySnapshot = await getDocs(q);
                // Filter in memory for safety if query is too broad
                const updates: Promise<void>[] = []
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as Message

                    // Admin clearing a specific customer's chat
                    if (currentUser.role === 'admin' && id && data.senderId === id && !data.isAdmin) {
                        updates.push(updateDoc(doc.ref, { read: true }))
                    }

                    // Customer clearing their own chat (messages from admin)
                    if (currentUser.role === 'customer' && data.userId === currentUser.id && data.isAdmin) {
                        updates.push(updateDoc(doc.ref, { read: true }))
                    }
                })
                await Promise.all(updates)
            }

            if (type === "system") {
                // Mark all notifications for this user as read
                // Implementation depends on where 'notifications' are stored. 
                // We have a `Notification` type but no `notifications` collection usage shown clearly in snippet.
                // Assuming we have a `notifications` collection or field.
                // For now, let's leave this placeholder or implement if we find the collection.
            }

        } catch (error) {
            console.error("Error marking as read:", error)
        }
    }

    const login = async (username: string, password: string, role: "admin" | "customer" | "staff"): Promise<boolean> => {
        try {
            let finalEmail = username.trim()

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

    const cleanupOrphanedUsers = async () => {
        try {
            console.log("Starting cleanup...")
            // 1. Get all users from 'users' collection
            const usersSnap = await getDocs(collection(db, "users"))
            const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User))

            // 2. Get valid IDs from customers and staff
            // Note: In a huge app, fetching all is bad. Here it's fine for admin maintenance.
            const customersSnap = await getDocs(collection(db, "customers"))
            const staffSnap = await getDocs(collection(db, "staff"))

            const validIds = new Set([
                ...customersSnap.docs.map(d => d.id),
                ...staffSnap.docs.map(d => d.id)
            ])

            // 3. Find orphans (User exists but no Customer/Staff profile)
            // EXCEPTION: Hardcoded admins or special accounts if any? 
            // Our logic: Every user MUST be either in 'customers' or 'staff'.
            // Special case: The "admin" user might be created manually? 
            // Usually we add them to staff. If not, we might delete them!
            // Let's protect specific IDs or emails if needed. 
            // For now, assume all legitimate users are in staff/customers.

            const safeEmails = ["admin@store.com"] // Add any hardcoded safeguards

            const orphans = allUsers.filter(u =>
                !validIds.has(u.id) &&
                !safeEmails.includes(u.email || "") &&
                u.id !== currentUser?.id // Don't delete self just in case
            )

            console.log(`Found ${orphans.length} orphans`, orphans)

            if (orphans.length === 0) {
                toast.success("قاعدة البيانات نظيفة! لا توجد حسابات معلقة.")
                return 0
            }

            // 4. Delete them
            const deletePromises = orphans.map(async (u) => {
                // Delete User Doc
                await deleteDoc(doc(db, "users", u.id))
                // Delete Username Mapping
                if (u.username) {
                    await deleteDoc(doc(db, "usernames", u.username.toLowerCase()))
                }
            })

            await Promise.all(deletePromises)

            const count = orphans.length
            toast.success(`تم تنظيف ${count} حساب معلق بنجاح 🧹`)
            return count

        } catch (error) {
            console.error("Cleanup Error:", error)
            toast.error("حدث خطأ أثناء التنظيف")
            throw error
        }
    }

    // --- Password Recovery Requests (Phone Based) ---
    const [passwordRequests, setPasswordRequests] = useState<PasswordRequest[]>([])

    useEffect(() => {
        if (!currentUser || currentUser.role === "customer") return

        const q = query(collection(db, "password_requests"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PasswordRequest[]

            // Check for added documents to play sound
            const hasAdded = snapshot.docChanges().some(change => change.type === "added")
            // Avoid sound on initial load (simple heuristic: if we have 0 requests locally and we get some, it might be initial load. 
            // Better: only play if !fromCache or using docChanges logic which works fine.
            // On initial load, all docs are 'added'.
            // Current best practice: Don't beep on hydration.
            // But checking 'snapshot.metadata.fromCache' helps.

            // If we want to only beep for NEW requests coming in Live:
            if (!snapshot.metadata.fromCache && hasAdded) {
                // Optimization: Only beep if this is not the very first visual render set?
                // docChanges with !fromCache usually works for live updates.
                playSound('passwordRequest')
            }

            setPasswordRequests(reqs)
        })
        return () => unsubscribe()
    }, [currentUser, playSound])

    const requestPasswordResetPhone = async (phone: string) => {
        try {
            // Use Server Action to bypass client-side permission rules
            const { requestPasswordResetAction } = await import("@/app/actions/auth-actions")
            const result = await requestPasswordResetAction(phone)

            if (!result.success) {
                const msg = result.error || "حدث خطأ، حاول مرة أخرى"
                toast.error(msg)
                return { success: false, message: msg }
            }

            const msg = "تم إرسال طلبك للإدارة، سيتم التواصل معك قريباً"
            toast.success(msg)
            return { success: true, message: msg }
        } catch (error) {
            console.error("Password Request Error:", error)
            toast.error("حدث خطأ، حاول مرة أخرى")
            return { success: false, message: "حدث خطأ غير متوقع" }
        }
    }

    const resolvePasswordRequest = async (id: string) => {
        try {
            await deleteDoc(doc(db, "password_requests", id))
            toast.success("تم إغلاق الطلب")
        } catch (error) {
            console.error("Resolve Error:", error)
        }
    }

    // Filter categories based on visibility
    const visibleCategories = React.useMemo(() => {
        if (!currentUser || currentUser.role === "admin" || currentUser.role === "staff") {
            return allCategories
        }
        return allCategories.filter(c => !c.isHidden)
    }, [allCategories, currentUser])

    // Filter products based on category visibility
    const visibleProducts = React.useMemo(() => {
        if (!currentUser || currentUser.role === "admin" || currentUser.role === "staff") {
            return products
        }
        return products.filter(p => {
            // Find the category for this product
            const category = allCategories.find(c => c.id === p.category || c.nameAr === p.category)
            return category ? !category.isHidden : true
        })
    }, [products, allCategories, currentUser])

    const markSectionAsViewed = async (section: keyof AdminPreferences['lastViewed']) => {
        try {
            const now = new Date()
            const newPrefs = {
                ...adminPreferences,
                lastViewed: {
                    ...adminPreferences.lastViewed,
                    [section]: now
                }
            }
            setAdminPreferences(newPrefs) // Optimistic update

            await setDoc(doc(db, "settings", "admin_preferences"), {
                lastViewed: {
                    ...newPrefs.lastViewed,
                    [section]: Timestamp.fromDate(now)
                }
            }, { merge: true })
        } catch (error) {
            console.error("Error marking section as viewed:", error)
        }
    }



    const value = {
        products: visibleProducts, cart, orders, categories: visibleCategories, customers, banners, productRequests,
        addToCart, removeFromCart, clearCart, createOrder, scanProduct,
        addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory,
        addCustomer, updateCustomer, deleteCustomer, updateOrderStatus,
        addBanner, deleteBanner, toggleBanner, addProductRequest,
        updateProductRequestStatus, loadMoreOrders, hasMoreOrders,
        deleteProductRequest,
        messages, sendMessage,
        broadcastNotification,
        markNotificationsAsRead,
        currentUser,
        login, logout,
        updateCartQuantity, restoreDraftToCart, storeSettings, updateStoreSettings,
        staff, addStaff, updateStaff, deleteStaff, broadcastToCategory,
        coupons, addCoupon, deleteCoupon, applyCoupon, notifications, sendNotification, markNotificationRead, sendNotificationToGroup, sendGlobalMessage,
        updateAdminCredentials, authInitialized, resetPassword, loading, guestId, markAllNotificationsRead,
        markMessagesRead,
        playSound,
        joinRequests,
        addJoinRequest,
        deleteJoinRequest,
        cleanupOrphanedUsers,
        passwordRequests,
        resolvePasswordRequest,
        requestPasswordReset: requestPasswordResetPhone,
        adminPreferences,
        markSectionAsViewed,
        fetchProducts,
        loadMoreProducts,
        searchProducts,
        searchOrders,
        hasMoreProducts,
        addExistingUserAsStaff
    }

    return (
        <StoreContext.Provider value={value}>
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
