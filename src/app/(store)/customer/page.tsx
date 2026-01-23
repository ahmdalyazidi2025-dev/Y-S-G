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



export default function CustomerHome() {
    const { products, banners } = useStore()
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
        const matchesCategory = selectedCategory === "الكل" || product.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="space-y-8 pb-32 w-full overflow-x-hidden text-right">
                {/* Search Header */}
                {/* Search Header */}
                <div className="flex flex-col gap-6 px-4 relative z-10">
                    {/* Welcome & Search */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black text-foreground mb-1 flex items-center gap-2">
                                    مرحباً بك <span className="animate-wave origin-bottom-right inline-block">👋</span>
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium">لنبحث عن منتجاتك المفضلة اليوم</p>
                            </div>
                            <Link href="/customer/profile">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-blue-400 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-purple-500/30">
                                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center backdrop-blur-3xl">
                                        <User className="w-6 h-6 text-foreground" />
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="ابحث عن منتج، باركود..."
                                    className="bg-card border-border data-[state=open]:border-primary/50  rounded-2xl pr-12 text-right h-14 text-base focus:ring-2 focus:ring-primary/20 focus:bg-accent transition-all font-medium placeholder:text-muted-foreground shadow-inner"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 border border-border bg-card hover:bg-accent shadow-lg group">
                                <Bell className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors group-hover:animate-swing" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modern Carousel */}
                <div className="px-4 relative z-10">
                    <div className="relative h-48 sm:h-64 md:h-80 w-full rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-primary/10 ring-1 ring-border transform transition-transform hover:scale-[1.01] duration-500">
                        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out">
                            {activeBanners.length > 0 ? activeBanners.map((banner, idx) => (
                                <div key={idx} className="min-w-full h-full relative">
                                    <Image
                                        src={banner.image}
                                        alt="banner"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 1200px"
                                        priority
                                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                                    <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-end text-right">
                                        <div className="bg-primary/20 backdrop-blur-xl border border-primary/20 px-4 py-1.5 rounded-full text-primary text-xs font-bold mb-3 shadow-lg shadow-primary/20">
                                            عروض حصرية 🔥
                                        </div>
                                        <h2 className="text-2xl lg:text-4xl font-black text-white drop-shadow-2xl mb-2 leading-tight">تخفيضات الموسم</h2>
                                        <p className="text-sm lg:text-base text-slate-200 font-medium max-w-[90%] opacity-90">استفد من خصومات تصل إلى 50% على المنتجات المختارة لفترة محدودة</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="min-w-full h-full bg-slate-900/50 flex items-center justify-center border border-dashed border-white/10 m-2 rounded-3xl backdrop-blur-sm">
                                    <span className="text-slate-500 text-sm font-medium">لا توجد عروض حالياً</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category Stories (Mobile) / Filter (Desktop) */}
                <div className="lg:hidden pl-4 relative z-10">
                    <CategoryStories selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
                </div>

                <div className="hidden lg:flex gap-3 overflow-x-auto pb-4 no-scrollbar px-4 relative z-10">
                    {["الكل", "المشروبات", "المعلبات", "المجمدات", "المنظفات"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-8 py-3 rounded-2xl text-sm font-bold transition-all border relative overflow-hidden group",
                                selectedCategory === cat
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                                    : "bg-card border-border text-muted-foreground hover:bg-accent hover:border-accent hover:text-foreground"
                            )}
                        >
                            <span className="relative z-10">{cat}</span>
                            {selectedCategory === cat && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                            )}
                        </button>
                    ))}
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
