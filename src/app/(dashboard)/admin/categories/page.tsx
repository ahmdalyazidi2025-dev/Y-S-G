"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, Layers, Globe } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useStore, Category } from "@/context/store-context"
import { AdminCategoryForm } from "@/components/admin/category-form"

export default function CategoriesPage() {
    const { categories, deleteCategory } = useStore()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-white to-white/60">
                            إدارة الأقسام
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {categories.length} قسم نشط حالياً
                        </p>
                    </div>
                </div>
                <Button
                    className="bg-primary hover:bg-emerald-600 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 gap-2 rounded-xl h-11 px-6 transition-all duration-300 transform hover:scale-105"
                    onClick={handleAddNew}
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة قسم جديد</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <Layers className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">لا توجد أقسام بعد</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">
                            ابدأ بإضافة الأقسام لتنظيم منتجاتك بشكل أفضل ومساعدة العملاء في الوصول إليها.
                        </p>
                        <Button variant="outline" onClick={handleAddNew} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                            إضافة أول قسم
                        </Button>
                    </div>
                ) : (
                    categories.map((category) => (
                        <div
                            key={category.id}
                            className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
                        >
                            {/* Image Section */}
                            <div className="h-48 relative overflow-hidden bg-slate-800/50">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-60" />

                                {category.image && category.image.startsWith("data:") ? (
                                    <Image
                                        src={category.image}
                                        alt={category.nameAr}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <Layers className="w-16 h-16 text-slate-700 group-hover:text-primary/50 transition-colors duration-500" />
                                    </div>
                                )}

                                {/* Actions (Hidden by default, shown on hover/focus) */}
                                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                    {/* ID Badge moved to top-right typically, but keeping clean */}
                                </div>

                                <div className="absolute top-3 right-3 z-20 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                                    <Button
                                        size="icon"
                                        className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-primary hover:border-primary shadow-lg"
                                        onClick={() => handleEdit(category)}
                                        title="تعديل"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500 hover:border-red-500 shadow-lg"
                                        onClick={() => {
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

                            {/* Content Section */}
                            <div className="p-5 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-white text-xl group-hover:text-primary transition-colors duration-300">
                                            {category.nameAr}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Globe className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-sm text-slate-400 font-medium">{category.nameEn}</span>
                                        </div>
                                    </div>

                                    {/* Subtle ID Badge */}
                                    <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-1 rounded-lg text-slate-500 group-hover:text-slate-300 transition-colors">
                                        #{category.id.slice(0, 4)}
                                    </span>
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
        </div>
    )
}
