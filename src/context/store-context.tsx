"use client"

import React, { createContext, useContext, useMemo } from "react"
import { AuthProvider, useAuth } from "./auth-context"
import { SettingsProvider, useSettings } from "./settings-context"
import { ProductProvider, useProducts } from "./product-context"
import { CartProvider, useCart } from "./cart-context"
import { CommunicationProvider, useCommunication } from "./communication-context"
import { OrderProvider, useOrders } from "./order-context"
import { CustomerProvider, useCustomers } from "./customer-context"
import { playSound } from "@/lib/utils/store-helpers"

export { useAuth, useSettings, useProducts, useCart, useCommunication, useOrders, useCustomers }


export * from "@/types/store"
import { User, Product, Category, Customer, StaffMember, Banner, CartItem, Order, ProductRequest, Coupon, Notification, Message, StoreSettings, AdminPreferences, JoinRequest, PasswordRequest } from "@/types/store"


export interface StoreContextType {
    currentUser: User | null
    staff: StaffMember[]
    authInitialized: boolean
    login: (username: string, password: string, role: "admin" | "customer" | "staff") => Promise<boolean>
    logout: () => void
    addStaff: (member: Omit<StaffMember, "id" | "createdAt" | "role"> & { password?: string, role: "admin" | "staff" }) => Promise<void>
    updateStaff: (member: StaffMember) => Promise<void>
    deleteStaff: (memberId: string) => Promise<void>
    addExistingUserAsStaff: (user: User) => Promise<void>
    resetPassword: (email: string) => Promise<boolean>
    storeSettings: StoreSettings
    adminPreferences: AdminPreferences
    banners: Banner[]
    updateStoreSettings: (settings: StoreSettings) => Promise<void>
    markSectionAsViewed: (section: keyof AdminPreferences['lastViewed']) => Promise<void>
    addBanner: (banner: Omit<Banner, "id">) => Promise<void>
    deleteBanner: (bannerId: string) => Promise<void>
    toggleBanner: (bannerId: string) => Promise<void>
    settingsLoaded: boolean
    products: Product[]
    categories: Category[]
    loading: boolean
    hasMoreProducts: boolean
    fetchProducts: (categoryId?: string, isInitial?: boolean) => Promise<void>
    loadMoreProducts: (categoryId?: string) => Promise<void>
    searchProducts: (queryTerm: string) => Promise<Product[]>
    scanProduct: (barcode: string) => Promise<Product | null>
    addProduct: (product: Omit<Product, "id">) => Promise<void>
    updateProduct: (id: string, data: Partial<Product>) => Promise<void>
    deleteProduct: (productId: string) => Promise<void>
    addCategory: (category: Omit<Category, "id">) => Promise<void>
    updateCategory: (category: Category) => Promise<void>
    deleteCategory: (categoryId: string) => Promise<void>
    reorderCategories: (orderedCategories: Category[]) => Promise<boolean>
    cart: CartItem[]
    addToCart: (product: Product, unit?: string, price?: number) => void
    removeFromCart: (productId: string, unit: string) => void
    updateCartQuantity: (productId: string, unit: string, delta: number) => void
    clearCart: () => void
    orders: Order[]
    coupons: Coupon[]
    hasMoreOrders: boolean
    createOrder: (currentUser: User | null, cart: CartItem[], isDraft?: boolean, additionalInfo?: { name?: string, phone?: string }, couponId?: string) => Promise<boolean>
    updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>
    loadMoreOrders: (currentUser?: User | null) => Promise<void>
    searchOrders: (term: string) => Promise<Order[]>
    searchCustomerOrders: (customerId: string, term: string) => Promise<Order[]>
    markOrderAsRead: (orderId: string) => Promise<void>
    addCoupon: (coupon: Omit<Coupon, "id" | "createdAt" | "usedCount">) => Promise<void>
    deleteCoupon: (id: string) => Promise<void>
    applyCoupon: (code: string, cartTotal: number, currentUser: User | null) => Promise<Coupon | null>
    customers: Customer[]
    addCustomer: (data: Omit<Customer, "id" | "createdAt">) => Promise<void>
    updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>
    deleteCustomer: (customerId: string) => Promise<void>
    cleanupOrphanedUsers: () => Promise<number>
    messages: Message[]
    notifications: Notification[]
    productRequests: ProductRequest[]
    joinRequests: JoinRequest[]
    passwordRequests: PasswordRequest[]
    sendMessage: (text: string, isAdmin: boolean, userId: string, userName?: string, link?: string, linkTitle?: string, image?: string, isSystemNotification?: boolean) => Promise<void>
    markNotificationsRead: (userId: string) => Promise<void>
    markNotificationRead: (id: string) => Promise<void>
    markMessagesRead: (userId?: string, isAdmin?: boolean, isSystem?: boolean) => Promise<void>
    broadcastNotification: (text: string) => void
    broadcastToCategory: (category: string, text: string) => void
    markAllNotificationsRead: (userId: string) => Promise<void>
    addProductRequest: (request: Omit<ProductRequest, "id" | "status" | "createdAt">) => Promise<void>

