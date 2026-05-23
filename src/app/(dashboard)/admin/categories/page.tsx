"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, Layers, Globe } from "lucide-react"
import Link from "next/link"
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
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.length === 0 ? (
                    <div className="col-span-full p-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        لا توجد أقسام مسجلة
                    </div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} className="glass-card overflow-hidden group">
                            <div className="h-24 bg-gradient-to-br from-primary/20 to-teal-500/10 flex items-center justify-center relative">
                                <Layers className="w-10 h-10 text-primary opacity-20" />
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <Button
                                        variant="glass"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-black/40 border-none text-white hover:bg-primary"
                                        onClick={() => handleEdit(category)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="glass"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-black/40 border-none text-white hover:bg-red-500"
                                        onClick={() => {
                                            if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
                                                deleteCategory(category.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-white text-lg">{category.nameAr}</h3>
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">ID: {category.id}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Globe className="w-3 h-3" />
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
