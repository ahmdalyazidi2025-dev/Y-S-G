"use client"

import { useStore } from "@/context/store-context"
import { Truck, ShieldCheck, Headphones, Phone, MapPin, Twitter, Instagram, Facebook } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function Footer() {
    const { storeSettings } = useStore()
    const [email, setEmail] = useState("")

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        toast.success("شكراً لاشتراكك في النشرة الإخبارية!")
        setEmail("")
    }

    return (
        <footer className="bg-slate-50 dark:bg-slate-950 text-foreground dark:text-slate-400 pt-16 pb-32 border-t border-border transition-colors duration-300">
            <div className="container mx-auto px-6">
                {/* Top Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <FeatureBox
                        icon={<Truck className="w-6 h-6" />}
                        title={storeSettings.shippingTitle}
                        desc={storeSettings.shippingDesc}
                        iconColor="text-blue-500"
                        bgColor="bg-blue-500/10"
                    />
                    <FeatureBox
                        icon={<ShieldCheck className="w-6 h-6" />}
                        title={storeSettings.paymentTitle}
                        desc={storeSettings.paymentDesc}
                        iconColor="text-yellow-500"
                        bgColor="bg-yellow-500/10"
                    />
                    <FeatureBox
                        icon={<Headphones className="w-6 h-6" />}
                        title={storeSettings.supportTitle}
                        desc={storeSettings.supportDesc}
                        iconColor="text-green-500"
                        bgColor="bg-green-500/10"
                    />
                </div>

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
                    {/* About Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-foreground font-bold text-xl border-r-4 border-primary pr-4">
                            {storeSettings.aboutTitle}
                        </h3>
                        <p className="text-sm leading-relaxed text-foreground dark:text-slate-400 text-right">
                            {storeSettings.aboutText}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-3 lg:pr-12 space-y-6">
                        <h3 className="text-foreground font-bold text-lg border-r-4 border-blue-500 pr-4">روابط مهمة</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">{storeSettings.footerTerms}</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">{storeSettings.footerPrivacy}</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">{storeSettings.footerReturns}</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-5 space-y-6">
                        <h3 className="text-foreground font-bold text-lg border-r-4 border-yellow-500 pr-4">النشرة الإخبارية</h3>
                        <p className="text-sm text-foreground">سجل الآن للحصول على التحديثات حول العروض الترويجية والقسائم.</p>
                        <form onSubmit={handleSubscribe} className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    type="email"
                                    placeholder="بريدك الإلكتروني..."
                                    className="bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 rounded-xl h-12 text-right pl-4 pr-4 focus:ring-primary/20"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                // FORCE DARK TEXT IN LIGHT MODE IF NEEDED, BUT DEFAULT SHOULD BE OK
                                // text-foreground handles it
                                />
                            </div>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20">
                                يشترك
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Social Buttons - Show only if exists */}
                    <div className="flex gap-3">
                        {storeSettings.socialFacebook && (
                            <SocialButton icon={<Facebook className="w-5 h-5" />} href={storeSettings.socialFacebook} />
                        )}
                        {storeSettings.socialTwitter && (
                            <SocialButton icon={<Twitter className="w-5 h-5" />} href={storeSettings.socialTwitter} />
                        )}
                        {storeSettings.socialInstagram && (
                            <SocialButton icon={<Instagram className="w-5 h-5" />} href={storeSettings.socialInstagram} />
                        )}
                        {storeSettings.socialWhatsapp && (
                            <SocialButton icon={<Phone className="w-5 h-5" />} href={storeSettings.socialWhatsapp} isWhatsapp />
                        )}
                        {storeSettings.socialTiktok && (
                            <SocialButton
                                icon={<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.14 2.8-.23 5.6-.4 8.39-.18 2.37-1.18 4.77-3.1 6.22-2.11 1.57-5.06 1.98-7.46 1.13-2.45-.89-4.38-3.02-4.99-5.54-.6-2.58-.09-5.46 1.48-7.55 1.57-2.09 4.16-3.32 6.75-3.23v4.11c-1.34-.1-2.73.34-3.64 1.34-.9 1.05-1.14 2.53-.7 3.86.42 1.28 1.54 2.35 2.89 2.53 1.35.21 2.8-.29 3.52-1.45.3-.5.44-1.07.47-1.65-.01-3.35-.02-6.69-.03-10.04z" /></svg>}
                                href={storeSettings.socialTiktok}
                            />
                        )}
                        {storeSettings.socialSnapchat && (
                            <SocialButton
                                icon={<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.75c-.717 0-1.39.208-1.956.572-.566.364-1.004.887-1.26 1.493-.257.606-.324 1.274-.191 1.916.133.643.447 1.233.906 1.691.458.459 1.048.773 1.691.906.642.133 1.31.066 1.916-.191.606-.256 1.129-.694 1.493-1.26.364-.566.572-1.239.572-1.956 0-.717-.208-1.39-.572-1.956-.364-.566-.887-1.004-1.493-1.26a4.743 4.743 0 00-3.106-.191 4.743 4.743 0 00-2.597 1.491.75.75 0 01-1.06-1.06 6.243 6.243 0 013.418-1.963c.846-.176 1.725-.088 2.523.249s1.488.91 1.968 1.657c.48.746.754 1.634.754 2.58 0 .946-.274 1.834-.754 2.58-.48.747-1.17 1.32-1.968 1.657-.798.337-1.677.425-2.523.249a6.243 6.243 0 013.418 1.963.75.75 0 01-1.061 1.061l.001-.001zm0 18.5c-3.189 0-6.101-1.258-8.242-3.3c-.26-.248-.344-.633-.21-.967.135-.333.472-.533.829-.488a8.74 8.74 0 005.101-1.036c.26-.145.474-.35.613-.603.14-.253.197-.534.167-.812a.75.75 0 00-1.483.158 7.24 7.24 0 01-4.223.858c-.902-.113-.91-1.393-.05-1.745.86-.352 2.55-.91 2.55-.91s.38-.13.38-.49v-.59c0-.49-1.21-1.44-1.21-1.44 0-1.64.6-2.5 1.79-2.5 0 0 1.25-.09 1.48-.38l.19-.24c.05-.07.12-.13.2-.17s.17-.06.26-.06c.09 0 .18.02.26.06s.15.1.2.17l.19.24c.23.29 1.48.38 1.48.38 1.19 0 1.79.86 1.79 2.5 0 0-1.21.95-1.21 1.44v.59c0 .36.38.49.38.49s1.69.558 2.55.91c.86.352.852 1.632-.05 1.745a7.24 7.24 0 01-4.223-.858.75.75 0 00-.733 1.31c1.558.87 3.328 1.253 5.101 1.107.357-.045.694.155.829.488.134.334.05.719-.21.967-2.141 2.042-5.053 3.3-8.242 3.3z" /></svg>}
                                href={storeSettings.socialSnapchat}
                            />
                        )}
                    </div>

                    {/* Contact Info - Improved Contrast */}
                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center">
                        <div className="flex items-center gap-3 bg-white dark:bg-white/5 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div className="text-right">
                                <p className="text-[10px] text-foreground">الخط الساخن 24/7</p>
                                <p className="text-sm font-bold text-foreground dark:text-white tracking-widest">{storeSettings.contactPhone}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Phone className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-foreground">{storeSettings.contactAddress}</span>
                            <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="text-xs text-foreground dark:text-slate-500">
                        © {new Date().getFullYear()} {storeSettings.aboutTitle}. جميع الحقوق محفوظة.
                    </div>
                </div>
            </div>
        </footer>
    )
}

function FeatureBox({ icon, title, desc, iconColor, bgColor }: { icon: React.ReactNode, title: string, desc: string, iconColor: string, bgColor: string }) {
    return (
        <div className="glass-card p-6 flex items-center gap-6 group hover:border-primary/20 transition-all">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bgColor, iconColor)}>
                {icon}
            </div>
            <div className="text-right">
                <h4 className="text-foreground font-bold mb-1">{title}</h4>
                <p className="text-xs text-foreground">{desc}</p>
            </div>
        </div>
    )
}

function SocialButton({ icon, href, isWhatsapp }: { icon: React.ReactNode, href: string, isWhatsapp?: boolean }) {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border border-border dark:border-white/5 transition-all hover:scale-110",
                isWhatsapp ? "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white" : "bg-white dark:bg-white/5 text-foreground hover:bg-primary hover:text-white shadow-sm dark:shadow-none"
            )}
        >
            {icon}
        </Link>
    )
}
