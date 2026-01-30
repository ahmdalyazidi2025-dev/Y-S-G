"use client"

import { useState } from "react"
import { useStore, Product } from "@/context/store-context"
import { motion, AnimatePresence } from "framer-motion"
import {
    Tag, Timer, FileEdit, Archive, CheckCircle2,
    AlertCircle, ArrowRight, PlayCircle, StopCircle,
    Calendar, Sparkles, Filter, Package
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminProductForm } from "@/components/admin/product-form"
import { formatDistanceToNow } from "date-fns"
import { arSA } from "date-fns/locale"

// Helper for countdown display
function CountdownTimer({ date }: { date: Date }) {
    const now = new Date()
    const diff = new Date(date).getTime() - now.getTime()

    if (diff <= 0) return <span className="text-red-400">منتهي</span>

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return (
        <span className="font-mono font-bold text-amber-400">
            {days} يوم : {hours} ساعة
        </span>
    )
}

export default function OffersPage() {
    const { products, updateProduct } = useStore()
    const [activeTab, setActiveTab] = useState<"active" | "expired" | "drafts">("active")
    const [searchQuery, setSearchQuery] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // --- Actions ---
    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setIsFormOpen(true)
    }

    // --- Logic & Filtering ---
    const allOffers = products.filter(p => {
        // Search Filter
        const normalize = (s: string) => s.toLowerCase().replace(/[-\s]/g, "")
        const normalizedQuery = normalize(searchQuery)
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            normalize(p.barcode || "").includes(normalizedQuery);

        return matchesSearch
    })

    const activeOffers = allOffers.filter(p => !p.isDraft && p.discountEndDate && new Date(p.discountEndDate) > new Date())
    const expiredOffers = allOffers.filter(p => !p.isDraft && p.discountEndDate && new Date(p.discountEndDate) <= new Date())
    const drafts = allOffers.filter(p => p.isDraft)

    // --- Actions ---
    const handlePublish = async (id: string) => {
        if (confirm("هل أنت متأكد من نشر هذا المنتج؟ سيظهر للعملاء الآن.")) {
            // Remove isDraft flag
            await updateProduct(id, { isDraft: false })
        }
    }

    const handleStopOffer = async (id: string) => {
        if (confirm("هل تريد إيقاف هذا العرض؟ سيعود السعر للسعر الأصلي.")) {
            // Remove discount date and revert prices if needed 
            // (Here we just remove the date so it stops being an "Offer")
            await updateProduct(id, { discountEndDate: null as any })
        }
    }

    // --- Enhanced UI Components ---
    const StatCard = ({ title, count, icon: Icon, color, active }: any) => (
        <div
            onClick={() => setActiveTab(active)}
            className={cn(
                "cursor-pointer relative overflow-hidden p-6 rounded-3xl border transition-all duration-300",
                activeTab === active
                    ? `bg-${color}-500/10 border-${color}-500/50 shadow-lg shadow-${color}-500/10`
                    : "bg-white/5 border-white/5 hover:bg-white/10"
            )}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", `bg-${color}-500/10 text-${color}-400`)}>
                    <Icon className="w-6 h-6" />
                </div>
                {activeTab === active && (
                    <motion.div layoutId="active-dot" className={cn("w-2 h-2 rounded-full", `bg-${color}-400`)} />
                )}
            </div>
            <h3 className="text-3xl font-black text-white mb-1">{count}</h3>
            <p className="text-sm text-slate-400 font-bold">{title}</p>
        </div>
    )

    return (
        <div className="space-y-8 min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                            <ArrowRight className="w-6 h-6 text-white" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
                            مركز العروض
                        </h1>
                        <p className="text-slate-400 font-medium mt-1">إدارة الحملات الترويجية والمسودات</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <input
                        className="w-full h-12 bg-black/20 border border-white/10 rounded-2xl pr-10 pl-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 transition-all font-medium"
                        placeholder="ابحث عن عرض بالاسم أو الباركود..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="عروض نشطة"
                    count={activeOffers.length}
                    icon={Sparkles}
                    color="amber"
                    active="active"
                />
                <StatCard
                    title="عروض منتهية"
                    count={expiredOffers.length}
                    icon={Timer}
                    color="red"
                    active="expired"
                />
                <StatCard
                    title="مسودات"
                    count={drafts.length}
                    icon={FileEdit}
                    color="blue"
                    active="drafts"
                />
            </div>

            {/* Content Area */}
            <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-6 min-h-[500px]">
                <AnimatePresence mode="wait">
                    {/* ACTIVE OFFERS TAB */}
                    {activeTab === "active" && (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-6 text-amber-400">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                                <h2 className="text-xl font-bold">العروض الجارية حالياً</h2>
                            </div>

                            {activeOffers.length === 0 ? (
                                <EmptyState
                                    icon={Tag}
                                    title="لا توجد عروض نشطة"
                                    desc="قم بإنشاء خصومات على المنتجات لجذب المزيد من المبيعات."
                                />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {activeOffers.map(product => (
                                        <div key={product.id} className="group relative bg-white/5 border border-white/5 hover:border-amber-500/30 rounded-3xl p-4 flex gap-4 transition-all hover:bg-white/10">
                                            {/* Timer Badge */}
                                            <div className="absolute top-4 left-4 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 flex items-center gap-2">
                                                <Timer className="w-3 h-3 text-amber-400" />
                                                <span className="text-xs font-bold text-amber-300">
                                                    <CountdownTimer date={product.discountEndDate!} />
                                                </span>
                                            </div>

                                            <div className="w-24 h-24 bg-black/20 rounded-2xl relative overflow-hidden shrink-0">
                                                {product.image ? (
                                                    <Image src={product.image} fill alt={product.name} className="object-cover" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                                            </div>

                                            <div className="flex-1 pt-1">
                                                <h3 className="font-bold text-white text-lg mb-1">{product.name}</h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                                                    <span className="line-through">{product.oldPricePiece} ر.س</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                    <span className="text-amber-400 font-bold text-lg">{product.pricePiece} ر.س</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(product)}
                                                        className="h-8 border-slate-700 hover:bg-slate-800 text-slate-300"
                                                    >
                                                        <FileEdit className="w-3 h-3 ml-2" /> تعديل
                                                    </Button>
                                                    <Link href={`/admin/products?search=${product.barcode || product.name}`} target="_blank">
                                                        <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-400 hover:text-white">
                                                            <Package className="w-4 h-4 ml-1" />
                                                            <ArrowRight className="w-3 h-3 -rotate-45" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 ml-auto"
                                                        onClick={() => handleStopOffer(product.id)}
                                                    >
                                                        <StopCircle className="w-3 h-3 ml-2" /> إيقاف
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* EXPIRED OFFERS TAB */}
                    {activeTab === "expired" && (
                        <motion.div
                            key="expired"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-6 text-red-400">
                                <Timer className="w-5 h-5" />
                                <h2 className="text-xl font-bold">عروض انتهت مدتها</h2>
                            </div>

                            {expiredOffers.length === 0 ? (
                                <EmptyState
                                    icon={CheckCircle2}
                                    title="لا توجد عروض منتهية"
                                    desc="جميع العروض نشطة حالياً."
                                />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {expiredOffers.map(product => (
                                        <div key={product.id} className="opacity-70 hover:opacity-100 transition-opacity bg-white/5 border border-white/5 rounded-3xl p-4 flex gap-4">
                                            <div className="w-20 h-20 bg-black/20 rounded-2xl relative overflow-hidden shrink-0 grayscale">
                                                {product.image ? (
                                                    <Image src={product.image} fill alt={product.name} className="object-cover" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-300 mb-1">{product.name}</h3>
                                                <p className="text-xs text-red-400 font-bold mb-3">
                                                    انتهى {product.discountEndDate ? formatDistanceToNow(new Date(product.discountEndDate), { addSuffix: true, locale: arSA }) : ''}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 w-full bg-white/10 hover:bg-white/20"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <PlayCircle className="w-3 h-3 ml-2" /> تجديد العرض
                                                    </Button>
                                                    <Link href={`/admin/products?search=${product.barcode || product.name}`} target="_blank">
                                                        <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-400 hover:text-white">
                                                            <Package className="w-4 h-4 ml-1" />
                                                            <ArrowRight className="w-3 h-3 -rotate-45" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* DRAFTS TAB */}
                    {activeTab === "drafts" && (
                        <motion.div
                            key="drafts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-6 text-blue-400">
                                <FileEdit className="w-5 h-5" />
                                <h2 className="text-xl font-bold">مسودات قيد العمل</h2>
                            </div>

                            {drafts.length === 0 ? (
                                <EmptyState
                                    icon={FileEdit}
                                    title="لا توجد مسودات"
                                    desc="ابدأ بإضافة منتجات جديدة وحفظها كمسودة لإكمالها لاحقاً."
                                />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {drafts.map(product => (
                                        <div key={product.id} className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-4 flex gap-4 hover:bg-blue-500/10 transition-colors">
                                            <div className="w-24 h-24 bg-black/20 rounded-2xl relative overflow-hidden shrink-0 border border-white/5">
                                                {product.image ? (
                                                    <Image src={product.image} fill alt={product.name} className="object-cover" />
                                                ) : <div className="w-full h-full flex items-center justify-center text-2xl">📝</div>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-white text-lg">{product.name || "منتج بدون اسم"}</h3>
                                                    <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-1 rounded-full font-bold">مسودة</span>
                                                </div>
                                                <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                                                    {product.notes || "لا توجد ملاحظات.."}
                                                </p>
                                                <div className="mt-4 flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                                        onClick={() => handlePublish(product.id)}
                                                    >
                                                        <CheckCircle2 className="w-3 h-3 ml-2" /> نشر الآن
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(product)}
                                                        className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-white/10"
                                                    >
                                                        <FileEdit className="w-4 h-4" />
                                                    </Button>
                                                    <Link href={`/admin/products?search=${product.barcode || product.name}`} target="_blank">
                                                        <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-400 hover:text-white">
                                                            <Package className="w-4 h-4 ml-1" />
                                                            <ArrowRight className="w-3 h-3 -rotate-45" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AdminProductForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialProduct={editingProduct}
            />
        </div>
    )
}

function EmptyState({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-500 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-500 max-w-sm mx-auto">{desc}</p>
        </div>
    )
}
