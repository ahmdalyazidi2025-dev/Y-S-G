"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Trash2, Image as ImageIcon, Eye, EyeOff, Edit, Monitor, Smartphone, Sparkles } from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"
import { useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"
import { getFontClass } from "@/lib/fonts"
import { AdminBannerForm } from "@/components/admin/banner-form"
import { HeroBanner } from "@/components/store/hero-banner"

export default function AdminBannersPage() {
    const { banners, deleteBanner, toggleBanner } = useStore()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingBanner, setEditingBanner] = useState<any>(null)
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">صور العرض واللافتات</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4 cursor-pointer"
                    onClick={() => {
                        setEditingBanner(null)
                        setIsFormOpen(true)
                    }}
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة صورة عرض</span>
                </Button>
            </div>

            {/* Live Client Slideshow Mockup Preview Frame */}
            {banners.filter(b => b.active).length > 0 && (
                <div className="glass-card p-5 sm:p-6 rounded-[32px] border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 text-right">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                                <span>المعاينة التفاعلية المباشرة للعميل</span>
                            </h2>
                            <p className="text-xs text-slate-400">شاهد كيف يظهر شريط العروض تلقائياً لعملائك</p>
                        </div>
                        
                        <div className="flex gap-1 bg-black/35 p-1 rounded-xl border border-white/5 w-fit mr-auto sm:mr-0 ml-0">
                            <Button
                                size="sm"
                                variant={previewDevice === "desktop" ? "default" : "ghost"}
                                className="h-8 text-xs rounded-lg gap-1.5 cursor-pointer"
                                onClick={() => setPreviewDevice("desktop")}
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                <span>شاشة كمبيوتر</span>
                            </Button>
                            <Button
                                size="sm"
                                variant={previewDevice === "mobile" ? "default" : "ghost"}
                                className="h-8 text-xs rounded-lg gap-1.5 cursor-pointer"
                                onClick={() => setPreviewDevice("mobile")}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>شاشة هاتف</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-center items-center bg-black/40 p-3 sm:p-4 rounded-[24px] border border-white/5 overflow-hidden transition-all duration-300">
                        <div 
                            className={cn(
                                "transition-all duration-500 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10",
                                previewDevice === "desktop" 
                                    ? "w-full max-w-4xl aspect-[2.8/1] sm:aspect-[3/1]" 
                                    : "w-[300px] h-[155px] sm:w-[340px] sm:h-[160px]"
                            )}
                        >
                            <HeroBanner />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {banners.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        لا توجد صور عرض مسجلة
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className="glass-card overflow-hidden group relative border border-white/5 rounded-[24px]">
                            <div className="aspect-[3/1] bg-black/40 overflow-hidden relative">
                                <NextImage
                                    src={banner.image}
                                    alt="banner"
                                    width={1200}
                                    height={400}
                                    className={cn("w-full h-full object-cover transition-opacity", !banner.active && "opacity-40")}
                                />
                                
                                {/* Custom text overlay in Admin List */}
                                {banner.title && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                        <div className="absolute inset-0 flex flex-col justify-end pb-6 px-6 text-right">
                                            <h3 
                                                className={cn("text-xs sm:text-2xl font-black leading-tight mb-1", getFontClass(banner.fontFamily))}
                                                style={{ color: banner.textColor || "#ffffff", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
                                            >
                                                {banner.title}
                                            </h3>
                                            {banner.description && (
                                                <p 
                                                    className={cn("text-[9px] sm:text-xs font-medium opacity-90 line-clamp-1", getFontClass(banner.fontFamily))}
                                                    style={{ color: banner.textColor || "rgb(226, 232, 240)", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                                                >
                                                    {banner.description}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Permanently Visible & Beautiful Colored Buttons (Blue/Red/Yellow) */}
                            <div className="absolute top-4 right-4 flex gap-2 z-20">
                                <Button
                                    variant="glass"
                                    size="icon"
                                    className="h-10 w-10 bg-blue-600/90 text-white hover:bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer border border-white/10"
                                    title={banner.active ? "إخفاء العرض" : "عرض اللافتة"}
                                    onClick={() => toggleBanner(banner.id)}
                                >
                                    {banner.active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </Button>
                                <Button
                                    variant="glass"
                                    size="icon"
                                    className="h-10 w-10 bg-yellow-500/90 text-white hover:bg-yellow-500 rounded-xl shadow-lg shadow-yellow-500/20 transition-all cursor-pointer border border-white/10"
                                    title="تعديل تفاصيل العرض"
                                    onClick={() => {
                                        setEditingBanner(banner)
                                        setIsFormOpen(true)
                                    }}
                                >
                                    <Edit className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="glass"
                                    size="icon"
                                    className="h-10 w-10 bg-red-600/90 text-white hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer border border-white/10"
                                    title="حذف البانر نهائياً"
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
                                <span className="text-[10px] text-slate-450 font-mono">ID: {banner.id}</span>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-bold shadow-md",
                                    banner.active ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
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

            <AdminBannerForm 
                isOpen={isFormOpen} 
                onClose={() => {
                    setIsFormOpen(false)
                    setEditingBanner(null)
                }} 
                initialBanner={editingBanner}
            />
        </div>
    )
}
