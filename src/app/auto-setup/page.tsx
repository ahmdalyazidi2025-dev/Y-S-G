"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { doc, setDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ShieldAlert, CheckCircle2 } from "lucide-react"

export default function AutoSetupPage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        return onAuthStateChanged(auth, (u) => setUser(u))
    }, [])

    const makeMeAdmin = async () => {
        if (!user) return
        setLoading(true)
        try {
            // Write to 'users' collection with Admin role
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                email: user.email,
                username: user.email, // Fallback username
                role: "admin",
                permissions: ["all"],
                createdAt: new Date(),
                name: user.displayName || "Admin User"
            }, { merge: true })

            toast.success("تم ترقية الحساب بنجاح! أنت الآن المدير.")

            // Redirect to admin panel after 2 seconds
            setTimeout(() => {
                window.location.href = "/admin"
            }, 2000)
        } catch (e: any) {
            console.error(e)
            toast.error("حدث خطأ: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#080b12] text-white">
                <ShieldAlert className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">يجب تسجيل الدخول أولاً</h1>
                <p className="text-slate-400 mb-6 text-center">سجل دخولك بالحساب الذي تريد جعله مديراً، ثم عد لهذه الصفحة.</p>
                <Button onClick={() => router.push("/login")}>الذهاب لصفحة الدخول</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#080b12] text-white">
            <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-white/10 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold mb-2">تفعيل حساب المدير</h1>
                    <p className="text-slate-400 text-sm">
                        أنت مسجل دخول بـ: <span className="text-primary font-mono">{user.email}</span>
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                        اضغط الزر أدناه لجعل هذا الحساب "مديراً عاماً" فوراً.
                    </p>
                </div>

                <Button
                    onClick={makeMeAdmin}
                    disabled={loading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                    {loading ? "جاري التفعيل..." : "جعلي مديراً الآن (Make Admin)"}
                </Button>
            </div>
        </div>
    )
}
