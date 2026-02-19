"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, Layers, Globe, EyeOff, Eye, SortAsc, LayoutList } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Category } from "@/context/store-context"
import { AdminCategoryForm } from "@/components/admin/category-form"
import { CategoryReorderModal } from "@/components/admin/category-reorder-modal"
import { cn } from "@/lib/utils"

export default function CategoriesPage() {
    const { categories, deleteCategory } = useStore()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isReorderOpen, setIsReorderOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    // Quick Toggle Visibility
    const toggleVisibility = async (category: Category) => {
        try {
            const { doc, updateDoc } = await import("firebase/firestore")
            const { db } = await import("@/lib/firebase")

            const categoryRef = doc(db, "categories", category.id)
            await updateDoc(categoryRef, {
                isHidden: !category.isHidden
            })
            // Toast handled by listener or we can add local toast
        } catch (error) {
            console.error("Error toggling visibility:", error)
        }
    }

    const handleEdit = (category: Category) => {
        setEditingCategory(category)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingCategory(null)
        setIsFormOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-foreground transition-colors">
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground bg-clip-text">
                            إدارة الأقسام
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {categories.length} قسم نشط حالياً
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary h-11 px-6 rounded-xl gap-2 transition-all shadow-sm hover:shadow-md group"
                        onClick={() => setIsReorderOpen(true)}
                    >
                        <LayoutList className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold">ترتيب الأقسام</span>
                    </Button>
                    <Button
                        className="bg-primary hover:bg-emerald-600 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 gap-2 rounded-xl h-11 px-6 transition-all duration-300 transform hover:scale-105"
                        onClick={handleAddNew}
                    >
                        <Plus className="w-5 h-5" />
                        <span>إضافة قسم جديد</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Layers className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">لا توجد أقسام بعد</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            ابدأ بإضافة الأقسام لتنظيم منتجاتك بشكل أفضل ومساعدة العملاء في الوصول إليها.
                        </p>
                        <Button variant="outline" onClick={handleAddNew} className="border-border text-foreground hover:bg-muted">
                            إضافة أول قسم
                        </Button>
                    </div>
                ) : (
                    categories.map((category, index) => (
                        <div
                            key={category.id}
                            className={cn(
                                "glass-card group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10",
                                category.isHidden && "opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100 border-dashed border-border"
                            )}
                        >
                            {/* Category Card Content - Clickable to View Products */}
                            <Link href={`/admin/products?category=${encodeURIComponent(category.nameAr)}`} className="block h-full">
                                {/* Image Section */}
                                <div className="h-48 relative overflow-hidden bg-slate-800/50">
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60" />

                                    {category.isHidden && (
                                        <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-bold border border-white/10 flex items-center gap-1.5">
                                            <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                                            <span>مخفي</span>
                                        </div>
                                    )}

                                    {category.image && category.image.startsWith("data:") ? (
                                        <Image
                                            src={category.image}
                                            alt={category.nameAr}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 group-hover:from-muted group-hover:to-muted/80 transition-colors duration-500">
                                            <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center backdrop-blur-sm border border-border/50 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                                <Layers className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="p-5 relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-foreground text-xl group-hover:text-primary transition-colors duration-300">
                                                {category.nameAr}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground font-medium">{category.nameEn}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-mono bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg text-primary font-bold">
                                                ترتيب: {category.order || index + 1}
                                            </span>
                                            <span className="text-[10px] font-mono bg-muted/50 border border-border px-2 py-1 rounded-lg text-muted-foreground group-hover:text-foreground transition-colors">
                                                #{category.id.slice(0, 4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Actions (Absolute Positioned over Link) */}
                            <div className="absolute top-3 right-3 z-20 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75 pointer-events-none">
                                {/* Pointer events none on container, but auto on buttons so we can click buttons without triggering link */}
                                <div className="pointer-events-auto flex gap-2">
                                    <Button
                                        size="icon"
                                        className="h-9 w-9 rounded-xl bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleEdit(category)
                                        }}
                                        title="تعديل"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        className={cn(
                                            "h-9 w-9 rounded-xl border shadow-lg transition-all duration-300",
                                            category.isHidden
                                                ? "bg-red-600 border-red-500 text-white hover:bg-red-500 shadow-red-500/20"
                                                : "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-emerald-500/20"
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            toggleVisibility(category)
                                        }}
                                        title={category.isHidden ? "إظهار" : "إخفاء"}
                                    >
                                        {category.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>

                                    <Button
                                        size="icon"
                                        className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500 hover:border-red-500 shadow-lg"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation() // Prevent link navigation
                                            if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
                                                deleteCategory(category.id)
                                            }
                                        }}
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Hover Indicator Line */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                        </div>
                    ))
                )}
            </div>

            <AdminCategoryForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialCategory={editingCategory}
            />
            <CategoryReorderModal
                isOpen={isReorderOpen}
                onClose={() => setIsReorderOpen(false)}
            />
        </div>
    )
}
