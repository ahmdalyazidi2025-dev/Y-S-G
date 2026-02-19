"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, where, getDocs, limit, startAfter, addDoc, doc, updateDoc, deleteDoc, Timestamp, startAt, endAt, writeBatch, onSnapshot } from "firebase/firestore"
import { toast } from "sonner"
import { Product, Category } from "@/types/store"
import { sanitizeData, toDate } from "@/lib/utils/store-helpers"

interface ProductContextType {
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
    reorderCategories: (orderedCategories: Category[]) => Promise<void>
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export function ProductProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [lastProductDoc, setLastProductDoc] = useState<any>(null)
    const [hasMoreProducts, setHasMoreProducts] = useState(true)

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "categories"), (snap) => {
            const cats = snap.docs.map(doc => ({ ...doc.data() as Omit<Category, "id">, id: doc.id } as Category))

            // Sort in-memory: order asc, then nameAr asc (fallback)
            const sortedCats = cats.sort((a, b) => {
                const orderA = a.order ?? 0
                const orderB = b.order ?? 0
                if (orderA !== orderB) return orderA - orderB
                return (a.nameAr || "").localeCompare(b.nameAr || "")
            })

            setCategories(sortedCats)
        })
        return () => unsubscribe()
    }, [])

    const fetchProducts = useCallback(async (categoryId?: string, isInitial = false) => {
        setLoading(true)
        try {
            let q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(50))
            if (categoryId && categoryId !== 'الكل') {
                q = query(collection(db, "products"), where("category", "==", categoryId), orderBy("createdAt", "desc"), limit(50))
            }
            const snap = await getDocs(q)
            const newProducts = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Product))
            setProducts(newProducts)
            setLastProductDoc(snap.docs[snap.docs.length - 1] || null)
            setHasMoreProducts(snap.docs.length === 50)
        } catch (e) {
            toast.error("فشل تحميل المنتجات")
        } finally {
            setLoading(false)
        }
    }, [])

    const loadMoreProducts = useCallback(async (categoryId?: string) => {
        if (!lastProductDoc || !hasMoreProducts) return
        let q = query(collection(db, "products"), orderBy("createdAt", "desc"), startAfter(lastProductDoc), limit(50))
        if (categoryId && categoryId !== 'الكل') {
            q = query(collection(db, "products"), where("category", "==", categoryId), orderBy("createdAt", "desc"), startAfter(lastProductDoc), limit(50))
        }
        const snap = await getDocs(q)
        const newProducts = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Product))
        setProducts(prev => [...prev, ...newProducts])
        setLastProductDoc(snap.docs[snap.docs.length - 1] || null)
        setHasMoreProducts(snap.docs.length === 50)
    }, [lastProductDoc, hasMoreProducts])

    const searchProducts = useCallback(async (term: string) => {
        if (!term) return []
        const q = query(collection(db, "products"), orderBy("name"), startAt(term), endAt(term + '\uf8ff'), limit(20))
        const snap = await getDocs(q)
        return snap.docs.map(doc => ({ ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Product))
    }, [])

    const scanProduct = useCallback(async (barcode: string) => {
        const q = query(collection(db, "products"), where("barcode", "==", barcode))
        const snap = await getDocs(q)
        if (!snap.empty) {
            const doc = snap.docs[0]
            return { ...doc.data(), id: doc.id, createdAt: toDate(doc.data().createdAt) } as Product
        }
        return null
    }, [])

    const addProduct = async (product: Omit<Product, "id">) => {
        await addDoc(collection(db, "products"), sanitizeData({ ...product, createdAt: Timestamp.now() }))
        toast.success("تم إضافة المنتج")
    }

    const updateProduct = async (id: string, data: Partial<Product>) => {
        await updateDoc(doc(db, "products", id), sanitizeData(data))
        toast.success("تم تحديث المنتج")
    }

    const deleteProduct = async (productId: string) => {
        await deleteDoc(doc(db, "products", productId))
        toast.error("تم حذف المنتج")
    }

    const addCategory = async (category: Omit<Category, "id">) => {
        // Find next sequential order
        const maxOrder = categories.length > 0
            ? Math.max(...categories.map(c => c.order ?? 0))
            : -1

        await addDoc(collection(db, "categories"), sanitizeData({
            ...category,
            order: maxOrder + 1
        }))
        toast.success("تم إضافة القسم")
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

    const reorderCategories = async (orderedCategories: Category[]) => {
        // Optimistic update
        const optimisticCategories = orderedCategories.map((cat, index) => ({
            ...cat,
            order: index
        }))

        const previousCategories = [...categories]
        setCategories(optimisticCategories)

        try {
            const batch = writeBatch(db)

            // Force update ALL categories in the batch to ensure they all have valid sequence numbers
            optimisticCategories.forEach((cat) => {
                const catRef = doc(db, "categories", cat.id)
                batch.update(catRef, { order: cat.order })
            })

            await batch.commit()
            toast.success("تم تحديث ترتيب الأقسام")
        } catch (error) {
            console.error("Error reordering categories:", error)
            setCategories(previousCategories) // Revert on failure
            toast.error("فشل في تحديث الترتيب")
            throw error
        }
    }

    return (
        <ProductContext.Provider value={{
            products, categories, loading, hasMoreProducts, fetchProducts, loadMoreProducts, searchProducts, scanProduct, addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, reorderCategories
        }}>
            {children}
        </ProductContext.Provider>
    )
}

export const useProducts = () => {
    const context = useContext(ProductContext)
    if (!context) throw new Error("useProducts must be used within ProductProvider")
    return context
}
