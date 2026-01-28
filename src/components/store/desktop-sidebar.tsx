"use client"

import { ClipboardList, MessageSquare, LogOut, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { hapticFeedback } from "@/lib/haptics"
import Image from "next/image"

import { useStore } from "@/context/store-context" // Add import

export function DesktopSidebar({ onLogout }: { onLogout: () => void }) {
    const pathname = usePathname()
    const { storeSettings } = useStore()
    console.log("Store contact:", storeSettings?.contactPhone)

    const navItems = [
        { name: "المتجر", icon: LayoutDashboard, href: "/customer" },
        { name: "فواتيري", icon: ClipboardList, href: "/customer/invoices" },
        { name: "الدردشة", icon: MessageSquare, href: "/customer/chat" },
    ]

    return (
        <aside className="hidden lg:flex flex-col w-64 h-full bg-[#1c2a36]/50 backdrop-blur-xl border-l border-white/5 p-6 space-y-8 sticky top-0">
            <div className="flex items-center gap-3 px-2">
                <Image src="/logo.jpg" className="w-10 h-10 rounded-full" alt="YSG" width={40} height={40} />
                <span className="font-black text-xs uppercase tracking-tighter">YSG Hub</span>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => hapticFeedback('light')}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-bold text-sm">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <button
                onClick={onLogout}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all text-right"
            >
                <LogOut className="w-5 h-5" />
                <span className="font-bold text-sm">تسجيل الخروج</span>
            </button>
        </aside>
    )
}
