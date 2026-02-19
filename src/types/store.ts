import { Timestamp } from "firebase/firestore"

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
    description?: string
    discountEndDate?: Date
    isDraft?: boolean
    notes?: string
    costPrice?: number
    createdAt?: Date
    isFeatured?: boolean
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
    isHidden?: boolean
}

export interface Customer {
    id: string
    name: string
    email: string
    username?: string
    phone: string
    location: string
    lastActive?: Date | null
    createdAt?: Date | Timestamp | null
    allowedCategories?: string[] | "all"
    password?: string
    referralCode?: string
    referredBy?: string
    referralCount?: number
}

export type StaffMember = {
    id: string
    name: string
    email: string
    username?: string
    phone: string
    role: "staff" | "admin"
    permissions: string[]
    createdAt?: Date | Timestamp | null
}

export type PasswordRequest = {
    id: string
    phone: string
    customerName: string
    customerId: string
    createdAt: Date | Timestamp
}

export type User = {
    id: string
    name: string
    role: "admin" | "customer" | "staff" | "guest"
    username: string
    permissions?: string[]
    email?: string
    password?: string
    phone?: string
    location?: string
    allowedCategories?: string[] | "all"
    referralCode?: string
    referralCount?: number
    isAnonymous?: boolean
    lastActive?: Date
}

export type Order = {
    id: string
    customerName: string
    accountName?: string
    customerPhone?: string
    customerLocation?: string
    customerId: string
    paymentMethod?: string
    items: CartItem[]
    total: number
    status: "pending" | "processing" | "shipped" | "delivered" | "canceled" | "accepted" | "deleted"
    createdAt: Date
    statusHistory: { status: string, timestamp: Date }[]
    isRead?: boolean
}

export type ProductRequest = {
    id: string
    customerName: string
    customerId?: string
    image?: string
    description?: string
    status: "pending" | "fulfilled" | "rejected"
    createdAt: Date
}

export type Coupon = {
    id: string
    code: string
    discount: number
    type: "percentage"
    expiryDate?: Timestamp
    startDate?: Timestamp
    usageLimit?: number
    customerUsageLimit?: number
    minOrderValue?: number
    categoryId?: string
    allowedCustomerTypes?: string[] | "all"
    usedCount: number
    active: boolean
    createdAt: Date
}

export type Notification = {
    id: string
    userId?: string
    title: string
    body: string
    read: boolean
    createdAt: Date
    type: "info" | "success" | "warning" | "error"
    link?: string
}

export type Message = {
    id: string
    senderId: string
    senderName: string
    text: string
    createdAt: Date
    isAdmin: boolean
    read: boolean
    userId?: string
    actionLink?: string
    actionTitle?: string
    image?: string
    isSystemNotification?: boolean
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
    aiApiKeys?: { key: string, status: "valid" | "invalid" | "unchecked" }[]
    logoUrl?: string
    geminiCustomPrompt?: string
    geminiReferenceImageUrl?: string
    enableMaintenance: boolean
    enableCoupons?: boolean
    enableAIChat?: boolean
    enableProductRequests?: boolean
    enableBarcodeScanner?: boolean
    sounds?: {
        newOrder?: string;
        newMessage?: string;
        statusUpdate?: string;
        generalPush?: string;
        passwordRequest?: string;
    }
    hiddenSections?: ("products" | "offers" | "categories" | "search")[]
}

export type AdminPreferences = {
    lastViewed: {
        orders?: Date | Timestamp
        requests?: Date | Timestamp
        chat?: Date | Timestamp
        joinRequests?: Date | Timestamp
        customers?: Date | Timestamp
        passwordRequests?: Date | Timestamp
        system?: Date | Timestamp
    }
}

export type JoinRequest = {
    id: string
    name: string
    phone: string
    createdAt: Date
}
