"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, Globe, ChevronDown, ChevronUp, Package, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Category, Product } from "@/context/store-context"
import { AdminCategoryForm } from "@/components/admin/category-form"
import { AdminProductForm } from "@/components/admin/product-form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export default function CategoriesPage() {
    const { categories, deleteCategory, products, deleteProduct } = useStore()
    const [isCatFormOpen, setIsCatFormOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [isProdFormOpen, setIsProdFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [newProductCategory, setNewProductCategory] = useState<string>("")
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
    const [productSearch, setProductSearch] = useState("")

    const handleEditCat = (cat: Category) => {
        setEditingCategory(cat)
        setIsCatFormOpen(true)
    }

    const handleAddCategory = () => {
        setEditingCategory(null)
        setIsCatFormOpen(true)
    }

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product)
        setIsProdFormOpen(true)
    }

    const handleAddProductToCategory = (categoryId: string) => {
        setEditingProduct(null)
        setNewProductCategory(categoryId)
        setIsProdFormOpen(true)
    }

    const getProductsForCategory = (category: Category) => {
        return products.filter((p: Product) => {
            const isExpired = p.discountEndDate && new Date(p.discountEndDate) < new Date()
            if (isExpired) return false
            return p.category === category.nameAr || p.category === category.id
        }).filter((p: Product) =>
            productSearch === "" || p.name.toLowerCase().includes(productSearch.toLowerCase())
        )
    }

    const toggleExpand = (categoryId: string) => {
        setExpandedCategoryId(prev => prev === categoryId ? null : categoryId)
        setProductSearch("")
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1 text-slate-900 dark:text-white">الأقسام والمنتجات</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                    onClick={handleAddCategory}
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قسم</span>
                </Button>
            </div>

            {/* Category List */}
            {categories.length === 0 ? (
                <div className="p-20 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-white/5">
                    لا توجد أقسام مسجلة
                </div>
            ) : (
                <div className="space-y-4">
                    {categories.map((category) => {
                        const catProducts = getProductsForCategory(category)
                        const isExpanded = expandedCategoryId === category.id
                        const totalProducts = products.filter((p: Product) =>
                            (p.category === category.nameAr || p.category === category.id) &&
                            !(p.discountEndDate && new Date(p.discountEndDate) < new Date())
                        ).length

                        return (
                            <div key={category.id} className="glass-card overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                                {/* Category Card Row */}
                                <div
                                    className="flex items-center gap-4 cursor-pointer group"
                                    onClick={() => toggleExpand(category.id)}
                                >
                                    {/* Category Image */}
                                    <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden">
                                        {category.image ? (
                                            <Image
                                                src={category.image}
                                                alt={category.nameAr}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-teal-500/10 flex items-center justify-center">
                                                <span className="text-4xl">{category.icon || "📁"}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                                    </div>

                                    {/* Category Info */}
                                    <div className="flex-1 py-4">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{category.nameAr}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Globe className="w-3 h-3 text-slate-400" />
                                            <span className="text-sm text-slate-400">{category.nameEn}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                {totalProducts} منتج
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pr-4" onClick={e => e.stopPropagation()}>
                                        <button
                                            className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all hover:scale-110"
                                            onClick={() => handleEditCat(category)}
                                            title="تعديل القسم"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="h-9 w-9 rounded-xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 transition-all hover:scale-110"
                                            onClick={() => {
                                                if (confirm("هل أنت متأكد من حذف هذا القسم؟")) deleteCategory(category.id)
                                            }}
                                            title="حذف القسم"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 transition-transform duration-300", isExpanded && "rotate-180")}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Products Section */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10 p-4 space-y-3">
                                                {/* Products Header */}
                                                <div className="flex items-center justify-between">
                                                    <div className="relative flex-1 ml-3">
                                                        <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                                        <Input
                                                            placeholder="بحث في منتجات هذا القسم..."
                                                            className="h-9 text-xs pr-8 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl"
                                                            value={productSearch}
                                                            onChange={e => setProductSearch(e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-primary hover:bg-primary/90 text-white gap-1.5 rounded-xl h-9 px-3 text-xs shrink-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleAddProductToCategory(category.id)
                                                        }}
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        إضافة منتج
                                                    </Button>
                                                </div>

                                                {/* Products Grid */}
                                                {catProducts.length === 0 ? (
                                                    <div className="py-10 text-center text-slate-400 text-sm">
                                                        <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                        {productSearch ? "لا توجد نتائج" : "لا توجد منتجات في هذا القسم"}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {catProducts.map((product: Product) => (
                                                            <div
                                                                key={product.id}
                                                                className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors"
                                                            >
                                                                {/* Product Image */}
                                                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                                                    {product.image ? (
                                                                        <div className="relative w-full h-full">
                                                                            <Image
                                                                                src={product.image}
                                                                                alt={product.name}
                                                                                fill
                                                                                className="object-cover"
                                                                                unoptimized
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                                                                    )}
                                                                </div>

                                                                {/* Product Info */}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{product.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-mono">{product.barcode}</p>
                                                                </div>

                                                                {/* Prices */}
                                                                <div className="text-right shrink-0">
                                                                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{product.pricePiece} ر.س</p>
                                                                    {product.priceDozen && (
                                                                        <p className="text-[10px] text-slate-400">درزن: {product.priceDozen}</p>
                                                                    )}
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="flex gap-1 shrink-0">
                                                                    <button
                                                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                                                                        onClick={e => { e.stopPropagation(); handleEditProduct(product) }}
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                                        onClick={e => {
                                                                            e.stopPropagation()
                                                                            if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) deleteProduct(product.id)
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Forms */}
            <AdminCategoryForm
                isOpen={isCatFormOpen}
                onClose={() => setIsCatFormOpen(false)}
                initialCategory={editingCategory}
            />
            <AdminProductForm
                isOpen={isProdFormOpen}
                onClose={() => {
                    setIsProdFormOpen(false)
                    setNewProductCategory("")
                }}
                initialProduct={editingProduct ? editingProduct : newProductCategory ? { category: newProductCategory } as any : null}
            />
        </div>
    )
}
