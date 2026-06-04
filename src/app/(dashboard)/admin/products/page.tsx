"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Search, Edit2, Trash2, Package, History, ArrowUpDown, Calendar, Layers, Tag, Barcode, Link2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Product } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { AdminProductForm } from "@/components/admin/product-form"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"

export default function ProductsPage() {
    const { products, deleteProduct, categories, totalProductsDbCount, categoryProductCounts, loadMoreProducts, hasMoreProducts } = useStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("الكل")
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    const sentinelRef = useRef<HTMLDivElement | null>(null)
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    useEffect(() => {
        if (!hasMoreProducts || !loadMoreProducts || isLoadingMore) return

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsLoadingMore(true)
                loadMoreProducts()
                setTimeout(() => {
                    setIsLoadingMore(false)
                }, 1000)
            }
        }, {
            rootMargin: '100px'
        })

        const currentSentinel = sentinelRef.current
        if (currentSentinel) {
            observer.observe(currentSentinel)
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel)
            }
        }
    }, [hasMoreProducts, loadMoreProducts, isLoadingMore])

    const filteredProducts = products.filter((p: Product) => {
        const isExpired = p.discountEndDate && new Date(p.discountEndDate) < new Date()
        if (isExpired) return false // Hide expired from main list

        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (p.barcode && p.barcode.includes(searchQuery)) ||
                              (p.barcodes && p.barcodes.some(b => b.includes(searchQuery)))
        
        // Match if product category is equal to the selected category name OR the selected category ID
        const selectedCatObj = categories.find(c => c.nameAr === selectedCategory)
        const matchesCategory = selectedCategory === "الكل" || 
                                p.category === selectedCategory || 
                                (selectedCatObj && p.category === selectedCatObj.id)
                                
        return matchesSearch && matchesCategory
    })

    // Sorting Logic
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "newest") {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return timeB - timeA
        }
        if (sortBy === "oldest") {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return timeA - timeB
        }
        if (sortBy === "name-asc") {
            return a.name.localeCompare(b.name, "ar")
        }
        if (sortBy === "name-desc") {
            return b.name.localeCompare(a.name, "ar")
        }
        return 0
    })

    const expiredCount = products.filter((p: Product) => p.discountEndDate && new Date(p.discountEndDate) < new Date()).length
    const selectedCatObj = categories.find(c => c.nameAr === selectedCategory || c.id === selectedCategory || c.nameEn === selectedCategory)
    const activeCategoryId = selectedCatObj?.id

    const globalTotalCount = totalProductsDbCount || products.length

    const totalCount = searchQuery !== "" 
        ? filteredProducts.length
        : selectedCategory === "الكل" 
            ? (totalProductsDbCount || products.length)
            : (activeCategoryId && categoryProductCounts?.[activeCategoryId]) || filteredProducts.length

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingProduct(null)
        setIsFormOpen(true)
    }

    const handleCopyLink = (productId: string) => {
        const url = `${window.location.origin}/customer?product=${productId}`
        navigator.clipboard.writeText(url)
        toast.success("تم نسخ رابط المنتج بنجاح 🔗 جاهز لإرساله في الإشعارات")
        hapticFeedback('success')
    }

    return (
        <div className="space-y-8 pb-12 text-right">
            {/* Top Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white h-11 w-11 transition-all">
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">إدارة المنتجات</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">
                            إجمالي المخزون: {totalCount} منتج | القسم المحدد: {selectedCategory}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Link href="/admin/products/expired">
                        <Button variant="outline" className="border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 gap-2 rounded-2xl h-12 px-5 font-black text-xs sm:text-sm">
                            <History className="w-4 h-4 text-rose-500" />
                            <span>عروض منتهية ({expiredCount})</span>
                        </Button>
                    </Link>
                    <Button
                        className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-95 text-white gap-2 rounded-2xl h-12 px-6 font-black text-xs sm:text-sm shadow-lg shadow-primary/20 cursor-pointer"
                        onClick={handleAddNew}
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة منتج جديد</span>
                    </Button>
                </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        <Package className="w-5 h-5" />
                    </div>
                    <div className="text-left select-none">
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">المنتجات النشطة</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{globalTotalCount}</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div className="text-left select-none">
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الأقسام المتاحة</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{categories.length}</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                        <Tag className="w-5 h-5" />
                    </div>
                    <div className="text-left select-none">
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">وحدات بالكرتون</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">
                            {products.filter(p => p.priceDozen && p.priceDozen > 0).length}
                        </span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="w-10 h-10 bg-rose-500/10 dark:bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500">
                        <History className="w-5 h-5" />
                    </div>
                    <div className="text-left select-none">
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">منتهية الصلاحية</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{expiredCount}</span>
                    </div>
                </div>
            </div>

            {/* Premium Search & Sort Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-4 rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Modern Search bar */}
                    <div className="relative flex-1 group">
                        <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                        <Input
                            placeholder="ابحث باسم المنتج أو الباركود..."
                            className="bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 pr-12 text-right h-12 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-primary/30 transition-all font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {/* Modern Sorting Selector */}
                    <div className="relative min-w-[200px] flex items-center bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl px-3 h-12">
                        <ArrowUpDown className="w-4 h-4 text-slate-400 ml-2" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700 dark:text-slate-300 pr-2 cursor-pointer text-right"
                        >
                            <option value="newest" className="bg-white dark:bg-slate-900">الأحدث أولاً</option>
                            <option value="oldest" className="bg-white dark:bg-slate-900">الأقدم أولاً</option>
                            <option value="name-asc" className="bg-white dark:bg-slate-900">الاسم (أ - ي)</option>
                            <option value="name-desc" className="bg-white dark:bg-slate-900">الاسم (ي - أ)</option>
                        </select>
                    </div>
                </div>

                {/* Category Slider Bar */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                    {["الكل", ...categories.map(c => c.nameAr)].map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                                "px-5 py-2 rounded-full text-xs font-black transition-all whitespace-nowrap border shrink-0 cursor-pointer",
                                selectedCategory === category
                                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                    : "bg-slate-50 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Premium Products List Table-Card */}
            <div className="space-y-4">
                {sortedProducts.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/10">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <span className="text-base font-black">لا توجد منتجات مطابقة لعمليات البحث والفرز</span>
                    </div>
                ) : (
                    sortedProducts.map((product: Product, index: number) => {
                        const productIndex = sortBy === "newest" ? sortedProducts.length - index : index + 1
                        
                        return (
                            <div 
                                key={product.id} 
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-4 group hover:border-primary/20 dark:hover:border-white/10 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Left/Right Gradient Accent */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Sequence Number Badge (1-2-3) */}
                                <div className="absolute top-3 left-3 md:relative md:top-auto md:left-auto flex items-center justify-center shrink-0">
                                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-black text-xs flex items-center justify-center border border-slate-200/50 dark:border-white/5 shadow-inner">
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Product Image Container - Elevated Aspect Ratio */}
                                <div className="w-20 h-24 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-white/5 shrink-0 relative group-hover:scale-105 transition-transform duration-300">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-3xl">🔧</span>
                                    )}
                                </div>

                                {/* Information Container */}
                                <div className="flex-1 min-w-0 text-center md:text-right space-y-2 mt-4 md:mt-0">
                                    <div>
                                        <h3 className="font-black text-base text-slate-800 dark:text-white group-hover:text-primary transition-colors leading-tight mb-1">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap text-xs">
                                            <span className="bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-lg text-slate-500 font-bold border border-slate-200/50 dark:border-white/5 flex items-center gap-1">
                                                <Barcode className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{product.barcode || "لا يوجد"}</span>
                                            </span>
                                            <span className="bg-primary/10 px-2.5 py-0.5 rounded-lg text-primary font-black border border-primary/20">
                                                {product.category}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Sub detail: Created Date */}
                                    {product.createdAt && (
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center md:justify-start gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>تمت الإضافة: {new Date(product.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Pricing Side Section - Highly readable */}
                                <div className="flex items-center gap-6 py-2 px-6 border-y md:border-y-0 md:border-x border-slate-100 dark:border-white/5 w-full md:w-auto justify-around md:justify-end">
                                    {/* Piece Price */}
                                    <div className="text-center md:text-left space-y-1 min-w-[70px]">
                                        <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-black uppercase">
                                            الحبة
                                        </span>
                                        <div className="flex flex-col items-center md:items-start mt-1">
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                {product.pricePiece} <small className="text-[8px]">ر.س</small>
                                            </span>
                                            {product.oldPricePiece && (
                                                <span className="text-[10px] text-rose-500 line-through font-semibold leading-none">
                                                    {product.oldPricePiece}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dozen Price */}
                                    <div className="text-center md:text-left space-y-1 min-w-[80px]">
                                        <span className="text-[9px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-black uppercase">
                                            الكرتون
                                        </span>
                                        <div className="flex flex-col items-center md:items-start mt-1">
                                            {product.priceDozen ? (
                                                <>
                                                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                                        {product.priceDozen} <small className="text-[8px]">ر.س</small>
                                                    </span>
                                                    {product.oldPriceDozen && (
                                                        <span className="text-[10px] text-rose-500 line-through font-semibold leading-none">
                                                            {product.oldPriceDozen}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block pt-1 select-none">غير متاح</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Premium Actions Panel */}
                                <div className="flex items-center justify-center gap-2 shrink-0 w-full md:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 md:flex-none h-11 px-4 border-slate-200 dark:border-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl font-black gap-2 transition-all"
                                        onClick={() => handleCopyLink(product.id)}
                                    >
                                        <Link2 className="w-4 h-4" />
                                        <span>نسخ الرابط</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 md:flex-none h-11 px-4 border-slate-200 dark:border-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black gap-2 transition-all"
                                        onClick={() => handleEdit(product)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span>تعديل</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 md:flex-none h-11 px-4 border-slate-200 dark:border-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl font-black gap-2 transition-all"
                                        onClick={() => {
                                            if (confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) {
                                                deleteProduct(product.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>حذف</span>
                                    </Button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {hasMoreProducts && (
                <div ref={sentinelRef} className="flex justify-center pt-8 pb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
            )}

            <AdminProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialProduct={editingProduct}
            />
        </div>
    )
}
