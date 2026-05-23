"use client"

import { useStore, Product } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { ArrowRight, History, Play, Timer, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { hapticFeedback } from "@/lib/haptics"

export default function ExpiredProductsPage() {
    const { products, updateProduct, deleteProduct } = useStore()

    // Filter products that have a discountEndDate in the past
    const expiredProducts = products.filter(p => {
        if (!p.discountEndDate) return false
        return new Date(p.discountEndDate) < new Date()
    })

    const handleRepublish = (product: Product, withNewTimer: boolean) => {
        const expires = withNewTimer
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : undefined

        updateProduct(product.id, {
            discountEndDate: expires
        })
        hapticFeedback('success')
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/products">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">العروض المنتهية</h1>
                <div className="bg-orange-500/10 text-orange-400 px-4 py-1.5 rounded-full border border-orange-500/20 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span className="text-xs font-bold">{expiredProducts.length} منتج</span>
                </div>
            </div>

            {expiredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4 glass-card">
                    <History className="w-12 h-12 opacity-20" />
                    <p className="font-bold">لا توجد عروض منتهية حالياً</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expiredProducts.map(product => (
                        <div key={product.id} className="glass-card group relative flex flex-col items-center p-4">
                            <div className="w-24 h-24 mb-4 relative">
                                <Image
                                    src={(product.images && product.images[0]) || "/placeholder.jpg"}
                                    alt={product.name}
                                    width={96}
                                    height={96}
                                    className="object-contain rounded-xl"
                                    unoptimized
                                />
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                    منتهي
                                </div>
                            </div>

                            <h3 className="font-bold text-white mb-1">{product.name}</h3>
                            <p className="text-xs text-slate-500 mb-4">{product.category}</p>

                            <div className="flex flex-col w-full gap-2">
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-10 rounded-xl"
                                    onClick={() => handleRepublish(product, true)}
                                >
                                    <Timer className="w-4 h-4" />
                                    <span className="text-xs">إعادة نشر (24 ساعة)</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-white/10 hover:bg-white/5 text-white gap-2 h-10 rounded-xl"
                                    onClick={() => handleRepublish(product, false)}
                                >
                                    <Play className="w-4 h-4" />
                                    <span className="text-xs">إعادة نشر (بدون عداد)</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-red-500 hover:bg-red-500/10 h-10 rounded-xl gap-2 mt-2"
                                    onClick={() => deleteProduct(product.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-xs">حذف نهائي</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
