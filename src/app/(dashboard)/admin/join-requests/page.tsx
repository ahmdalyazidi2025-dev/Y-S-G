"use client"

import { useStore } from "@/context/store-context"
import { Trash2, Copy, Search, UserPlus, ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export default function JoinRequestsPage() {
    const { joinRequests, deleteJoinRequest, markSectionAsViewed } = useStore()
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => { markSectionAsViewed('joinRequests') }, [])
    /* eslint-enable react-hooks/exhaustive-deps */
    const [search, setSearch] = useState("")

    const filtered = joinRequests.filter(req =>
        req.name.toLowerCase().includes(search.toLowerCase()) ||
        req.phone.includes(search)
    )

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("تم النسخ")
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                            <ArrowRight className="w-5 h-5 text-foreground" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-foreground mb-1">طلبات الانضمام</h1>
                        <p className="text-muted-foreground text-sm">إدارة طلبات تسجيل العملاء الجدد</p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-2xl px-4 py-2 flex items-center gap-2 text-foreground shadow-sm">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <span className="font-bold">{joinRequests.length} طلب</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                    type="text"
                    placeholder="بحث بالاسم أو رقم الهاتف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-2xl h-14 pr-12 pl-4 text-foreground focus:border-primary/50 transition-colors shadow-sm focus:ring-1 focus:ring-primary/20 outline-none"
                />
            </div>

            {/* List */}
            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 text-muted-foreground"
                        >
                            لا توجد طلبات انضمام حالياً
                        </motion.div>
                    ) : (
                        filtered.map((req) => (
                            <motion.div
                                key={req.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 group border border-border/50 shadow-sm"
                            >
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {req.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg">{req.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span
                                                className="hover:text-primary cursor-pointer flex items-center gap-1 transition-colors"
                                                onClick={() => copyToClipboard(req.phone)}
                                            >
                                                {req.phone}
                                                <Copy className="w-3 h-3" />
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                            <span>
                                                {format(new Date(req.createdAt), "d MMMM yyyy - h:mm a", { locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => deleteJoinRequest(req.id)}
                                        className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-all flex items-center justify-center gap-2"
                                        title="حذف نهائي"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="md:hidden">حذف</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
