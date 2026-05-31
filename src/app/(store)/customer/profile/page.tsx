"use client"

import { useStore } from "@/context/store-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ProfileHeader } from "@/components/store/profile/profile-header"
import { ProfileStats } from "@/components/store/profile/profile-stats"
import { ProfileInfoForm } from "@/components/store/profile/profile-info-form"
import { motion } from "framer-motion"

export default function CustomerProfilePage() {
    const { currentUser, orders, loading } = useStore()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/")
        }
    }, [currentUser, loading, router])

    if (loading || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20 pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
            <ProfileHeader currentUser={currentUser} />

            <div className="grid gap-8">
                <ProfileStats currentUser={currentUser} orders={orders} />

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <ProfileInfoForm currentUser={currentUser} />

                        {/* Other potential widgets like "Recent Activity" could go here */}
                    </div>

                    <div className="space-y-6">
                        {/* Invite Friends Widget */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="p-6 rounded-[2rem] border relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-500/10 dark:via-white/5 dark:to-white/5 border-emerald-500/20 shadow-md shadow-emerald-500/[0.03]"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl transition-colors -mr-8 -mt-8 group-hover:bg-emerald-500/20" />
                            
                            <h3 className="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                🤝 شارك المتجر مع أصدقائك
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                هل لديك أصدقاء يمتلكون محلات صيانة سيارات؟ أدعهم للتسجيل والإنضمام لمتجرنا لتسهيل الطلب ومتابعة الفواتير!
                            </p>
                            
                            <button 
                                onClick={() => {
                                    const { storeSettings } = useStore()
                                    const baseTemplate = storeSettings?.whatsappTemplates?.inviteFriend || 
                                        "مرحباً بك يا صديقي! أدعوك للتسجيل والإنضمام إلى متجرنا المميز لجميع مستلزمات قطع غيار ومستلزمات السيارات! 🚗✨\n\nخطوات الإنضمام سهلة جداً وبسيطة:\n1. اضغط على رابط طلب الانضمام التالي:\n{url}\n2. اضغط على زر 'تقديم طلب انضمام كعميل جديد'.\n3. املأ بياناتك (الاسم، الجوال، اسم المستخدم المطلوب).\n4. بعد الإرسال، ستقوم الإدارة بمراجعة حسابك وتفعيله فوراً لتستمتع بأفضل الأسعار والعروض الحصرية! 🎁\n\nأرسلها لك صديقك: {name} 🤝";
                                    
                                    const domain = window.location.origin
                                    const messageText = baseTemplate
                                        .replace(/{name}/g, currentUser.name)
                                        .replace(/{url}/g, domain);
                                    
                                    const waUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
                                    window.open(waUrl, "_blank");
                                }}
                                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all duration-300 shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                            >
                                إرسال دعوة انضمام عبر الواتساب
                            </button>
                        </motion.div>

                        {/* Sidebar / Extra Widgets Area */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="glass-card p-6 rounded-3xl border border-border/50 sticky top-24"
                        >
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">أمن الحساب</h3>
                            <button className="w-full py-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors mb-2 text-slate-800 dark:text-white">
                                تغيير كلمة المرور
                            </button>
                            <button className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-colors border border-red-500/20">
                                حذف الحساب
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
