"use client"

import { useState } from "react"
import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, User, Phone, Lock, Save, ShieldCheck, Mail, Calendar, Wallet, Clock, Gift, Copy, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"

export default function ProfilePage() {
    const { currentUser, updateCustomer, orders } = useStore()
    const [phone, setPhone] = useState(currentUser?.phone || "")
    const [email, setEmail] = useState(currentUser?.email && !currentUser.email.endsWith("@ysg.local") ? currentUser.email : "")
    const [password, setPassword] = useState(currentUser?.password || "")
    const [isLoading, setIsLoading] = useState(false)

    if (!currentUser) return null

    const handleSave = async () => {
        if (!phone || !password) {
            toast.error("يرجى ملء جميع الحقول")
            return
        }

        setIsLoading(true)
        try {
            await updateCustomer(currentUser.id, {
                phone,
                email: email || `${currentUser.username}@ysg.local`, // Fallback if cleared
                password
            })
            toast.success("تم تحديث البيانات بنجاح")
            hapticFeedback('success')
        } catch {
            toast.error("حدث خطأ أثناء التحديث")
            hapticFeedback('error')
        } finally {
            setIsLoading(false)
        }
    }

    const totalSpent = orders
        .filter(o => o.customerId === currentUser.id && o.status !== 'canceled')
        .reduce((sum, o) => sum + o.total, 0)

    const orderCount = orders.filter(o => o.customerId === currentUser.id).length

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/customer">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                        <ArrowRight className="w-5 h-5 text-foreground rotate-180" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-white">الملف الشخصي</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">My Profile</p>
                </div>
            </div>

            {/* Referral Card */}
            {currentUser.referralCode && (
                <div className="glass-card p-6 relative overflow-hidden group mb-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                                <Gift className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">ادعُ أصدقاءك</h3>
                                <p className="text-xs text-slate-400">شارك الكود الخاص بك واكسب معنا</p>
                            </div>
                        </div>

                        <div className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 mb-1">كود الدعوة الخاص بك</span>
                                <code className="font-mono text-2xl font-black text-purple-400 tracking-widest">
                                    {currentUser.referralCode}
                                </code>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white transition-all"
                                onClick={() => {
                                    navigator.clipboard.writeText(currentUser.referralCode || "")
                                    toast.success("تم نسخ الكود")
                                    hapticFeedback('success')
                                }}
                            >
                                <Copy className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span>عدد من قمت بدعوتهم: </span>
                            <span className="font-bold text-white">{currentUser.referralCount || 0}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5 bg-primary/5 border-primary/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-slate-400 font-bold">مجموع المشتريات</span>
                    </div>
                    <p className="text-xl font-black text-white">{totalSpent.toLocaleString()} ر.س</p>
                </div>
                <div className="glass-card p-5 bg-blue-500/5 border-blue-500/10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-slate-400 font-bold">عدد الطلبات</span>
                    </div>
                    <p className="text-xl font-black text-white">{orderCount} طلب</p>
                </div>
            </div>

            <Link href="/customer/invoices">
                <div className="glass-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all bg-white/5 hover:bg-white/10 border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">طلباتي السابقة</h3>
                            <p className="text-xs text-slate-400">تتبع طلباتك أو أعد الطلب بسهولة</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors rtl:rotate-180" />
                </div>
            </Link>

            {/* Edit Form */}
            <div className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-primary/20">
                        {currentUser.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">{currentUser.name}</h2>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full w-fit mt-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>حساب موثوق</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold pr-1">اسم المستخدم</label>
                        <div className="relative opacity-60">
                            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                value={currentUser.name}
                                readOnly
                                className="bg-black/20 border-white/5 text-slate-400 pr-10 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-[10px] text-red-400/60 pr-1">* لا يمكن تغيير اسم المستخدم</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold pr-1">رقم الجوال</label>
                        <div className="relative">
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="bg-black/20 border-white/10 pr-10 focus:border-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold pr-1">كلمة المرور</label>
                        <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black/20 border-white/10 pr-10 focus:border-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-bold pr-1">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@domain.com"
                                className="bg-black/20 border-white/10 pr-10 focus:border-primary/50"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 pr-1">يستخدم لاستعادة كلمة المرور</p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl gap-2 mt-4"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>حفظ التغييرات</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
