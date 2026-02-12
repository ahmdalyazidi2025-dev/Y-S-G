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

                {expiredProducts.length > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl px-4 h-10 text-xs"
                            onClick={() => {
                                if (confirm("هل أنت متأكد من حذف جميع العروض المنتهية؟")) {
                                    expiredProducts.forEach(p => deleteProduct(p.id))
                                    hapticFeedback('warning')
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف الكل
                        </Button>
                        <Button
                            variant="outline"
                            className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl px-4 h-10 text-xs"
                            onClick={() => {
                                expiredProducts.forEach(p => handleRepublish(p, true))
                                hapticFeedback('success')
                            }}
                        >
                            <Timer className="w-4 h-4 ml-2" />
                            تجديد الكل
                        </Button>
                    </div>
                )}

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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {expiredProducts.map(product => (
                        <div key={product.id} className="glass-card group relative flex flex-col p-3 border-white/5 hover:border-white/20 transition-all">
                            <div className="aspect-square mb-3 relative rounded-xl overflow-hidden bg-black/40">
                                <Image
                                    src={(product.images && product.images[0]) || "/placeholder.jpg"}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-2 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                                    unoptimized
                                />
                                <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                                    منتهي
                                </div>
                            </div>

                            <div className="space-y-1 mb-4">
                                <h3 className="font-bold text-foreground text-xs line-clamp-1">{product.name}</h3>
                                <p className="text-[10px] text-slate-500">{product.category}</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Button
                                    className="w-full bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/20 h-8 rounded-lg text-[10px] gap-1.5"
                                    onClick={() => handleRepublish(product, true)}
                                >
                                    <Timer className="w-3 h-3" />
                                    <span>تجديد (24س)</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-red-400 hover:bg-red-500/10 h-8 rounded-lg text-[10px] gap-1.5"
                                    onClick={() => {
                                        if (confirm("حذف هذا العرض؟")) {
                                            deleteProduct(product.id)
                                            hapticFeedback('light')
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                    <span>حذف</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
