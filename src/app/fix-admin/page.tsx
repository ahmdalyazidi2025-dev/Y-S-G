"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/context/store-context"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ShieldCheck, Loader2 } from "lucide-react"

export default function FixAdminPage() {
    const { currentUser, logout } = useStore()
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleFix = async () => {
        if (!currentUser) {
            toast.error("يجب تسجيل الدخول أولاً")
            return
        }

        setLoading(true)
        try {
            // Force update the current user document to be Super Admin
            const userRef = doc(db, "users", currentUser.id)
            await updateDoc(userRef, {
                role: "admin",
                permissions: ["all"] // The magic permission we added support for
            })

            // Also update staff collection if present there
            try {
                const staffRef = doc(db, "staff", currentUser.id)
                await updateDoc(staffRef, {
                    role: "admin",
                    permissions: ["all"]
                })
            } catch (e) {
                // Ignore if not in staff
            }

            toast.success("تم إصلاح الصلاحيات بنجاح! 🚀")

            // Force logout to refresh everything clean
            setTimeout(async () => {
                await logout()
                window.location.href = "/login?role=admin"
            }, 1500)

        } catch (error: any) {
            console.error(error)
            toast.error("حدث خطأ: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full glass-card p-8 border border-white/10 rounded-3xl space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
                    <ShieldCheck className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">إصلاح صلاحيات المدير</h1>
                    <p className="text-slate-400">
                        سيقوم هذا الزر بإعادة تعيين حسابك الحالي ({currentUser?.username || "غير متصل"}) ليصبح "مدير عام" بصلاحيات كاملة.
                    </p>
                </div>

                <Button
                    onClick={handleFix}
                    disabled={loading || !currentUser}
                    className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 rounded-xl"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            جاري الإصلاح...
                        </>
                    ) : (
                        "بدء الإصلاح فوراً 🚀"
                    )}
                </Button>

                {!currentUser && (
                    <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                        تنبيه: يجب عليك تسجيل الدخول بحسابك القديم أولاً حتى لو كانت القوائم مختفية!
                    </p>
                )}
            </div>
        </div>
    )
}
