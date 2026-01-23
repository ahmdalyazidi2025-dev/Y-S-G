"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { Database, Loader2 } from "lucide-react"
import { toast } from "sonner"
// import { Timestamp } from "firebase/firestore"

const TEST_CATEGORIES = [
    { nameAr: "زيوت ومحركات", nameEn: "Oils & Engines", id: "cat_oils" },
    { nameAr: "فلاتر", nameEn: "Filters", id: "cat_filters" },
    { nameAr: "بطاريات", nameEn: "Batteries", id: "cat_batteries" },
    { nameAr: "اكسسوارات", nameEn: "Accessories", id: "cat_acc" },
    { nameAr: "قطع غيار", nameEn: "Spare Parts", id: "cat_parts" }
]

const TEST_PRODUCTS = [
    // Oils
    { name: "زيت سوبر جي تي", price: 45, category: "زيوت ومحركات", barcode: "OIL001" },
    { name: "زيت تويوتا أصلي", price: 60, category: "زيوت ومحركات", barcode: "OIL002" },
    // Filters
    { name: "فلتر زيت هيلوكس", price: 25, category: "فلاتر", barcode: "FIL001" },
    { name: "فلتر هواء كامري", price: 35, category: "فلاتر", barcode: "FIL002" },
    // Batteries
    { name: "بطارية هانكوك 80", price: 350, category: "بطاريات", barcode: "BAT001" },
    { name: "بطارية باناسونيك", price: 400, category: "بطاريات", barcode: "BAT002" },
    // Accessories
    { name: "معطر سيارة", price: 15, category: "اكسسوارات", barcode: "ACC001" },
    { name: "ملمع طبلون", price: 20, category: "اكسسوارات", barcode: "ACC002" },
    // Parts
    { name: "فحمات فرامل أمامية", price: 120, category: "قطع غيار", barcode: "PRT001" },
    { name: "بواجي ليزر", price: 80, category: "قطع غيار", barcode: "PRT002" }
]

export function TestDataSeeder() {
    const { addProduct, addCategory, categories, products } = useStore()
    const [loading, setLoading] = useState(false)

    const handleSeed = async () => {
        if (!confirm("هل أنت متأكد من إضافة بيانات تجريبية؟ سيتم إضافة 5 أقسام و 10 منتجات.")) return

        setLoading(true)
        try {
            // 1. Add Categories if they don't exist
            let seededCats = 0
            for (const cat of TEST_CATEGORIES) {
                const exists = categories.find(c => c.nameAr === cat.nameAr)
                if (!exists) {
                    await addCategory({
                        nameAr: cat.nameAr,
                        nameEn: cat.nameEn,
                        image: `https://ui-avatars.com/api/?name=${cat.nameEn}&background=random`
                    })
                    seededCats++
                }
            }

            // 2. Add Products
            let seededProds = 0
            for (const prod of TEST_PRODUCTS) {
                // Check if barcode already exists to avoid duplicates
                const exists = products.find(p => p.barcode === prod.barcode)
                if (!exists) {
                    await addProduct({
                        name: prod.name,
                        price: prod.price,
                        pricePiece: prod.price,
                        unit: "حبة",
                        barcode: prod.barcode,
                        category: prod.category, // This will map by name, ensure your store context handles this or uses IDs. 
                        // Note: In a real app we might need the category ID, but StoreContext often filters by name string.
                        // Let's assume name string for now based on previous files.
                        image: `https://ui-avatars.com/api/?name=${prod.name}&background=random`,
                        discountEndDate: undefined
                    })
                    seededProds++
                }
            }

            toast.success(`تم إضافة ${seededCats} أقسام و ${seededProds} منتجات بنجاح`)
        } catch (e) {
            console.error(e)
            toast.error("حدث خطأ أثناء إضافة البيانات")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-[#1c2a36] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Database className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-white">بيانات الاختبار (QA)</h3>
                    <p className="text-xs text-slate-400">إنشاء 10 منتجات و 5 أقسام للاختبار</p>
                </div>
            </div>

            <Button
                onClick={handleSeed}
                disabled={loading}
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء الآن"}
            </Button>
        </div>
    )
}
