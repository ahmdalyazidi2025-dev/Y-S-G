"use client"

import { useStore } from "@/context/store-context"
import { Truck, ShieldCheck, Headphones, Phone, MapPin, Twitter, Instagram, Facebook } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function Footer({ forceLight = false }: { forceLight?: boolean }) {
    const { storeSettings } = useStore()
    const [email, setEmail] = useState("")
    const [activePolicy, setActivePolicy] = useState<{ title: string; content: string } | null>(null)

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        toast.success("شكراً لاشتراكك في النشرة الإخبارية!")
        setEmail("")
    }

    return (
        <footer className={cn(
            "pt-16 pb-32 border-t transition-colors duration-300",
            forceLight 
                ? "bg-slate-50/50 text-slate-500 border-slate-200/80" 
                : "bg-slate-50/50 dark:bg-[#0f171e] text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-white/5"
        )}>
            <div className="container mx-auto px-6">
                {/* Top Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <FeatureBox
                        icon={<Truck className="w-6 h-6" />}
                        title={storeSettings.shippingTitle}
                        desc={storeSettings.shippingDesc}
                        iconColor="text-blue-400"
                        bgColor="bg-blue-500/10"
                        forceLight={forceLight}
                    />
                    <FeatureBox
                        icon={<ShieldCheck className="w-6 h-6" />}
                        title={storeSettings.paymentTitle}
                        desc={storeSettings.paymentDesc}
                        iconColor="text-yellow-500"
                        bgColor="bg-yellow-500/10"
                        forceLight={forceLight}
                    />
                    <FeatureBox
                        icon={<Headphones className="w-6 h-6" />}
                        title={storeSettings.supportTitle}
                        desc={storeSettings.supportDesc}
                        iconColor="text-green-400"
                        bgColor="bg-green-500/10"
                        forceLight={forceLight}
                    />
                </div>

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    {/* About Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className={cn(
                            "font-bold text-xl border-r-4 border-primary pr-4",
                            forceLight ? "text-slate-800" : "text-slate-800 dark:text-white"
                        )}>
                            {storeSettings.aboutTitle}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-500 text-right">
                            {storeSettings.aboutText}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-3 lg:pr-12 space-y-6">
                        <h3 className={cn(
                            "font-bold text-lg border-r-4 border-blue-500 pr-4",
                            forceLight ? "text-slate-800" : "text-slate-800 dark:text-white"
                        )}>روابط مهمة</h3>
                        <ul className="space-y-3 text-sm flex flex-col items-start pr-4 text-slate-500 dark:text-slate-400">
                            <li>
                                <button 
                                    onClick={() => setActivePolicy({ title: "شروط الاستخدام", content: storeSettings.footerTerms })}
                                    className="hover:text-primary transition-colors text-right block w-full focus:outline-none font-medium"
                                >
                                    شروط الاستخدام
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => setActivePolicy({ title: "سياسة الخصوصية والأحكام", content: storeSettings.footerPrivacy })}
                                    className="hover:text-primary transition-colors text-right block w-full focus:outline-none font-medium"
                                >
                                    سياسة الخصوصية
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => setActivePolicy({ title: "سياسة الاسترجاع والضمان", content: storeSettings.footerReturns })}
                                    className="hover:text-primary transition-colors text-right block w-full focus:outline-none font-medium"
                                >
                                    سياسة الاسترجاع
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-5 space-y-6">
                        <h3 className={cn(
                            "font-bold text-lg border-r-4 border-yellow-500 pr-4",
                            forceLight ? "text-slate-800" : "text-slate-800 dark:text-white"
                        )}>النشرة الإخبارية</h3>
                        <p className="text-sm text-slate-500">سجل الآن للحصول على التحديثات حول العروض الترويجية والقسائم.</p>
                        <form onSubmit={handleSubscribe} className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="email"
                                    placeholder="بريدك الإلكتروني..."
                                    className={cn(
                                        "rounded-xl h-12 text-right pl-4 pr-4 placeholder:text-slate-400",
                                        forceLight 
                                            ? "bg-slate-100 border-slate-200 text-slate-800 focus:bg-white" 
                                            : "bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-800 dark:text-white focus:bg-white dark:focus:bg-black/40"
                                    )}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold">
                                يشترك
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={cn(
                    "pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-8 transition-colors",
                    forceLight ? "border-slate-200/80" : "border-slate-200/80 dark:border-white/5"
                )}>
                    {/* Social Buttons - Show only if exists */}
                    <div className="flex gap-3">
                        {storeSettings.socialFacebook && (
                            <SocialButton icon={<Facebook className="w-5 h-5" />} href={storeSettings.socialFacebook} forceLight={forceLight} />
                        )}
                        {storeSettings.socialTwitter && (
                            <SocialButton icon={<Twitter className="w-5 h-5" />} href={storeSettings.socialTwitter} forceLight={forceLight} />
                        )}
                        {storeSettings.socialInstagram && (
                            <SocialButton icon={<Instagram className="w-5 h-5" />} href={storeSettings.socialInstagram} forceLight={forceLight} />
                        )}
                        {storeSettings.socialWhatsapp && (
                            <SocialButton icon={<Phone className="w-5 h-5" />} href={storeSettings.socialWhatsapp} isWhatsapp forceLight={forceLight} />
                        )}
                        {storeSettings.socialTiktok && (
                            <SocialButton
                                icon={<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.14 2.8-.23 5.6-.4 8.39-.18 2.37-1.18 4.77-3.1 6.22-2.11 1.57-5.06 1.98-7.46 1.13-2.45-.89-4.38-3.02-4.99-5.54-.6-2.58-.09-5.46 1.48-7.55 1.57-2.09 4.16-3.32 6.75-3.23v4.11c-1.34-.1-2.73.34-3.64 1.34-.9 1.05-1.14 2.53-.7 3.86.42 1.28 1.54 2.35 2.89 2.53 1.35.21 2.8-.29 3.52-1.45.3-.5.44-1.07.47-1.65-.01-3.35-.02-6.69-.03-10.04z" /></svg>}
                                href={storeSettings.socialTiktok}
                                forceLight={forceLight}
                            />
                        )}
                        {storeSettings.socialSnapchat && (
                            <SocialButton
                                icon={<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.75c-.717 0-1.39.208-1.956.572-.566.364-1.004.887-1.26 1.493-.257.606-.324 1.274-.191 1.916.133.643.447 1.233.906 1.691.458.459 1.048.773 1.691.906.642.133 1.31.066 1.916-.191.606-.256 1.129-.694 1.493-1.26.364-.566.572-1.239.572-1.956 0-.717-.208-1.39-.572-1.956-.364-.566-.887-1.004-1.493-1.26a4.743 4.743 0 00-3.106-.191 4.743 4.743 0 00-2.597 1.491.75.75 0 01-1.06-1.06 6.243 6.243 0 013.418-1.963c.846-.176 1.725-.088 2.523.249s1.488.91 1.968 1.657c.48.746.754 1.634.754 2.58 0 .946-.274 1.834-.754 2.58-.48.747-1.17 1.32-1.968 1.657-.798.337-1.677.425-2.523.249a6.243 6.243 0 013.418 1.963.75.75 0 01-1.061 1.061l.001-.001zm0 18.5c-3.189 0-6.101-1.258-8.242-3.3c-.26-.248-.344-.633-.21-.967.135-.333.472-.533.829-.488a8.74 8.74 0 005.101-1.036c.26-.145.474-.35.613-.603.14-.253.197-.534.167-.812a.75.75 0 00-1.483.158 7.24 7.24 0 01-4.223.858c-.902-.113-.91-1.393-.05-1.745.86-.352 2.55-.91 2.55-.91s.38-.13.38-.49v-.59c0-.49-1.21-1.44-1.21-1.44 0-1.64.6-2.5 1.79-2.5 0 0 1.25-.09 1.48-.38l.19-.24c.05-.07.12-.13.2-.17s.17-.06.26-.06c.09 0 .18.02.26.06s.15.1.2.17l.19.24c.23.29 1.48.38 1.48.38 1.19 0 1.79.86 1.79 2.5 0 0-1.21.95-1.21 1.44v.59c0 .36.38.49.38.49s1.69.558 2.55.91c.86.352.852 1.632-.05 1.745a7.24 7.24 0 01-4.223-.858.75.75 0 00-.733 1.31c1.558.87 3.328 1.253 5.101 1.107.357-.045.694.155.829.488.134.334.05.719-.21.967-2.141 2.042-5.053 3.3-8.242 3.3z" /></svg>}
                                href={storeSettings.socialSnapchat}
                                forceLight={forceLight}
                            />
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center">
                        <div className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-2xl border",
                            forceLight 
                                ? "bg-slate-100 border-slate-200/60" 
                                : "bg-slate-100 dark:bg-white/5 border-slate-200/60 dark:border-white/5"
                        )}>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500">الخط الساخن 24/7</p>
                                <p className={cn(
                                    "text-sm font-bold tracking-widest",
                                    forceLight ? "text-slate-800" : "text-slate-800 dark:text-white"
                                )}>{storeSettings.contactPhone}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Phone className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-slate-500">{storeSettings.contactAddress}</span>
                            <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="text-xs text-slate-600">
                        © {new Date().getFullYear()} {storeSettings.aboutTitle}. جميع الحقوق محفوظة.
                    </div>
                </div>
            </div>

            <Dialog open={!!activePolicy} onOpenChange={(open) => !open && setActivePolicy(null)}>
                {activePolicy && (
                    <DialogContent className="glass-card border-slate-200 dark:border-white/5 text-slate-950 dark:text-white max-w-2xl bg-white dark:bg-[#1a242f] rounded-3xl p-6 shadow-2xl">
                        <DialogHeader className="border-b border-slate-100 dark:border-white/10 pb-4 mb-4">
                            <DialogTitle className="text-right font-black text-xl text-primary">{activePolicy.title}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto pr-1 no-scrollbar text-right text-slate-700 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {activePolicy.content || "لا توجد تفاصيل متوفرة حالياً لهذه السياسة."}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setActivePolicy(null)} className="rounded-xl px-6 font-bold bg-primary text-white hover:bg-primary/95 transition-all">
                                إغلاق
                            </Button>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </footer>
    )
}

function FeatureBox({ icon, title, desc, iconColor, bgColor, forceLight }: { icon: React.ReactNode, title: string, desc: string, iconColor: string, bgColor: string, forceLight?: boolean }) {
    return (
        <div className={cn(
            "p-6 flex items-center gap-6 group hover:border-primary/20 transition-all rounded-2xl border",
            forceLight 
                ? "bg-white border-slate-200/80 shadow-md shadow-slate-100/50" 
                : "glass-card"
        )}>
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bgColor, iconColor)}>
                {icon}
            </div>
            <div className="text-right">
                <h4 className={cn("font-bold mb-1", forceLight ? "text-slate-800" : "text-slate-800 dark:text-white")}>{title}</h4>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>
    )
}

function SocialButton({ icon, href, isWhatsapp, forceLight }: { icon: React.ReactNode, href: string, isWhatsapp?: boolean, forceLight?: boolean }) {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border transition-all hover:scale-110",
                isWhatsapp 
                    ? "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white" 
                    : (forceLight 
                        ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-primary hover:text-white" 
                        : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white dark:hover:bg-primary")
            )}
        >
            {icon}
        </Link>
    )
}
