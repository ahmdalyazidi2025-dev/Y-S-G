"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ProductCard } from "@/components/store/product-card"
import { Input } from "@/components/ui/input"
import { Search, LogOut, Bell } from "lucide-react"
import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CategoryStories } from "@/components/store/category-stories"
import { PullToRefresh } from "@/components/store/pull-to-refresh"
import ScannerModal from "@/components/store/scanner-modal"
import RequestModal from "@/components/store/request-modal"
import { CartDrawer } from "@/components/store/cart-drawer"

const categories = ["الكل", "المشروبات", "المعلبات", "المجمدات", "المنظفات"]

export default function CustomerHome() {
    const { products, banners } = useStore()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("الكل")
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isRequestOpen, setIsRequestOpen] = useState(false)
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-2xl">
                            <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
                            <Input
                                placeholder="ما الذي تبحث عنه اليوم؟"
                                className="bg-white/5 border-white/10 rounded-2xl pr-12 text-right h-12 text-lg focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="glass" size="icon" className="rounded-2xl h-12 w-12 border-white/5 bg-white/5">
                                <Bell className="w-5 h-5 text-slate-400" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Modern Carousel */}
                <div className="px-4">
                    <div className="relative h-44 sm:h-56 md:h-72 lg:h-80 xl:h-96 w-full rounded-[2rem] overflow-hidden group shadow-2xl shadow-primary/10">
                        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out">
                            {activeBanners.length > 0 ? activeBanners.map((banner, idx) => (
                                <div key={idx} className="min-w-full h-full relative">
                                    <img
                                        src={banner.image}
                                        alt="banner"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                        <div className="space-y-1">
                                            <h2 className="text-xl lg:text-3xl font-bold text-white drop-shadow-md">عروض حصرية 🎉</h2>
                                            <p className="text-[10px] lg:text-sm text-slate-300">خصومات تصل إلى 50% على المنتجات المختارة</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="min-w-full h-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-slate-400">لا توجد عروض حالياً</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category Stories (Mobile) / Filter (Desktop) */}
                <div className="lg:hidden">
                    <CategoryStories selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
                </div>

                <div className="hidden lg:flex gap-2 overflow-x-auto pb-2 no-scrollbar px-4">
                    {["الكل", "المشروبات", "المعلبات", "المجمدات", "المنظفات"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-6 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all",
                                selectedCategory === cat
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="px-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <ProductCard key={product.id} item={product} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            لأ يوجد منتجات مطابقة للبحث
                        </div>
                    )}
                </div>


                <ScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onRequestProduct={() => setIsRequestOpen(true)}
                />
                <RequestModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
        </PullToRefresh>
    )
}
