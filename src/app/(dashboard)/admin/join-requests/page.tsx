"use client"

import { useStore } from "@/context/store-context"
import { Trash2, Copy, Search, UserPlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export default function JoinRequestsPage() {
    const { joinRequests, deleteJoinRequest } = useStore()
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
                <div>
                    <h1 className="text-2xl font-black text-white mb-2">طلبات الانضمام</h1>
                    <p className="text-slate-400 text-sm">إدارة طلبات تسجيل العملاء الجدد</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 text-white">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <span className="font-bold">{joinRequests.length} طلب</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                    type="text"
                    placeholder="بحث بالاسم أو رقم الهاتف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-2xl h-14 pr-12 pl-4 text-white focus:border-primary/50 transition-colors"
                />
            </div>

            {/* List */}
            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 text-slate-500"
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
                                className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 group"
                            >
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {req.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{req.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                            <span
                                                className="hover:text-primary cursor-pointer flex items-center gap-1"
                                                onClick={() => copyToClipboard(req.phone)}
                                            >
                                                {req.phone}
                                                <Copy className="w-3 h-3" />
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                                            <span>
                                                {format(new Date(req.createdAt), "d MMMM yyyy - h:mm a", { locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <button
                                        onClick={() => deleteJoinRequest(req.id)}
                                        className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all flex items-center justify-center gap-2"
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
