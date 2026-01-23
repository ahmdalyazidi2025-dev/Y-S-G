"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useStore } from "@/context/store-context"
import { useRouter } from "next/navigation"

export default function SetupPage() {
    const { addStaff } = useStore()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await addStaff({
                name,
                email,
                role: "admin",
                permissions: ["all"],
                password // Pass the password to be used for auth creation
            } as any)
            toast.success("تم إنشاء حساب المدير بنجاح! جاري التوجيه للدخول...")
            setTimeout(() => router.push("/login?role=admin"), 2000)
        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ أثناء الإنشاء")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#080b12] p-4">
            <Card className="max-w-md w-full glass-card text-white border-white/10">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">إعداد حساب المدير</CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        لأمان النظام، لا يوجد حساب افتراضي. قم بإنشاء حسابك الآن.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSetup} className="space-y-4">
                        <div className="space-y-2">
                            <Label>الاسم الكامل</Label>
                            <Input
                                className="bg-black/20 text-right border-white/10"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>البريد الإلكتروني</Label>
                            <Input
                                type="email"
                                className="bg-black/20 text-right border-white/10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>كلمة المرور</Label>
                            <Input
                                type="password"
                                className="bg-black/20 text-right border-white/10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full font-bold" disabled={loading}>
                            {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
