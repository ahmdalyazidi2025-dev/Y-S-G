"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Trash2, Image as ImageIcon, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"
import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { AdminBannerForm } from "@/components/admin/banner-form"

export default function AdminBannersPage() {
    const { banners, deleteBanner, toggleBanner } = useStore()
    const [isFormOpen, setIsFormOpen] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-foreground" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">صور العرض</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                    onClick={() => setIsFormOpen(true)}
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة صورة</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {banners.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        لا توجد صور عرض مسجلة
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className="glass-card overflow-hidden group relative">
                            <div className="aspect-[3/1] bg-black/40 overflow-hidden">
                                <NextImage
                                    src={banner.image}
                                    alt="banner"
                                    width={1200}
                                    height={400}
                                    className={cn("w-full h-full object-cover transition-opacity", !banner.active && "opacity-40")}
                                />
                            </div>

                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="glass"
                                    size="icon"
                                    className="h-10 w-10 bg-black/60 border-none rounded-xl text-white hover:bg-primary"
                                    onClick={() => toggleBanner(banner.id)}
                                >
                                    {banner.active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </Button>
                                <Button
                                    variant="glass"
                                    size="icon"
                                    className="h-10 w-10 bg-black/60 border-none rounded-xl text-white hover:bg-red-500"
                                    onClick={() => {
                                        if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
                                            deleteBanner(banner.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-mono">ID: {banner.id}</span>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold",
                                    banner.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                )}>
                                    {banner.active ? "نشط" : "غير نشط"}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 border-dashed text-center">
                <p className="text-sm text-slate-400">ملاحظة: المقاس المفضل لصور العرض هو 1200x400 بكسل</p>
            </div>

            <AdminBannerForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
        </div>
    )
}
