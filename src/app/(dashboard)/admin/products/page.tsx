"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Search, Edit2, Trash2, Package } from "lucide-react"
import Link from "next/link"
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

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery)
        const matchesCategory = selectedCategory === "الكل" || p.category === selectedCategory
        return matchesSearch && matchesCategory
    })

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
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">إدارة المنتجات</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                    onClick={handleAddNew}
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منتج</span>
                </Button>
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

            {/* Category Filter Bar */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                {["الكل", ...categories.map(c => c.nameAr)].map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border shrink-0",
                            selectedCategory === category
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        لا توجد منتجات تطابق بحثك
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div key={product.id} className="glass-card p-4 flex items-center gap-4 group hover:bg-white/[0.03] transition-colors relative overflow-hidden">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-2xl overflow-hidden border border-white/10 shrink-0">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
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
