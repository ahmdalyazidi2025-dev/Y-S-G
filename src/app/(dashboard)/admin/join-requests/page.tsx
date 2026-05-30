"use client"

import { useStore, Customer } from "@/context/store-context"
type JoinRequest = { id: string; name: string; phone: string; centerName?: string; location?: string; password?: string; createdAt: Date; };
const useSettings = () => ({ markSectionAsViewed: (s: string) => {} });
import { Trash2, Copy, Search, UserPlus, ArrowRight, Phone, UserCheck, XCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { AdminCustomerForm } from "@/components/admin/customer-form"

export default function JoinRequestsPage() {
    const { joinRequests = [], deleteJoinRequest = async () => {} } = useStore()
    const { markSectionAsViewed } = useSettings()
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => { markSectionAsViewed('joinRequests') }, [])
    /* eslint-enable react-hooks/exhaustive-deps */
    const [search, setSearch] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [activeReqId, setActiveReqId] = useState<string | null>(null)

    const filtered = joinRequests.filter(req =>
        req.name.toLowerCase().includes(search.toLowerCase()) ||
        req.phone.includes(search) ||
        (req.centerName && req.centerName.toLowerCase().includes(search.toLowerCase())) ||
        (req.location && req.location.toLowerCase().includes(search.toLowerCase()))
    )

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("تم النسخ")
    }

    const handleAddCustomer = (req: JoinRequest) => {
        // Clean and replace spaces with underscores for standard usernames
        const cleanCenterName = req.centerName ? req.centerName.trim().replace(/\s+/g, '_') : ""
        const cleanPersonalName = req.name ? req.name.trim().replace(/\s+/g, '_') : ""
        
        setSelectedCustomer({
            id: "", // empty id triggers addCustomer instead of updateCustomer
            name: req.centerName ? `${req.centerName} (${req.name})` : req.name,
            phone: req.phone,
            username: req.centerName ? cleanCenterName : cleanPersonalName, // Simply use Center Name as username (or Personal Name if empty) for super easy remembering!
            location: req.location || "",
            password: req.password || "", // pre-fill chosen password
            email: ""
        })
        // Store request ID so we can delete it ONLY when the customer is successfully created!
        setActiveReqId(req.id)
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
                        <p className="text-muted-foreground text-sm">إدارة وتنشيط طلبات العملاء الجدد بشكل فوري</p>
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
                    placeholder="بحث بالاسم، رقم الهاتف، اسم المركز أو المدينة..."
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
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                                        {req.name[0]}
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <h3 className="font-bold text-foreground text-lg">{req.name}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            {req.centerName && (
                                                <span className="font-bold text-slate-700 dark:text-slate-350">
                                                    🏪 {req.centerName}
                                                </span>
                                            )}
                                            {req.location && (
                                                <span className="font-bold text-slate-700 dark:text-slate-350">
                                                    📍 {req.location}
                                                </span>
                                            )}
                                            <span
                                                className="hover:text-primary cursor-pointer flex items-center gap-1 transition-colors font-mono font-bold"
                                                onClick={() => copyToClipboard(req.phone)}
                                            >
                                                📞 {req.phone}
                                                <Copy className="w-3 h-3" />
                                            </span>
                                            <span className="text-[10px] opacity-75">
                                                ⏰ {format(new Date(req.createdAt), "d MMMM yyyy - h:mm a", { locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                    {/* تواصل واتساب */}
                                    <a
                                        href={`https://wa.me/${req.phone.replace(/^0/, '966')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 md:flex-none"
                                    >
                                        <Button variant="outline" className="w-full h-10 border-green-500/20 text-green-600 dark:text-green-550 hover:bg-green-500/10 gap-2 rounded-xl text-xs font-black">
                                            <span>واتساب</span>
                                        </Button>
                                    </a>

                                    {/* إضافة وتفعيل */}
                                    <button
                                        onClick={() => handleAddCustomer(req)}
                                        className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all flex items-center justify-center gap-2 text-xs font-black"
                                        title="إضافة وتفعيل الحساب"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        <span>إضافة وتفعيل</span>
                                    </button>

                                    {/* رفض */}
                                    <button
                                        onClick={() => deleteJoinRequest(req.id)}
                                        className="flex-1 md:flex-none h-10 px-4 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20 transition-all flex items-center justify-center gap-2 text-xs font-black"
                                        title="رفض وحذف الطلب"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>رفض</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Customer Add Form Modal */}
            <AdminCustomerForm
                isOpen={!!selectedCustomer}
                onClose={() => {
                    setSelectedCustomer(null)
                    setActiveReqId(null)
                }}
                initialCustomer={selectedCustomer}
                onSuccess={async () => {
                    if (activeReqId) {
                        await deleteJoinRequest(activeReqId)
                        setActiveReqId(null)
                    }
                }}
            />
        </div>
    )
}
