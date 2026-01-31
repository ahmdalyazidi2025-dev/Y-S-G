"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Search, Edit2, Trash2, Package, History, Tag, Clock, FileEdit, Zap, PackagePlus, Ban, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Product } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { AdminProductForm } from "@/components/admin/product-form"
import { cn } from "@/lib/utils"

import { useSearchParams } from "next/navigation"

export default function ProductsPage() {
    const { products, deleteProduct, updateProduct, categories } = useStore()
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
    const activeOffers = products.filter(p => !p.isDraft && p.discountEndDate && new Date(p.discountEndDate) > new Date())
    const expiredOffers = products.filter(p => !p.isDraft && p.discountEndDate && new Date(p.discountEndDate) < new Date())
    const draftProducts = products.filter(p => p.isDraft)

    const filteredProducts = products.filter((p: Product) => {
        // 1. Tab Filtering
        if (activeTab === 'offers') {
            if (p.isDraft || !p.discountEndDate || new Date(p.discountEndDate) < new Date()) return false
        } else if (activeTab === 'frozen') {
            if (p.isDraft || !p.discountEndDate || new Date(p.discountEndDate) >= new Date()) return false
        } else if (activeTab === 'drafts') {
            if (!p.isDraft) return false
        } else {
            // "Active" Tab (Default): Show everything EXCLUDING drafts and expired offers? 
            // OR Show everything? Let's show everything except drafts for "All" usually, 
            // but user wants "Easy". Let's show ALL active products (not drafts).
            // Actually, "All" usually implies the master list. 
            // Let's stick to: "All" = All non-drafts. "Drafts" = Drafts.
            if (p.isDraft) return false
        }

        // 2. Search & Category Logic (Applied on top of Tab)
        const normalize = (s: string) => s.toLowerCase().replace(/[-\s]/g, "")
        const normalizedQuery = normalize(searchQuery)

        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            normalize(p.barcode || "").includes(normalizedQuery) ||
            (p.barcode || "").includes(searchQuery)

        const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory

        // 3. Date Range Filter
        let matchesDate = true
        if (filterStartDate) {
            const startDate = new Date(filterStartDate)
            startDate.setHours(0, 0, 0, 0)
            if (p.createdAt && new Date(p.createdAt) < startDate) matchesDate = false
            // Fallback: If no createdAt, we assume it matches unless strictly filtering? 
            // For now, if no createdAt, and filter is on, we might exclude it.
            if (!p.createdAt) matchesDate = false
        }
        if (filterEndDate) {
            const endDate = new Date(filterEndDate)
            endDate.setHours(23, 59, 59, 999)
            if (p.createdAt && new Date(p.createdAt) > endDate) matchesDate = false
        }

        return matchesSearch && matchesCategory && matchesDate
    }).sort((a, b) => {
        // Sorting Logic
        switch (sortOption) {
            case "name": return a.name.localeCompare(b.name, "ar")
            case "price-high": return b.pricePiece - a.pricePiece
            case "price-low": return a.pricePiece - b.pricePiece
            case "date-old":
                return (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0)
            case "date-new":
            default:
                // Default new to old. If no date, treat as old.
                return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        }
    })

    const handlePrint = () => {
        let title = "قائمة المنتجات"
        let filters = []

        if (selectedCategory !== "الكل") filters.push(`القسم: ${selectedCategory}`)
        if (filterStartDate || filterEndDate) {
            filters.push(`الفترة: ${filterStartDate || '...'} إلى ${filterEndDate || '...'}`)
        }

        printProductList(filteredProducts, title, filters.join(' | '))
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
                    : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
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
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                            <ArrowRight className="w-5 h-5 text-white" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">إدارة الأصناف</h1>
                        <p className="text-slate-400 text-xs">مركز التحكم الموحد بالمنتجات والعروض</p>
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
                        <p className="text-[10px] text-slate-400 font-bold uppercase">إجمالي المنتجات</p>
                        <p className="text-2xl font-black text-white">{allProducts.filter(p => !p.isDraft).length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-green-500">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">العروض النشطة</p>
                        <p className="text-2xl font-black text-green-400">{activeOffers.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                        <Zap className="w-5 h-5" />
                    </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-orange-500">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">عروض منتهية</p>
                        <p className="text-2xl font-black text-orange-400">{expiredOffers.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <History className="w-5 h-5" />
                    </div>
                </div>
                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-purple-500">
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">المسودة</p>
                        <p className="text-2xl font-black text-purple-400">{draftProducts.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <FileEdit className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Smart Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-white/5">
                <TabButton id="all" label="الكل" icon={Package} count={allProducts.filter(p => !p.isDraft).length} color="blue" />
                <TabButton id="offers" label="العروض النشطة" icon={Zap} count={activeOffers.length} color="green" />
                <TabButton id="frozen" label="عروض منتهية" icon={History} count={expiredOffers.length} color="orange" />
                <TabButton id="drafts" label="المسودة" icon={FileEdit} count={draftProducts.length} color="purple" />
            </div>

            {/* Search & Filter */}
            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                    placeholder="بحث بالاسم أو الباركود..."
                    className="bg-black/20 border-white/10 pr-10 text-right h-12 rounded-xl"
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
                            selectedCategory === "الكل" ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10 text-slate-400"
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
                                selectedCategory === category.nameAr ? "bg-primary text-white border-primary" : "bg-white/5 border-white/10 text-slate-400"
                            )}
                        >
                            <span className="text-xs font-bold relative z-10 truncate w-full px-1">{category.nameAr}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Products List */}
            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        {activeTab === 'drafts' ? "لا توجد مسودات محفوظة" : "لا توجد منتجات تطابق بحثك"}
                    </div>
                ) : (
                    filteredProducts.map((product: Product) => (
                        <div key={product.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-white/[0.03] transition-colors relative overflow-hidden">
                            {/* Badges */}
                            {product.isDraft && <div className="absolute top-2 left-2 bg-purple-500/20 text-purple-400 text-[9px] px-2 py-0.5 rounded-full font-bold">مسودة</div>}
                            {product.discountEndDate && new Date(product.discountEndDate) > new Date() && !product.isDraft && (
                                <div className="absolute top-2 left-2 bg-green-500/20 text-green-400 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <Zap className="w-3 h-3" /> عرض ساري
                                </div>
                            )}

                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-2xl overflow-hidden border border-white/10 shrink-0">
                                {product.image ? (
                                    <div className="relative w-full h-full">
                                        <Image src={product.image} alt={product.name} fill className="object-cover" unoptimized />
                                    </div>
                                ) : (
                                    <span>📦</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white mb-1 truncate">{product.name}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-mono">{product.barcode || "---"}</span>
                                    <span className="text-[10px] text-slate-500 bg-primary/10 px-2 py-0.5 rounded-full text-primary font-bold">{product.unit}</span>
                                </div>
                            </div>

                            <div className="flex gap-6 items-center px-4">
                                {/* 1. Cost Price (Internal) - Hidden on mobile */}
                                <div className="hidden md:block text-right space-y-0.5 border-r border-white/5 pr-6 pl-2 relative">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">التكلفة</p>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-bold text-amber-500 leading-none">
                                            {product.costPrice || 0} <small className="text-[10px] mr-0.5">ر.س</small>
                                        </span>
                                    </div>
                                    {/* Visual Divider */}
                                    <div className="absolute left-0 top-2 bottom-2 w-px bg-white/10" />
                                </div>

                                {/* 2. Previous Price (Was) - Hidden on mobile */}
                                <div className="hidden md:block text-right space-y-0.5 border-r border-white/5 pr-6 min-w-[60px]">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">سابقاً</p>
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
                                <div className="text-right space-y-0.5 border-r border-white/5 pr-6">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">حالياً</p>
                                    <div className="flex flex-col items-end">
                                        <span className={cn("text-lg font-bold leading-none", product.oldPricePiece ? "text-green-500" : "text-white")}>
                                            {product.pricePiece} <small className="text-[10px] mr-0.5">ر.س</small>
                                        </span>
                                    </div>
                                </div>

                                {/* 4. Dozen Price - Hidden on mobile */}
                                <div className="hidden md:block text-right space-y-0.5 min-w-[80px]">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">الدرزن</p>
                                    <div className="flex flex-col items-end">
                                        {product.priceDozen ? (
                                            <span className="text-lg font-bold text-slate-400 leading-none">
                                                {product.priceDozen} <small className="text-[10px] mr-0.5">ر.س</small>
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">غير محدد</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-1 ml-2">
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

            <AdminProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialProduct={editingProduct}
            />
        </div >
    )
}
