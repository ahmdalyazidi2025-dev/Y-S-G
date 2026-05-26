"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, Layers, Globe, Image as ImageIcon } from "lucide-react"
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
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">إدارة الأقسام</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                    onClick={handleAddNew}
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قسم</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-white/5">
                        لا توجد أقسام مسجلة
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} className="glass-card overflow-hidden group rounded-2xl border border-slate-200 dark:border-white/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
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

                                {/* Action buttons - always visible, colored */}
                                <div className="absolute top-3 left-3 flex gap-2 z-10">
                                    <button
                                        className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-110"
                                        onClick={() => handleEdit(category)}
                                        title="تعديل القسم"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="h-9 w-9 rounded-xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-110"
                                        onClick={() => {
                                            if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
                                                deleteCategory(category.id)
                                            }
                                        }}
                                        title="حذف القسم"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* ID badge */}
                                <div className="absolute top-3 right-3 z-10">
                                    <span className="text-[10px] bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg text-white/80 font-mono">
                                        #{category.id}
                                    </span>
                                </div>
                            </div>

                            {/* Info area */}
                            <div className="p-4">
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">{category.nameAr}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{category.nameEn}</span>
                                </div>
                            </div>
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
