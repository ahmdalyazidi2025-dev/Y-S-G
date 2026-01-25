"use client"

import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    const baseRole = (searchParams.get("role") as "admin" | "staff" | "customer") || "customer"
    const [loginType, setLoginType] = useState<"admin" | "staff" | "customer">(baseRole)
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [recoveryEmail, setRecoveryEmail] = useState("")
    const { login, resetPassword } = useStore() // Use resetPassword from store

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
        setIsLoading(true)
        if (!recoveryEmail.includes('@')) {
            alert("بريد غير صالح") // Simple validation
            setIsLoading(false)
            return
        }

        await resetPassword(recoveryEmail)
        setShowForgotPassword(false)
        setIsLoading(false)
    }

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Dynamic Background Elements */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />

            <Card className="glass-card border-white/10 text-white shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden">
                {/* Top highlight line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-inner mb-2">
                        <User className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>

                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tight text-white">
                            {loginType === 'admin' ? 'مدير النظام' : loginType === 'staff' ? 'دخول الموظفين' : 'مرحباً بك'}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium">
                            {loginType === 'customer' ? 'سجل دخولك للتسوق ومتابعة طلباتك' : 'لوحة التحكم والإدارة'}
                        </CardDescription>
                    </div>

                    {baseRole === 'admin' && (
                        <div className="flex bg-black/30 p-1 rounded-xl mt-6 border border-white/5 relative overflow-hidden">
                            <motion.div
                                className="absolute top-1 bottom-1 bg-primary rounded-lg shadow-lg z-0"
                                initial={false}
                                animate={{
                                    left: loginType === 'staff' ? '4px' : '50%',
                                    right: loginType === 'staff' ? '50%' : '4px',
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <button
                                type="button"
                                onClick={() => setLoginType("staff")}
                                className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg relative z-10 transition-colors ${loginType === 'staff' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                موظف
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType("admin")}
                                className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg relative z-10 transition-colors ${loginType === 'admin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                مدير النظام
                            </button>
                        </div>
                    )}
                </CardHeader>

                <form onSubmit={showForgotPassword ? handleResetPassword : handleLogin}>
                    <CardContent className="space-y-6 pt-6">
                        <AnimatePresence mode="wait">
                            {showForgotPassword ? (
                                <motion.div
                                    key="forgot-password"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center space-y-2 p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto text-yellow-500 mb-2">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-white">استعادة كلمة المرور</h3>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            لا تقلق، أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-400 mr-1">البريد الإلكتروني</Label>
                                        <Input
                                            type="email"
                                            placeholder="example@domain.com"
                                            className="bg-black/40 border-white/10 text-right h-12 rounded-xl focus:border-yellow-500/50 focus:ring-yellow-500/20 placeholder:text-slate-600 font-medium"
                                            value={recoveryEmail}
                                            onChange={(e) => setRecoveryEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-[0_4px_20px_rgba(234,179,8,0.2)] transition-all active:scale-[0.98]"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-xl h-10"
                                            onClick={() => setShowForgotPassword(false)}
                                        >
                                            العودة لتسجيل الدخول
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="login-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-xs text-slate-400 mr-1">اسم المستخدم</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                type="text"
                                                placeholder="username"
                                                className="bg-black/40 border-white/10 h-14 rounded-xl pr-12 text-right dir-rtl relative z-10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-slate-600 font-bold text-lg tracking-wide"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="password" className="text-xs text-slate-400 mr-1">كلمة المرور</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="bg-black/40 border-white/10 h-14 rounded-xl pr-12 text-right text-white relative z-10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-slate-600 font-bold text-lg tracking-widest"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                        {loginType === 'customer' && (
                                            <div className="mt-2 text-left">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotPassword(true)}
                                                    className="text-[11px] text-slate-400 hover:text-white transition-colors"
                                                >
                                                    نسيت كلمة المرور؟
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full h-14 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-black text-lg rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] mt-4"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>جاري التحقق...</span>
                                            </div>
                                        ) : "دخول"}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </form>
            </Card>

            <p className="text-center text-[10px] text-slate-500 mt-6 font-mono opacity-50">
                SECURE ACCESS • ENCRYPTED CONNECTION
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-white text-center">جاري التحميل...</div>}>
            <LoginForm />
        </Suspense>
    )
}
