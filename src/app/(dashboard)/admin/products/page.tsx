"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Search, Edit2, Trash2, Package, History, Tag, Clock, FileEdit, Zap, PackagePlus, Ban, RefreshCw, Copy, Folder, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"
import { useStore, Product } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { AdminProductForm } from "@/components/admin/product-form"
import { cn } from "@/lib/utils"

import { useSearchParams } from "next/navigation"

export default function ProductsPage() {
    const { products, deleteProduct, updateProduct, categories, fetchProducts, loadMoreProducts, searchProducts, hasMoreProducts, loading } = useStore()
    const searchParams = useSearchParams()

    // Initialize search with URL param or empty string
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "الكل")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // State for Tabs
    const [activeTab, setActiveTab] = useState<'all' | 'offers' | 'frozen' | 'drafts'>('all')

    // Derived State
    const allProducts = products
    
    // Extracted logic to match Product Form decoupled discount updates
    const isDiscounted = (p: Product) => (p.oldPricePiece && p.oldPricePiece > 0) || (p.oldPriceDozen && p.oldPriceDozen > 0);
    const hasActiveTimer = (p: Product) => p.discountEndDate && new Date(p.discountEndDate).getTime() > new Date().getTime();
    const hasExpiredTimer = (p: Product) => p.discountEndDate && new Date(p.discountEndDate).getTime() <= new Date().getTime();

    const activeOffers = products.filter(p => !p.isDraft && isDiscounted(p) && (!p.discountEndDate || hasActiveTimer(p)))
    const expiredOffers = products.filter(p => !p.isDraft && isDiscounted(p) && hasExpiredTimer(p))
    const draftProducts = products.filter(p => p.isDraft)

    // Server Side Search State
    const [serverSearchResults, setServerSearchResults] = useState<Product[] | null>(null)
    const [isSearching, setIsSearching] = useState(false)

    // Initial Fetch & Category Change
    useEffect(() => {
        fetchProducts(selectedCategory === "الكل" ? undefined : selectedCategory, true)
    }, [selectedCategory, fetchProducts])

    // Server Search Debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true)
                const results = await searchProducts(searchQuery)
                setServerSearchResults(results)
                setIsSearching(false)
            } else {
                setServerSearchResults(null)
            }
        }, 600)
        return () => clearTimeout(timer)
    }, [searchQuery, searchProducts])

    // Infinite Scroll Observer
    const observerTarget = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0]
                if (first.isIntersecting && hasMoreProducts && !loading && !searchQuery) {
                    loadMoreProducts(selectedCategory === "الكل" ? undefined : selectedCategory)
                }
            },
            { threshold: 0.1 }
        )

        const currentTarget = observerTarget.current
        if (currentTarget) {
            observer.observe(currentTarget)
        }

        return () => {
            if (currentTarget) observer.unobserve(currentTarget)
        }
    }, [hasMoreProducts, loading, loadMoreProducts, searchQuery, selectedCategory])


    const filteredProducts = serverSearchResults || products.filter((p: Product) => {
        // 1. Tab Filtering (Local on loaded buffer)
        if (activeTab === 'offers') {
            if (p.isDraft || !isDiscounted(p) || (p.discountEndDate && hasExpiredTimer(p))) return false
        } else if (activeTab === 'frozen') {
            if (p.isDraft || !isDiscounted(p) || !hasExpiredTimer(p)) return false
        } else if (activeTab === 'drafts') {
            if (!p.isDraft) return false
        } else {
            if (p.isDraft) return false
        }

        // 2. Client Side Category Filter (If not fetching by category)
        // Since we fetch by category now, this is redundant but safe.
        const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory
        return matchesCategory
    })

    const handleLoadMore = () => {
        loadMoreProducts(selectedCategory === "الكل" ? undefined : selectedCategory)
    }

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingProduct(null)
        setIsFormOpen(true)
    }

    const handleStopOffer = (product: Product) => {
        if (confirm(`هل أنت متأكد من إنهاء عرض "${product.name}" واستعادة سعره الأصلي؟`)) {
            const originalPrice = product.oldPricePiece || product.pricePiece
            updateProduct(product.id, {
                discountEndDate: undefined, // Fix: Use undefined for optional Date
                pricePiece: originalPrice,
                oldPricePiece: 0,
                oldPriceDozen: 0
            })
        }
    }

    // Tab Button Component
    const TabButton = ({ id, label, icon: Icon, count, color }: any) => (
        <button
            onClick={() => { setActiveTab(id); setSelectedCategory("الكل") }}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all border",
                activeTab === id
                    ? `bg-${color}-500/10 text-${color}-400 border-${color}-500/50`
                    : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
            )}
        >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-bold">{label}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full bg-white/10", activeTab === id && `bg-${color}-500/20 text-white`)}>
                {count}
            </span>
        </button>
    )

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                            <ArrowRight className="w-5 h-5 text-foreground" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">إدارة الأصناف</h1>
                        <p className="text-muted-foreground text-xs">مركز التحكم الموحد بالمنتجات والعروض</p>
                    </div>
                </div>

                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-6 shadow-lg shadow-primary/20"
                    onClick={handleAddNew}
                >
                    <PackagePlus className="w-5 h-5" />
                    <span>إضافة جديد</span>
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500">
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">إجمالي المنتجات</p>
                        <p className="text-2xl font-black text-foreground">{allProducts.filter(p => !p.isDraft).length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-green-500">
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">العروض النشطة</p>
                        <p className="text-2xl font-black text-green-400">{activeOffers.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                        <Zap className="w-5 h-5" />
                    </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-orange-500">
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">عروض منتهية</p>
                        <p className="text-2xl font-black text-orange-400">{expiredOffers.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <History className="w-5 h-5" />
                    </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-purple-500">
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">المسودة</p>
                        <p className="text-2xl font-black text-purple-400">{draftProducts.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <FileEdit className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Smart Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-border">
                <TabButton id="all" label="الكل" icon={Package} count={allProducts.filter(p => !p.isDraft).length} color="blue" />
                <TabButton id="offers" label="العروض النشطة" icon={Zap} count={activeOffers.length} color="green" />
                <TabButton id="frozen" label="عروض منتهية" icon={History} count={expiredOffers.length} color="orange" />
                <TabButton id="drafts" label="المسودة" icon={FileEdit} count={draftProducts.length} color="purple" />
            </div>

            {/* Search & Filter */}
            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="بحث بالاسم أو الباركود..."
                    className="bg-background border-border pr-10 text-right h-12 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter */}
            {activeTab === 'all' && (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    <button
                        onClick={() => setSelectedCategory("الكل")}
                        className={cn(
                            "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border relative overflow-hidden group",
                            selectedCategory === "الكل" ? "bg-primary text-white border-primary" : "bg-muted/50 border-border text-muted-foreground"
                        )}
                    >
                        <Package className="w-5 h-5" />
                        <span className="text-xs font-bold">الكل</span>
                    </button>

                    {categories.map((category) => (
                        <button
                            key={category.nameAr}
                            onClick={() => setSelectedCategory(category.nameAr)}
                            className={cn(
                                "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border relative overflow-hidden group p-2",
                                selectedCategory === category.nameAr ? "bg-primary text-white border-primary" : "bg-muted/50 border-border text-muted-foreground"
                            )}
                        >
                            <span className="text-xs font-bold relative z-10 truncate w-full px-1">{category.nameAr}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Products List or Draft Folders */}
            {(activeTab === 'drafts' && selectedCategory === 'الكل' && !searchQuery) ? (
                // --- DRAFT FOLDERS VIEW ---
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Calculate Groups */}
                    {(() => {
                        const groups = filteredProducts.reduce((acc, product) => {
                            const cat = product.category || "غير مصنف"
                            acc[cat] = (acc[cat] || 0) + 1
                            return acc
                        }, {} as Record<string, number>)

                        if (Object.keys(groups).length === 0) {
                            return (
                                <div className="col-span-full p-10 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/20">
                                    <FileEdit className="w-10 h-10 mx-auto mb-4 opacity-20" />
                                    لا توجد مسودات حالياً
                                </div>
                            )
                        }

                        return Object.entries(groups).map(([categoryName, count]) => (
                            <div
                                key={categoryName}
                                onClick={() => setSelectedCategory(categoryName)}
                                className="glass-card p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-all group border border-border"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                    <Folder className="w-8 h-8 fill-current" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-foreground text-sm">{categoryName}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{count} مسودة</p>
                                </div>
                            </div>
                        ))
                    })()}
                </div>
            ) : (
                // --- REGULAR LIST VIEW ---
                <div className="space-y-3">
                    {activeTab === 'drafts' && selectedCategory !== 'الكل' && (
                        <div className="flex items-center gap-2 mb-4">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("الكل")} className="text-muted-foreground hover:text-foreground">
                                <ArrowRight className="w-4 h-4 ml-1" />
                                عودة للمجلدات
                            </Button>
                            <span className="text-sm font-bold text-foreground">/ {selectedCategory}</span>
                        </div>
                    )}
                    {filteredProducts.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-muted/20">
                            <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                            {activeTab === 'drafts' ? "لا توجد مسودات محفوظة" : "لا توجد منتجات تطابق بحثك"}
                        </div>
                    ) : (
                        filteredProducts.map((product: Product) => (
                            <div key={product.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-muted/50 transition-colors relative overflow-hidden text-foreground">
                                {/* Badges */}
                                {product.isDraft && <div className="absolute top-2 left-2 bg-purple-500/20 text-purple-400 text-[9px] px-2 py-0.5 rounded-full font-bold">مسودة</div>}
                                {isDiscounted(product) && (!product.discountEndDate || hasActiveTimer(product)) && !product.isDraft && (
                                    <div className="absolute top-2 left-2 bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> عرض ساري
                                    </div>
                                )}

                                <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center text-2xl overflow-hidden border border-border shrink-0">
                                    {product.image ? (
                                        <div className="relative w-full h-full">
                                            <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                                        </div>
                                    ) : (
                                        <span>📦</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-foreground mb-1 truncate">{product.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground font-mono">{product.barcode || "---"}</span>
                                        <span className="text-[10px] text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full text-primary font-bold">{product.unit}</span>
                                    </div>
                                </div>

                                <div className="flex gap-6 items-center px-4">
                                    {/* 1. Cost Price (Internal) - Hidden on mobile */}
                                    <div className="hidden md:block text-right space-y-0.5 border-r border-border pr-6 pl-2 relative">
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">التكلفة</p>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-bold text-amber-500 leading-none">
                                                {product.costPrice || 0} <small className="text-[10px] mr-0.5">ر.س</small>
                                            </span>
                                        </div>
                                        {/* Visual Divider */}
                                        <div className="absolute left-0 top-2 bottom-2 w-px bg-white/10" />
                                    </div>

                                    {/* 2. Previous Price (Was) - Hidden on mobile */}
                                    <div className="hidden md:block text-right space-y-0.5 border-r border-border pr-6 min-w-[60px]">
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">سابقاً</p>
                                        <div className="flex flex-col items-end justify-center h-7">
                                            {product.oldPricePiece ? (
                                                <span className="text-sm text-red-500 line-through opacity-60 font-medium">
                                                    {product.oldPricePiece}
                                                </span>
                                            ) : (
                                                <span className="text-slate-700 text-xs">-</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Current Price (Now) - Always Visible */}
                                    <div className="text-right space-y-0.5 border-r border-border pr-6">
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">حالياً</p>
                                        <div className="flex flex-col items-end">
                                            <span className={cn("text-lg font-bold leading-none", product.oldPricePiece ? "text-green-500" : "text-foreground")}>
                                                {product.pricePiece} <small className="text-[10px] mr-0.5">ر.س</small>
                                            </span>
                                        </div>
                                    </div>

                                    {/* 4. Dozen Price - Hidden on mobile */}
                                    <div className="hidden md:block text-right space-y-0.5 min-w-[80px]">
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">الدرزن</p>
                                        <div className="flex flex-col items-end">
                                            {product.priceDozen ? (
                                                <span className="text-lg font-bold text-muted-foreground leading-none">
                                                    {product.priceDozen} <small className="text-[10px] mr-0.5">ر.س</small>
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">غير محدد</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-1 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/customer?product=${product.id}`)
                                            toast.success("تم نسخ رابط المنتج")
                                        }}
                                        title="نسخ رابط المنتج"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    {/* Special Actions based on Tab */}
                                    {activeTab === 'offers' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                                            onClick={() => handleStopOffer(product)}
                                            title="إيقاف العرض واستعادة السعر"
                                        >
                                            <Ban className="w-4 h-4" />
                                        </Button>
                                    )}

                                    {activeTab === 'frozen' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-xl"
                                            onClick={() => handleEdit(product)}
                                            title="تجديد العرض"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-xl"
                                        onClick={() => handleEdit(product)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl"
                                        onClick={() => {
                                            if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
                                                deleteProduct(product.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Load More Button */}
            {/* Load More Sentinel */}
            {!searchQuery && hasMoreProducts && filteredProducts.length > 0 && (
                <div ref={observerTarget} className="flex justify-center pb-20 pt-10">
                    {loading && (
                        <div className="flex items-center gap-2 text-muted-foreground bg-muted/20 px-4 py-2 rounded-full text-xs animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري تحميل المزيد من المنتجات...</span>
                        </div>
                    )}
                </div>
            )}

            <AdminProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialProduct={editingProduct}
            />
        </div >
    )
}
