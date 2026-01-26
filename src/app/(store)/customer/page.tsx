"use client"

import React, { useState } from "react"
import { ProductCard } from "@/components/store/product-card"
import { Input } from "@/components/ui/input"
import { Search, Bell, User } from "lucide-react"
import Link from "next/link"
import { useStore, Product } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CategoryStories } from "@/components/store/category-stories"
import { PullToRefresh } from "@/components/store/pull-to-refresh"
import ScannerModal from "@/components/store/scanner-modal"
import RequestModal from "@/components/store/request-modal"
import { ProductDetailsModal } from "@/components/store/product-details-modal"
import { CartDrawer } from "@/components/store/cart-drawer"
import { CustomerNotifications } from "@/components/store/customer-notifications"
import { HeroBanner } from "@/components/store/hero-banner"
import { ProductCardSkeleton, CategorySkeleton } from "@/components/store/skeletons"



export default function CustomerHome() {
    const { products, banners, categories, loading } = useStore() // Assume loading is available
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("الكل")
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isCartOpen, setIsCartOpen] = useState(false)

    const handleRefresh = async () => {
        // In a real app, refresh data here
        await new Promise(r => setTimeout(r, 1500))
    }

    const activeBanners = banners.filter(b => b.active)

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.barcode && product.barcode.includes(searchQuery))

        // Fix: Compare category IDs (assuming product.category stores the ID now, or if it stores name, we need to find the ID)
        // Store Context usually saves category ID in product.category
        const matchesCategory = selectedCategory === "الكل" || product.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="min-h-screen w-full overflow-x-hidden text-right bg-background relative pb-32">

                {/* HERO BANNER SECTION */}
                <HeroBanner />

                {/* HEADER CONTENT (Search, Profile, Bell) */}
                <div className="relative z-10 px-4 pt-6 mb-44"> {/* Margin bottom pushes content down below the banner text area */}
                    <div className="flex flex-col gap-6">
                        {/* Top Bar */}
                        <div className="flex items-center justify-between">
                            <div className="text-white">
                                <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 drop-shadow-md">
                                    مرحباً بك <span className="animate-wave origin-bottom-right inline-block">👋</span>
                                </h1>
                                <p className="text-xs text-slate-200 font-medium opacity-90 drop-shadow-sm">لنبحث عن منتجاتك المفضلة</p>
                            </div>
                            <Link href="/customer/profile">
                                <div className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md p-[2px] cursor-pointer transition-all border border-white/10 shadow-lg">
                                    <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Search Bar - Sticky */}
                        <div className="sticky top-[72px] z-40 bg-[#080b12]/80 backdrop-blur-xl py-3 -mx-4 px-4 transition-all border-b border-white/5 shadow-2xl">
                            <div className="flex gap-3">
                                <div className="relative flex-1 group">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40 group-focus-within:text-primary transition-colors z-10" />
                                    <Input
                                        placeholder="ابحث عن منتج، باركود..."
                                        className="bg-white/90 border-white/40 shadow-inner backdrop-blur-xl rounded-2xl pr-12 text-right h-12 text-sm focus:ring-2 focus:ring-primary/50 text-black placeholder:text-slate-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <CustomerNotifications />
                            </div>
                        </div>
                    </div>
                </div>


                {/* Categories & Content Starts Here (Below Banner Area) */}

                {/* Category Stories (Mobile) */}
                <div className="lg:hidden pl-4 relative z-10 mb-6">
                    <CategoryStories selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
                </div>

                <div className="hidden lg:flex gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar px-4 relative z-30 customer-scrollbar mb-4 sticky top-[135px] bg-[#080b12]/95 backdrop-blur-md border-b border-white/5 -mx-4">
                    <button
                        onClick={() => setSelectedCategory("الكل")}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-sm font-bold transition-all border relative overflow-hidden group whitespace-nowrap",
                            selectedCategory === "الكل"
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                                : "bg-card border-border text-muted-foreground hover:bg-accent hover:border-accent hover:text-foreground"
                        )}
                    >
                        <span className="relative z-10">الكل</span>
                        {selectedCategory === "الكل" && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        )}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "px-8 py-3 rounded-2xl text-sm font-bold transition-all border relative overflow-hidden group whitespace-nowrap",
                                selectedCategory === cat.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                                    : "bg-card border-border text-muted-foreground hover:bg-accent hover:border-accent hover:text-foreground"
                            )}
                        >
                            <span className="relative z-10">{cat.nameAr}</span>
                            {selectedCategory === cat.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                            )}
                        </button>
                    ))}
                    {loading && [1, 2, 3].map(i => <CategorySkeleton key={i} />)}
                </div>

                {/* Product Grid */}
                <div className="px-4 relative z-10 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                            <span className="w-1.5 h-8 bg-primary rounded-full block" />
                            {selectedCategory === "الكل" ? "أحدث المنتجات" : selectedCategory}
                            <span className="text-xs text-muted-foreground font-normal bg-card px-3 py-1 rounded-full border border-border">{filteredProducts.length} منتج</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 pb-20">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    item={product}
                                    index={index}
                                    onViewDetails={() => setSelectedProduct(product)}
                                />
                            ))
                        ) : loading ? (
                            // Show 10 skeletons while loading
                            Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                                    <Search className="w-10 h-10 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-slate-300 font-bold text-lg">عفواً، لا توجد منتجات مطابقة</p>
                                    <p className="text-sm text-slate-500 mt-2">جرب البحث بكلمات أخرى أو تغيير التصنيف</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ambient Background */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] opacity-20 animate-pulse delay-1000" />
                </div>


                <ScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onRequestProduct={() => setIsRequestModalOpen(true)}
                />
                <RequestModal
                    isOpen={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                />

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
