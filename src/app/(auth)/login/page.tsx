"use client"

import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Lock, User, ArrowRight, Eye, EyeOff, Phone } from "lucide-react"
import { useStore } from "@/context/store-context"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const baseRole = (searchParams.get("role") as "admin" | "staff" | "customer") || "customer"
    const [loginType, setLoginType] = useState<"admin" | "staff" | "customer">(baseRole)
    const [isLoading, setIsLoading] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [recoveryPhone, setRecoveryPhone] = useState("")
    const { login, requestPasswordReset } = useStore()

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
        if (recoveryPhone.length < 8) {
            alert("رقم الهاتف غير صحيح")
            setIsLoading(false)
            return
        }

        const success = await requestPasswordReset(recoveryPhone)
        if (success) {
            setShowForgotPassword(false)
        }
        setIsLoading(false)
    }

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Back Button */}
            <div className="absolute -top-16 right-0 z-20">
                <Link href="/">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted gap-2 rounded-full px-4">
                        <ArrowRight className="w-5 h-5" />
                        <span className="pb-1">الرئيسية</span>
                    </Button>
                </Link>
            </div>

            {/* Dynamic Background Elements */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />

            <Card className="glass-card border-border/50 text-foreground shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden">
                {/* Top highlight line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center shadow-inner mb-2">
                        <User className="w-8 h-8 text-primary drop-shadow-sm" />
                    </div>

                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tight text-foreground">
                            {loginType === 'admin' ? 'مدير النظام' : loginType === 'staff' ? 'دخول الموظفين' : 'مرحباً بك'}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            {loginType === 'customer' ? 'سجل دخولك للتسوق ومتابعة طلباتك' : 'لوحة التحكم والإدارة'}
                        </CardDescription>
                    </div>

                    {/* ONLY show role switcher if explicitly requested via URL (e.g. /login?role=admin) */}
                    {(baseRole === 'admin' || baseRole === 'staff') && (
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setLoginType("staff")}
                                className={`
                                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300
                                    ${loginType === 'staff'
                                        ? 'bg-primary/10 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.2)]'
                                        : 'bg-secondary/50 border-transparent hover:bg-secondary opacity-60 hover:opacity-100'}
                                `}
                            >
                                <div className={`p-2 rounded-full ${loginType === 'staff' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-bold ${loginType === 'staff' ? 'text-primary' : 'text-muted-foreground'}`}>موظف</span>
                                {loginType === 'staff' && (
                                    <motion.div layoutId="active-ring" className="absolute inset-0 border-2 border-primary rounded-2xl" transition={{ duration: 0.2 }} />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setLoginType("admin")}
                                className={`
                                    relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300
                                    ${loginType === 'admin'
                                        ? 'bg-primary/10 border-primary shadow-[0_0_30px_hsl(var(--primary)/0.2)]'
                                        : 'bg-secondary/50 border-transparent hover:bg-secondary opacity-60 hover:opacity-100'}
                                `}
                            >
                                <div className={`p-2 rounded-full ${loginType === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <span className={`text-xs font-bold ${loginType === 'admin' ? 'text-primary' : 'text-muted-foreground'}`}>مدير النظام</span>
                                {loginType === 'admin' && (
                                    <motion.div layoutId="active-ring" className="absolute inset-0 border-2 border-primary rounded-2xl" transition={{ duration: 0.2 }} />
                                )}
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
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-white">استعادة كلمة المرور</h3>
                                        <p className="text-[10px] text-white/80 leading-relaxed">
                                            أدخل رقم هاتفك المسجل، وسنقوم بإرسال طلب للإدارة للتواصل معك وتعيين كلمة مرور جديدة.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-white/80 mr-1">رقم الهاتف</Label>
                                        <Input
                                            type="tel"
                                            placeholder="05xxxxxxxx"
                                            className="bg-white/5 border-white/10 text-right h-12 rounded-xl focus:border-yellow-500/50 focus:ring-yellow-500/20 placeholder:text-white/50 font-medium text-white"
                                            value={recoveryPhone}
                                            onChange={(e) => setRecoveryPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-[0_4px_20px_rgba(234,179,8,0.2)] transition-all active:scale-[0.98]"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "جاري الإرسال..." : "إرسال طلب استعادة"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="w-full text-xs text-white/80 hover:text-white hover:bg-white/5 rounded-xl h-10"
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
                                        <Label htmlFor="username" className="text-xs text-muted-foreground mr-1">اسم المستخدم</Label>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                type="text"
                                                placeholder="username"
                                                className="bg-secondary/50 border-transparent h-14 rounded-xl pr-12 text-right dir-rtl relative z-10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 font-bold text-lg tracking-wide text-foreground shadow-inner"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="password" className="text-xs text-muted-foreground mr-1">كلمة المرور</Label>
                                        <div className="relative group">
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none z-20"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="bg-secondary/50 border-transparent h-14 rounded-xl pr-12 text-right text-foreground relative z-10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 font-bold text-lg tracking-widest shadow-inner"
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
                                                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-semibold"
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

            <p className="text-center text-[10px] text-muted-foreground mt-6 font-mono opacity-50">
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
