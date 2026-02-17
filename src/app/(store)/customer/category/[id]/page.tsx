"use client"

import React, { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStore } from "@/context/store-context"
import { ProductCard } from "@/components/store/product-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search, ScanBarcode, SlidersHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ScannerModal from "@/components/store/scanner-modal"
import { ProductDetailsModal } from "@/components/store/product-details-modal"
import { CartDrawer } from "@/components/store/cart-drawer"
import { PullToRefresh } from "@/components/store/pull-to-refresh"
import Image from "next/image"

export default function CategoryPage() {
    const params = useParams()
    const router = useRouter()
    const { products, categories, loading, storeSettings } = useStore()
    const categoryId = decodeURIComponent(params?.id as string)

    const [searchQuery, setSearchQuery] = useState("")
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [isCartOpen, setIsCartOpen] = useState(false)

    // Find current category
    const category = categories.find(c => c.id === categoryId || c.nameAr === categoryId)

    // Filter products for this category AND search query
    const categoryProducts = useMemo(() => {
        return products.filter(p => {
            // 1. Match Category (ID or Name for backward compatibility)
            const isInCategory = p.category === categoryId || (category && p.category === category?.nameAr)
            if (!isInCategory) return false

            // 2. Match Search Query
            if (!searchQuery) return true
            const q = searchQuery.toLowerCase()
            return (
                p.name.toLowerCase().includes(q) ||
                (p.barcode && p.barcode.includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q))
            )
        })
    }, [products, categoryId, category, searchQuery])

    const handleRefresh = async () => {
        await new Promise(r => setTimeout(r, 1000))
    }

    if (!category && !loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-xl font-bold mb-2">القسم غير موجود</h1>
                <Button onClick={() => router.back()}>العودة</Button>
            </div>
        )
    }

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="min-h-screen bg-background pb-20">
                {/* Header with Search */}
                <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 pb-4">
                    <div className="px-4 pt-12 pb-2">
                        <div className="flex items-center gap-4 mb-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10 text-white"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                            <h1 className="text-xl font-bold text-white flex-1 truncate">
                                {category?.nameAr || "القسم"}
                            </h1>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 group-focus-within:border-primary/50 transition-all" />
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors z-10" />
                                <Input
                                    placeholder="بحث في القسم (اسم، باركود)..."
                                    className="bg-transparent border-none shadow-none rounded-2xl pr-12 text-right h-12 text-sm focus:ring-0 text-white placeholder:text-slate-500 relative z-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus={false}
                                />
                            </div>
                            {storeSettings.enableBarcodeScanner !== false && (
                                <Button
                                    size="icon"
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:border-primary hover:text-white transition-all text-slate-400 shrink-0"
                                    onClick={() => setIsScannerOpen(true)}
                                >
                                    <ScanBarcode className="w-6 h-6" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 py-6">
                    {categoryProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {categoryProducts.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    item={product}
                                    index={index}
                                    onViewDetails={() => setSelectedProduct(product)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p>لا توجد منتجات مطابقة في هذا القسم</p>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {storeSettings.enableBarcodeScanner !== false && (
                    <ScannerModal
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onRequestProduct={() => { }} // Optional: Handle request from here if needed
                        onScan={(code) => {
                            setSearchQuery(code)
                            setIsScannerOpen(false)
                        }}
                    />
                )}

                <ProductDetailsModal
                    isOpen={!!selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    product={selectedProduct}
                />

                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
        </PullToRefresh>
    )
}