    updateProductRequestStatus: (id: string, status: ProductRequest["status"]) => Promise<void>
    deleteProductRequest: (id: string) => Promise<void>
    addJoinRequest: (name: string, phone: string) => Promise<void>
    deleteJoinRequest: (id: string) => Promise<void>
    resolvePasswordRequest: (id: string) => Promise<void>
    requestPasswordReset: (phone: string) => Promise<{ success: boolean; message: string }>
    sendNotificationToGroup: (groupId: string, title: string, body: string, link?: string) => Promise<void>
    sendGlobalMessage: (text: string, link?: string, linkTitle?: string) => Promise<void>
    sendNotification: (params: { userId: string, title: string, body: string, link?: string, type?: string }) => Promise<void>
    guestId: string

    markNotificationsAsRead: (section: keyof AdminPreferences['lastViewed']) => Promise<void>
    playSound: (type: 'newOrder' | 'newMessage' | 'statusUpdate' | 'generalPush' | 'passwordRequest') => void
    restoreDraftToCart: (orderId: string) => Promise<void>
}

// The global StoreContext remains for compatibility, but it now just aggregates values from sub-contexts
const StoreContext = createContext<StoreContextType | undefined>(undefined)


export function StoreProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <SettingsProvider>
                <ProductProvider>
                    <CartProvider>
                        <OrderProvider>
                            <CustomerProvider>
                                <CommunicationProvider>
                                    <StoreContextWrapper>
                                        {children}
                                    </StoreContextWrapper>
                                </CommunicationProvider>
                            </CustomerProvider>
                        </OrderProvider>
                    </CartProvider>
                </ProductProvider>
            </SettingsProvider>
        </AuthProvider>
    )
}

function StoreContextWrapper({ children }: { children: React.ReactNode }) {
    const auth = useAuth()
    const settings = useSettings()
    const products = useProducts()
    const cart = useCart()
    const orders = useOrders()
    const customers = useCustomers()
    const comms = useCommunication()

    // Aggregate everything into one object for backward compatibility
    const value = useMemo(() => ({
        ...auth,
        ...settings,
        ...products,
        ...cart,
        ...orders,
        ...customers,
        ...comms,
        // Any specifically mapped or combined values
        loading: auth.loading || products.loading || !settings.settingsLoaded,
        markNotificationsAsRead: settings.markSectionAsViewed,
        playSound: (type: Parameters<typeof playSound>[0]) => playSound(type, settings.storeSettings?.sounds),
        restoreDraftToCart: orders.restoreDraftToCart
    }), [auth, settings, products, cart, orders, customers, comms])

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    )
}

export function useStore() {
    const context = useContext(StoreContext)
    if (!context) throw new Error("useStore must be used within StoreProvider")
    return context
}
