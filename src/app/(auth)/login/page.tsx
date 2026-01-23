"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User } from "lucide-react"
import { useStore } from "@/context/store-context"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login } = useStore()
    const baseRole = (searchParams.get("role") as "admin" | "staff" | "customer") || "customer"
    const [loginType, setLoginType] = useState<"admin" | "staff" | "customer">(baseRole)
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const success = await login(username, password, loginType)

        if (success) {
            if (loginType === "admin" || loginType === "staff") {
                router.push("/admin")
            } else {
                router.push("/customer")
            }
        }
        setIsLoading(false)
    }

    return (
        <Card className="glass-card border-none text-white">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">
                    {loginType === 'admin' ? 'تسجيل دخول الإدارة' : loginType === 'staff' ? 'دخول الموظفين' : 'تسجيل دخول العملاء'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                    الرجاء إدخال بيانات الدخول للمتابعة
                </CardDescription>

                {baseRole === 'admin' && (
                    <div className="flex bg-white/5 p-1 rounded-xl mt-6 border border-white/5">
                        <button
                            type="button"
                            onClick={() => setLoginType("admin")}
                            className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all ${loginType === 'admin' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            مدير النظام
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType("staff")}
                            className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all ${loginType === 'staff' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            موظف
                        </button>
                    </div>
                )}
            </CardHeader>
            <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">اسم المستخدم</Label>
                        <div className="relative">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="username"
                                className="bg-black/20 border-white/10 h-12 rounded-xl pr-12 text-right dir-rtl"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="bg-black/20 border-white/10 pr-10 text-right text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold" disabled={isLoading}>
                        {isLoading ? "جاري الدخول..." : "دخول"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-white text-center">جاري التحميل...</div>}>
            <LoginForm />
        </Suspense>
    )
}
