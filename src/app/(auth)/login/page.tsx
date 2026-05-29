"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User, Phone, ArrowRight } from "lucide-react"
import { useStore } from "@/context/store-context"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { requestPasswordResetAction } from "@/app/actions/auth-actions"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { login, currentUser } = useStore()
    const { setTheme } = useTheme()
    const baseRole = (searchParams.get("role") as "admin" | "staff" | "customer") || "customer"
    const [loginType, setLoginType] = useState<"admin" | "staff" | "customer">(baseRole)
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    // Forgot Password State
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [recoveryPhone, setRecoveryPhone] = useState("")

    useEffect(() => {
        // Force reset theme to light on first visit to login to clear old dark caches
        try {
            const hasResetTheme = localStorage.getItem("ysg_theme_reset_v2");
            if (!hasResetTheme) {
                setTheme("light");
                localStorage.setItem("ysg_theme_reset_v2", "true");
            }
        } catch (e) {
            console.error("Theme storage reset failed:", e);
        }
    }, [setTheme]);

    useEffect(() => {
        if (currentUser) {
            router.push(currentUser.role === "admin" || currentUser.role === "staff" ? "/admin" : "/customer")
        }
    }, [currentUser, router])

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

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!recoveryPhone) return;

        // SA Phone Validation
        const phoneRegex = /^(05)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/;
        if (!phoneRegex.test(recoveryPhone)) {
            import("sonner").then(({ toast }) => toast.error("يرجى إدخال رقم جوال سعودي صحيح (يبدأ بـ 05 ويتكون من 10 أرقام)"));
            return;
        }

        setIsLoading(true)
        try {
            const result = await requestPasswordResetAction(recoveryPhone)
            if (!result.success) {
                const msg = result.error || "حدث خطأ، حاول مرة أخرى"
                import("sonner").then(({ toast }) => toast.error(msg))
            } else {
                const msg = "تم إرسال طلبك للإدارة، سيتم التواصل معك قريباً"
                import("sonner").then(({ toast }) => toast.success(msg))
                setShowForgotPassword(false)
                setRecoveryPhone("")
            }
        } catch (error) {
            console.error("Password Request Error:", error)
            import("sonner").then(({ toast }) => toast.error("حدث خطأ، حاول مرة أخرى"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-white/80 border border-slate-200/80 rounded-[2rem] shadow-xl text-slate-900 overflow-hidden">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-black tracking-tight">
                    {showForgotPassword 
                        ? 'استعادة كلمة المرور' 
                        : (loginType === 'admin' ? 'تسجيل دخول الإدارة' : loginType === 'staff' ? 'دخول الموظفين' : 'تسجيل دخول العملاء')}
                </CardTitle>
                <CardDescription className="text-slate-500">
                    {showForgotPassword 
                        ? 'أدخل رقم جوالك المسجل لإرسال طلب استعادة للإدارة' 
                        : 'الرجاء إدخال بيانات الدخول للمتابعة'}
                </CardDescription>

                {!showForgotPassword && baseRole === 'admin' && (
                    <div className="flex bg-slate-100 p-1 rounded-xl mt-4 max-w-[200px] mx-auto border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setLoginType("admin")}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${loginType === 'admin' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            مدير
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType("staff")}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${loginType === 'staff' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            موظف
                        </button>
                    </div>
                )}
            </CardHeader>
            <form onSubmit={showForgotPassword ? handleResetPassword : handleLogin}>
                <CardContent className="space-y-4">
                    <AnimatePresence mode="wait">
                        {showForgotPassword ? (
                            <motion.div
                                key="forgot-password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4 text-right"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="recoveryPhone" className="text-slate-700 font-bold">رقم الجوال</Label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="recoveryPhone"
                                            type="tel"
                                            placeholder="05xxxxxxxx"
                                            className="bg-slate-100/70 border-slate-200/80 pr-10 text-right text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/50 rounded-xl h-12"
                                            required
                                            value={recoveryPhone}
                                            onChange={(e) => setRecoveryPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1.5 mr-auto pt-1"
                                >
                                    العودة لتسجيل الدخول
                                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="login-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4 text-right"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-slate-700 font-bold">اسم المستخدم</Label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="username"
                                            placeholder="اسم المستخدم"
                                            className="bg-slate-100/70 border-slate-200/80 pr-10 text-right text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/50 rounded-xl h-12"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-slate-700 font-bold">كلمة المرور</Label>
                                    <div className="relative">
                                        <Lock className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="bg-slate-100/70 border-slate-200/80 pr-10 text-right text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/50 rounded-xl h-12"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    {loginType === 'customer' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex mr-auto pt-1"
                                        >
                                            نسيت كلمة المرور؟
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl" disabled={isLoading}>
                        {isLoading ? "جاري المعالجة..." : (showForgotPassword ? "إرسال طلب استعادة" : "دخول")}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-foreground text-center">جاري التحميل...</div>}>
            <LoginForm />
        </Suspense>
    )
}
