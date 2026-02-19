"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"
import { Product, CartItem } from "@/types/store"
import { hapticFeedback } from "@/lib/utils/store-helpers"

interface CartContextType {
    cart: CartItem[]
    addToCart: (product: Product, unit?: string, price?: number) => void
    removeFromCart: (productId: string, unit: string) => void
    updateCartQuantity: (productId: string, unit: string, delta: number) => void
    clearCart: () => void
    restoreCart: (items: CartItem[]) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])

    const addToCart = useCallback((product: Product, unit: string = "حبة", price?: number) => {
        const finalPrice = price ?? product.pricePiece
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.selectedUnit === unit)
            if (existing) {
                return prev.map(item => (item.id === product.id && item.selectedUnit === unit) ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { ...product, quantity: 1, selectedUnit: unit, selectedPrice: finalPrice }]
        })
        toast.success(`تم إضافة ${product.name} للسلة`)
        hapticFeedback('light')
    }, [])

    const removeFromCart = useCallback((productId: string, unit: string) => {
        setCart(prev => prev.filter(item => !(item.id === productId && item.selectedUnit === unit)))
        toast.error("تم حذف المنتج من السلة")
        hapticFeedback('medium')
    }, [])

    const updateCartQuantity = useCallback((productId: string, unit: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId && item.selectedUnit === unit) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) }
            }
            return item
        }))
        hapticFeedback('light')
    }, [])

    const clearCart = useCallback(() => setCart([]), [])

    const restoreCart = useCallback((items: CartItem[]) => {
        setCart(items)
        hapticFeedback('medium')
    }, [])

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartQuantity, clearCart, restoreCart }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) throw new Error("useCart must be used within CartProvider")
    return context
}
