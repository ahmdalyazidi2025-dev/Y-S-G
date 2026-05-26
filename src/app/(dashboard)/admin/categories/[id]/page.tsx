"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, Search, Package, History } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Product } from "@/context/store-context"
import { AdminProductForm } from "@/components/admin/product-form"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"

export default function CategoryProductsPage() {
    const params = useParams()
    const router = useRouter()
    const categoryId = params.id as string

    const { categories, products, deleteProduct } = useStore()
    const category = categories.find(c => c.id === categoryId)

    const [searchQuery, setSearchQuery] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    const categoryProducts = products.filter((p: Product) => {
        const isExpired = p.discountEndDate && new Date(p.discountEndDate) < new Date()
        if (isExpired) return false
        const matchesCat = p.category === category?.nameAr || p.category === categoryId
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery)
        return matchesCat && matchesSearch
    })

    const expiredCount = products.filter((p: Product) =>
        (p.category === category?.nameAr || p.category === categoryId) &&
        p.discountEndDate && new Date(p.discountEndDate) < new Date()
    ).length

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingProduct(null)
        setIsFormOpen(true)
    }

    if (!category) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Package className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                <p className="text-slate-500">القسم غير موجود</p>
                <Link href="/admin/categories">
                    <Button variant="ghost" className="gap-2">
                        <ArrowRight className="w-4 h-4" />
                        العودة للأقسام
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white shrink-0"
                    onClick={() => router.push("/admin/categories")}
                >
                    <ArrowRight className="w-5 h-5" />
                </Button>

                {/* Category thumbnail */}
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 relative bg-gradient-to-br from-primary/20 to-teal-500/10">
                    {category.image ? (
                        <Image src={category.image} alt={category.nameAr} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                            {category.icon || "📁"}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{category.nameAr}</h1>
                    <p className="text-xs text-slate-400">{categoryProducts.length} منتج</p>
                </div>

                <div className="flex gap-2 shrink-0">
                    {expiredCount > 0 && (
                        <Link href="/admin/products/expired">
                            <Button variant="outline" className="border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 gap-2 rounded-full h-10 px-3 text-xs">
                                <History className="w-3.5 h-3.5" />
                                منتهية ({expiredCount})
                            </Button>
                        </Link>
                    )}
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                        onClick={handleAddNew}
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة منتج</span>
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400 z-10" />
                <Input
                    placeholder="بحث بالاسم أو الباركود..."
                    className="bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 pr-10 text-right h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Products List */}
            <div className="space-y-3">
                {categoryProducts.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-white/5">
                        <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">{searchQuery ? "لا توجد نتائج مطابقة" : "لا توجد منتجات في هذا القسم بعد"}</p>
                        {!searchQuery && (
                            <Button className="mt-4 bg-primary text-white gap-2 rounded-full" onClick={handleAddNew}>
                                <Plus className="w-4 h-4" />
                                إضافة أول منتج
                            </Button>
                        )}
                    </div>
                ) : (
                    categoryProducts.map((product: Product, index: number) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="glass-card p-4 flex items-center gap-4 group hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors border border-slate-100 dark:border-white/5"
                        >
                            {/* Product Image */}
                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-2xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0">
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
                                    <span>📦</span>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{product.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-mono">
                                        {product.barcode}
                                    </span>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                        {product.unit}
                                    </span>
                                </div>
                            </div>

                            {/* Prices */}
                            <div className="flex gap-5 items-center px-3">
                                <div className="text-right space-y-0.5 border-r border-slate-200 dark:border-white/5 pr-5">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">الحبة</p>
                                    <span className="text-lg font-bold text-green-600 dark:text-green-400 leading-none">
                                        {product.pricePiece} <small className="text-[10px]">ر.س</small>
                                    </span>
                                    {product.oldPricePiece && (
                                        <p className="text-[10px] text-red-400 line-through">{product.oldPricePiece}</p>
                                    )}
                                </div>
                                <div className="text-right space-y-0.5 min-w-[72px]">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">الدرزن</p>
                                    {product.priceDozen ? (
                                        <>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400 leading-none">
                                                {product.priceDozen} <small className="text-[10px]">ر.س</small>
                                            </span>
                                            {product.oldPriceDozen && (
                                                <p className="text-[10px] text-red-400 line-through">{product.oldPriceDozen}</p>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">—</span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl"
                                    onClick={() => handleEdit(product)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                                    onClick={() => {
                                        if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
                                            deleteProduct(product.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AdminProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialProduct={editingProduct ?? ({ category: category.id } as any)}
            />
        </div>
    )
}
