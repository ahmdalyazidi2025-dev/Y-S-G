"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, Globe, Package, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Category } from "@/context/store-context"
import { AdminCategoryForm } from "@/components/admin/category-form"
import { CategorySortModal } from "@/components/admin/category-sort-modal"
import { useRouter } from "next/navigation"

export default function CategoriesPage() {
    const { categories, deleteCategory, products } = useStore()
    const [isCatFormOpen, setIsCatFormOpen] = useState(false)
    const [isSortModalOpen, setIsSortModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const router = useRouter()

    const handleEditCat = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation()
        setEditingCategory(cat)
        setIsCatFormOpen(true)
    }

    const handleDeleteCat = (e: React.MouseEvent, cat: Category) => {
        e.stopPropagation()
        if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
            deleteCategory(cat.id)
        }
    }

    const handleAddCategory = () => {
        setEditingCategory(null)
        setIsCatFormOpen(true)
    }

    const getProductCount = (category: Category) => {
        return products.filter(p => {
            const isExpired = p.discountEndDate && new Date(p.discountEndDate) < new Date()
            if (isExpired) return false
            return p.category === category.nameAr || p.category === category.id
        }).length
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
                <h1 className="text-2xl font-bold flex-1 text-slate-900 dark:text-white">إدارة الأقسام</h1>
                <div className="flex items-center gap-2">
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-2 rounded-full h-10 px-4 shadow-lg shadow-orange-500/25 transition-all duration-200"
                        onClick={() => setIsSortModalOpen(true)}
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        <span>ترتيب الأقسام</span>
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                        onClick={handleAddCategory}
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة قسم</span>
                    </Button>
                </div>
            </div>

            {/* Categories Grid */}
            {categories.length === 0 ? (
                <div className="p-20 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-white/5">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    لا توجد أقسام مسجلة
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => {
                        const productCount = getProductCount(category)
                        return (
                            <div
                                key={category.id}
                                className="glass-card overflow-hidden group rounded-2xl border border-slate-200 dark:border-white/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                onClick={() => router.push(`/admin/categories/${category.id}`)}
                            >
                                {/* Image area - full cover */}
                                <div className="relative h-52 bg-gradient-to-br from-primary/20 to-teal-500/10 overflow-hidden">
                                    {category.image ? (
                                        <Image
                                            src={category.image}
                                            alt={category.nameAr}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-6xl filter drop-shadow-md">{category.icon || "📁"}</span>
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                    {/* Action buttons */}
                                    <div className="absolute top-3 left-3 flex gap-2 z-10">
                                        <button
                                            className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-110"
                                            onClick={(e) => handleEditCat(e, category)}
                                            title="تعديل القسم"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="h-9 w-9 rounded-xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-110"
                                            onClick={(e) => handleDeleteCat(e, category)}
                                            title="حذف القسم"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Product count badge */}
                                    <div className="absolute bottom-3 left-3 z-10">
                                        <span className="text-xs bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full text-white font-bold flex items-center gap-1.5">
                                            <Package className="w-3 h-3" />
                                            {productCount} منتج
                                        </span>
                                    </div>

                                    {/* ID & Status & Order badges */}
                                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                                        <span className="text-[10px] bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg text-white/80 font-mono">
                                            #{category.id}
                                        </span>
                                        {category.isHidden ? (
                                            <span className="text-[10px] bg-red-600/90 backdrop-blur-sm px-2 py-1 rounded-lg text-white font-bold">
                                                مخفي
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-emerald-600/90 backdrop-blur-sm px-2 py-1 rounded-lg text-white font-bold">
                                                نشط
                                            </span>
                                        )}
                                        <span className="text-[10px] bg-blue-600/90 backdrop-blur-sm px-2 py-1 rounded-lg text-white font-bold">
                                            الترتيب: {category.order ?? 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Info area */}
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{category.nameAr}</h3>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                            <Globe className="w-3.5 h-3.5" />
                                            <span>{category.nameEn}</span>
                                        </div>
                                    </div>
                                    <div className="text-slate-400 group-hover:text-primary transition-colors">
                                        <ArrowRight className="w-5 h-5 rotate-180" />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <AdminCategoryForm
                isOpen={isCatFormOpen}
                onClose={() => setIsCatFormOpen(false)}
                initialCategory={editingCategory}
            />

            <CategorySortModal
                isOpen={isSortModalOpen}
                onClose={() => setIsSortModalOpen(false)}
            />
        </div>
    )
}
