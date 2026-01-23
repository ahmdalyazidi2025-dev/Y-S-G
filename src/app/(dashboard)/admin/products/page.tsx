"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Search, Edit2, Trash2, Package, History } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Product } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { AdminProductForm } from "@/components/admin/product-form"
import { cn } from "@/lib/utils"

export default function ProductsPage() {
    const { products, deleteProduct, categories } = useStore()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("الكل")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    const filteredProducts = products.filter((p: Product) => {
        const isExpired = p.discountEndDate && new Date(p.discountEndDate) < new Date()
        if (isExpired) return false // Hide expired from main list

        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery)
        const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory

        // When searching, we want to look inside the selected category if one is selected,
        // or all categories if "All" is selected.
        return matchesSearch && matchesCategory
    })

    const expiredCount = products.filter((p: Product) => p.discountEndDate && new Date(p.discountEndDate) < new Date()).length

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingProduct(null)
        setIsFormOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                            <ArrowRight className="w-5 h-5 text-white" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold flex-1 sm:flex-none">إدارة المنتجات</h1>
                </div>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <Link href="/admin/products/expired">
                        <Button variant="outline" className="border-white/10 hover:bg-white/5 text-slate-400 gap-2 rounded-full h-10 px-4 whitespace-nowrap">
                            <History className="w-4 h-4" />
                            <span>المنتهية ({expiredCount})</span>
                        </Button>
                    </Link>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4 whitespace-nowrap"
                        onClick={handleAddNew}
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة منتج</span>
                    </Button>
                </div>
            </div>

            <div className="relative mb-4">
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                    placeholder="بحث بالاسم أو الباركود..."
                    className="bg-black/20 border-white/10 pr-10 text-right h-12 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter Grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-6">
                <button
                    onClick={() => setSelectedCategory("الكل")}
                    className={cn(
                        "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border relative overflow-hidden group",
                        selectedCategory === "الكل"
                            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                    )}
                >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold">الكل</span>
                </button>

                {categories.map((category) => {
                    // Get first 3 product images for preview
                    const catProducts = products.filter(p => p.category === category.nameAr).slice(0, 3)

                    return (
                        <button
                            key={category.nameAr}
                            onClick={() => setSelectedCategory(category.nameAr)}
                            className={cn(
                                "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border relative overflow-hidden group p-2",
                                selectedCategory === category.nameAr
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20"
                            )}
                        >
                            {/* Product Previews Background */}
                            <div className="absolute inset-0 opacity-10 flex flex-wrap gap-0.5 pointer-events-none">
                                {catProducts.map((p, i) => (
                                    <div key={i} className="w-1/2 h-1/2 relative grayscale group-hover:grayscale-0 transition-all">
                                        {p.image && <Image src={p.image} alt="" fill className="object-cover" unoptimized />}
                                    </div>
                                ))}
                            </div>

                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center relative z-10 transition-transform group-hover:scale-110",
                                selectedCategory === category.nameAr ? "bg-white/20" : "bg-white/5"
                            )}>
                                {category.image ? (
                                    <Image src={category.image} alt="" fill className="object-cover rounded-full" unoptimized />
                                ) : (
                                    <Package className="w-5 h-5" />
                                )}
                            </div>
                            <span className="text-xs font-bold relative z-10 truncate w-full px-1">{category.nameAr}</span>
                        </button>
                    )
                })}
            </div>

            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        لا توجد منتجات تطابق بحثك
                    </div>
                ) : (
                    filteredProducts.map((product: Product) => (
                        <div key={product.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-white/[0.03] transition-colors relative overflow-hidden">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-2xl overflow-hidden border border-white/10 shrink-0">
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
                                    <span>{product.name.includes("بيبسي") ? "🥤" : product.name.includes("مياه") ? "💧" : "📦"}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white mb-1 truncate">{product.name}</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-mono">
                                        {product.barcode}
                                    </span>
                                    <span className="text-[10px] text-slate-500 bg-primary/10 px-2 py-0.5 rounded-full text-primary font-bold">
                                        {product.unit}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-6 items-center px-4">
                                {/* Piece Price Display */}
                                <div className="text-right space-y-0.5 border-r border-white/5 pr-6">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">الحبة</p>
                                    <div className="flex flex-col items-end">
                                        <span className="text-lg font-bold text-green-500 leading-none">
                                            {product.pricePiece} <small className="text-[10px] mr-0.5">ر.س</small>
                                        </span>
                                        {product.oldPricePiece && (
                                            <span className="text-[11px] text-red-500 line-through opacity-60 font-medium">
                                                {product.oldPricePiece}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Dozen Price Display */}
                                <div className="text-right space-y-0.5 min-w-[80px]">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">الدرزن</p>
                                    <div className="flex flex-col items-end">
                                        {product.priceDozen ? (
                                            <>
                                                <span className="text-lg font-bold text-green-500 leading-none">
                                                    {product.priceDozen} <small className="text-[10px] mr-0.5">ر.س</small>
                                                </span>
                                                {product.oldPriceDozen && (
                                                    <span className="text-[11px] text-red-500 line-through opacity-60 font-medium">
                                                        {product.oldPriceDozen}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-slate-600 italic">غير محدد</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-1 ml-2">
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
        </div>
    )
}
