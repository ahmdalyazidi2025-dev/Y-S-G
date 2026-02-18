"use client"
import { useStore } from "@/context/store-context"
import { motion } from "framer-motion"
import { Search, Phone, User, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { AdminCustomerForm } from "@/components/admin/customer-form"

// Helper to format date
const formatDate = (date: any) => {
    if (!date) return ""
    const d = date.toDate ? date.toDate() : new Date(date)
    return formatDistanceToNow(d, { addSuffix: true, locale: ar })
}

export default function PasswordRequestsPage() {
    const { passwordRequests, resolvePasswordRequest, customers, markSectionAsViewed } = useStore()
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null) // For opening customer form

    useEffect(() => {
        markSectionAsViewed('passwordRequests')
    }, [markSectionAsViewed])

    // Filter requests
    const filteredRequests = passwordRequests.filter(req =>
        req.phone.includes(searchTerm) ||
        req.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleOpenProfile = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId)
        if (customer) {
            setSelectedCustomer(customer)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">طلبات استعادة كلمة المرور</h1>
                    <p className="text-slate-500">متابعة طلبات العملاء لاستعادة حساباتهم عن طريق الهاتف</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="بحث برقم الهاتف أو اسم العميل..."
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl h-12 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>لا توجد طلبات معلقة حالياً</p>
                    </div>
                ) : (
                    filteredRequests.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">{req.customerName}</h3>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <span className="font-mono dir-ltr">{req.phone}</span>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatDate(req.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <a
                                    href={`https://wa.me/${req.phone.replace(/^0/, '966')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 md:flex-none"
                                >
                                    <Button variant="outline" className="w-full border-green-500/20 text-green-600 hover:bg-green-500/10 gap-2">
                                        <span>واتساب</span>
                                    </Button>
                                </a>

                                <Button
                                    onClick={() => handleOpenProfile(req.customerId)}
                                    className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <User className="w-4 h-4 ml-2" />
                                    <span>الملف الشخصي</span>
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => resolvePasswordRequest(req.id)}
                                    className="flex-1 md:flex-none bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300"
                                >
                                    <CheckCircle className="w-4 h-4 ml-2" />
                                    <span>إغلاق الطلب</span>
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Customer Edit Modal (To change password) */}
            <AdminCustomerForm
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                initialCustomer={selectedCustomer}
            />
        </div>
    )
}
