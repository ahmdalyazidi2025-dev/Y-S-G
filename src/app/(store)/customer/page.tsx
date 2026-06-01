"use client"

import React, { useState, useEffect } from "react"
import { ProductCard } from "@/components/store/product-card"
import { Input } from "@/components/ui/input"
import { Search, Bell, Sparkles, CheckCircle } from "lucide-react"
import { useStore, Product } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CategoryStories } from "@/components/store/category-stories"
import { PullToRefresh } from "@/components/store/pull-to-refresh"
import ScannerModal from "@/components/store/scanner-modal"
import RequestModal from "@/components/store/request-modal"
import { ProductDetailsModal } from "@/components/store/product-details-modal"
import { CustomerNotifications } from "@/components/store/customer-notifications"
import { CartDrawer } from "@/components/store/cart-drawer"
import { motion, AnimatePresence } from "framer-motion"

export default function CustomerHome() {
    const { products, banners, categories, currentUser, markCustomerLoggedIn, setGlobalSelectedProduct } = useStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("الكل")
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [showAcceptedWelcome, setShowAcceptedWelcome] = useState(false)

    useEffect(() => {
        try {
            if (localStorage.getItem("ysg_accepted_welcome") === "true") {
                setShowAcceptedWelcome(true)
            }
        } catch (e) {
            console.error(e)
        }
    }, [])


    const handleRefresh = async () => {
        // In a real app, refresh data here
        await new Promise(r => setTimeout(r, 1500))
    }

    const activeBanners = banners.filter(b => b.active)

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.barcode && product.barcode.includes(searchQuery))
        
        // Match if product category is equal to the selected category name OR the selected category ID
        const selectedCatObj = categories.find(c => c.nameAr === selectedCategory)
        const matchesCategory = selectedCategory === "الكل" || 
                                product.category === selectedCategory || 
                                (selectedCatObj && product.category === selectedCatObj.id)
                                
        return matchesSearch && matchesCategory
    })

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="space-y-8 pb-32 w-full overflow-x-hidden text-right">
                {/* Search Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 flex-1">
                        <div className="relative flex-1 max-w-2xl group">
                            <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                            <Input
                                placeholder="ما الذي تبحث عنه اليوم؟"
                                className="bg-white/90 dark:bg-slate-900 border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl pr-12 text-right h-12 text-lg shadow-md shadow-slate-100/50 dark:shadow-none hover:border-primary/30 dark:hover:border-white/20 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-white dark:focus-visible:bg-slate-900 transition-all font-bold"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <CustomerNotifications />
                        </div>
                    </div>
                </div>

                {/* Modern Carousel */}
                <div className="px-4">
                    <div className="relative h-44 sm:h-56 md:h-72 lg:h-80 xl:h-96 w-full rounded-[2rem] overflow-hidden group shadow-2xl shadow-primary/10">
                        <div className="absolute inset-0 flex transition-transform duration-500 ease-in-out">
                            {activeBanners.length > 0 ? activeBanners.map((banner, idx) => (
                                <div key={idx} className="min-w-full h-full relative">
                                    <Image
                                        src={banner.image}
                                        alt="banner"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                        <div className="space-y-1 text-right w-full">
                                            <h2 className="text-xl lg:text-3xl font-black text-white drop-shadow-md">عروض حصرية 🎉</h2>
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

                {/* Category Stories - Native Circular Layout (Mobile & Desktop) */}
                <div className="w-full">
                    <CategoryStories selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
                </div>

                {/* Product Grid / Category Sections */}
                <div className="px-4 space-y-10">
                    {searchQuery === "" && selectedCategory === "الكل" ? (
                        categories.filter(c => !c.isHidden).map((cat) => {
                            const categoryProducts = products.filter(product => 
                                product.category === cat.id || 
                                product.category === cat.nameAr ||
                                product.category === cat.nameEn
                            );

                            if (categoryProducts.length === 0) return null;

                            return (
                                <div key={cat.id} className="space-y-4">
                                    <div className="flex items-center justify-between border-r-4 border-primary pr-3">
                                        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                            {cat.nameAr}
                                        </h3>
                                        <span className="text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full font-bold">
                                            {categoryProducts.length} منتج
                                        </span>
                                    </div>
                                    
                                    {/* Horizontal Swipeable Container */}
                                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x">
                                        {categoryProducts.map((product) => (
                                            <div key={product.id} className="w-[38%] min-w-[130px] sm:min-w-[185px] max-w-[200px] snap-start flex-shrink-0">
                                                <ProductCard
                                                    item={product}
                                                    onViewDetails={() => setSelectedProduct(product)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="space-y-4">
                            {selectedCategory !== "الكل" && (
                                <div className="flex items-center justify-between border-r-4 border-primary pr-3">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                                        {selectedCategory}
                                    </h3>
                                    <span className="text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full font-bold">
                                        {filteredProducts.length} منتج
                                    </span>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            item={product}
                                            onViewDetails={() => setGlobalSelectedProduct(product)}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center text-slate-500 font-bold bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                                        لا توجد منتجات مطابقة لفلتر البحث
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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

                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

                {/* Celebratory Accepted Welcome Modal */}
                <AnimatePresence>
                    {showAcceptedWelcome && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 30 }}
                                transition={{ type: "spring", damping: 18 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl space-y-6 text-center text-slate-900 dark:text-white"
                            >
                                <div className="relative">
                                    <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto text-primary text-4xl shadow-inner animate-bounce">
                                        🎉
                                    </div>
                                    <div className="absolute -top-1 -right-1 animate-pulse text-amber-500">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                        تم قبول وتفعيل حسابك بنجاح!
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        أهلاً بك كشريك نجاح في متجر <strong>YSG SALES</strong>. لقد تم تدشين حسابك بنجاح وبإمكانك الآن تصفح الأقسام الحصرية المحددة لك، طلب المنتجات، ومتابعة الفواتير والدفع فوراً!
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        try {
                                             localStorage.removeItem("ysg_accepted_welcome")
                                             if (currentUser?.id) {
                                                 markCustomerLoggedIn(currentUser.id)
                                             }
                                        } catch(e) {}
                                        setShowAcceptedWelcome(false)
                                    }}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-sm shadow-xl shadow-primary/25 hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    🛍️ ابدأ تصفح المتجر الآن
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PullToRefresh>
    )
}
