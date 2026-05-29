"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, User, Phone, ShieldCheck, MapPin, Settings2 } from "lucide-react"
import Link from "next/link"
import { useStore, Customer } from "@/context/store-context"
import { AdminCustomerForm } from "@/components/admin/customer-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function CustomersPage() {
    const { customers, deleteCustomer, storeSettings, updateStoreSettings, broadcastToCategory } = useStore()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
    const [broadcastMsg, setBroadcastMsg] = useState("")
    const [targetCategory, setTargetCategory] = useState<string>("all")
    const [activeFilter, setActiveFilter] = useState<string>("all")

    const getCategory = (lastActive?: Date) => {
        if (!lastActive) return { label: "منقطع", color: "text-red-400", bg: "bg-red-400/10", id: "Disconnected" }
        const days = Math.floor((new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
        if (days <= 7) return { label: "نشط", color: "text-green-400", bg: "bg-green-400/10", id: "Active" }
        if (days <= 14) return { label: "متوسط", color: "text-blue-400", bg: "bg-blue-400/10", id: "Average" }
        if (days <= 30) return { label: "ضعيف", color: "text-orange-400", bg: "bg-orange-400/10", id: "Weak" }
        return { label: "منقطع", color: "text-red-400", bg: "bg-red-400/10", id: "Disconnected" }
    }

    const handleBroadcast = () => {
        if (!broadcastMsg) return
        broadcastToCategory(targetCategory, broadcastMsg)
        setIsBroadcastOpen(false)
        setBroadcastMsg("")
        toast.success("تم إرسال الرسالة بنجاح")
    }

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingCustomer(null)
        setIsFormOpen(true)
    }

    const categoriesList = [
        { id: "all", label: "الكل", color: "text-slate-500 dark:text-slate-300", bg: "bg-slate-500/10", activeBg: "bg-slate-500 text-white", apiId: "all" },
        { id: "Active", label: "نشط", color: "text-green-500 dark:text-green-400", bg: "bg-green-500/10", activeBg: "bg-green-500 text-white", apiId: "Active" },
        { id: "Average", label: "متوسط", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", activeBg: "bg-blue-500 text-white", apiId: "Average" },
        { id: "Weak", label: "ضعيف", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10", activeBg: "bg-orange-500 text-white", apiId: "Weak" },
        { id: "Disconnected", label: "منقطع", color: "text-red-500 dark:text-red-400", bg: "bg-red-500/10", activeBg: "bg-red-500 text-white", apiId: "Disconnected" },
    ]

    const filteredCustomers = customers.filter(c => {
        if (activeFilter === "all") return true
        const cat = getCategory(c.lastActive)
        return cat.id === activeFilter
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">إدارة العملاء</h1>
                <div className="flex gap-2">
                    <Button
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                        onClick={handleAddNew}
                    >
                        <Plus className="w-4 h-4" />
                        <span>إضافة عميل</span>
                    </Button>
                </div>
            </div>

            {/* Premium Category Filter Tabs with Integrated Broadcast Shield Buttons */}
            <div className="bg-white dark:bg-[#1a242f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
                <div className="text-right mb-3 text-xs font-bold text-slate-500 dark:text-slate-400">تصفية وبث الرسائل للفئات:</div>
                <div className="flex flex-wrap gap-2 justify-start">
                    {categoriesList.map((cat) => (
                        <div
                            key={cat.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                                activeFilter === cat.id
                                    ? `${cat.activeBg} border-transparent shadow-sm scale-[1.02]`
                                    : `bg-slate-50 dark:bg-black/20 ${cat.color} border-slate-200 dark:border-white/5 hover:border-slate-300`
                            }`}
                        >
                            <button
                                onClick={() => setActiveFilter(cat.id)}
                                className="font-bold text-xs px-1"
                            >
                                {cat.label} ({
                                    cat.id === "all"
                                        ? customers.length
                                        : customers.filter(c => getCategory(c.lastActive).id === cat.id).length
                                })
                            </button>
                            <button
                                onClick={() => {
                                    setTargetCategory(cat.apiId)
                                    setIsBroadcastOpen(true)
                                }}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                    activeFilter === cat.id
                                        ? "bg-white/20 hover:bg-white/30 text-white"
                                        : "bg-primary/10 hover:bg-primary/20 text-primary"
                                }`}
                                title={`بث رسالة لفئة ${cat.label}`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Broadcast Modal */}
            <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                <DialogContent className="glass-card border-slate-200 dark:border-white/5 text-slate-950 dark:text-white max-w-md bg-white dark:bg-[#1a242f]">
                    <DialogHeader>
                        <DialogTitle className="text-right">بث رسالة لمجموعة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="block text-right">الفئة المستهدفة</Label>
                            <select
                                className="w-full bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-xl h-10 px-3 text-right text-sm font-bold"
                                value={targetCategory}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetCategory(e.target.value)}
                            >
                                <option value="all">الكل (جميع العملاء)</option>
                                <option value="Active">نشط (آخر 7 أيام)</option>
                                <option value="Average">متوسط (7-14 يوم)</option>
                                <option value="Weak">ضعيف (14-30 يوم)</option>
                                <option value="Disconnected">منقطع (أكثر من 30 يوم)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="block text-right font-bold text-xs text-slate-400">نص الرسالة</Label>
                            <Textarea
                                className="bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/10 rounded-xl text-right h-32 text-slate-900 dark:text-white placeholder-slate-500"
                                placeholder="اكتب رسالتك هنا..."
                                value={broadcastMsg}
                                onChange={(e) => setBroadcastMsg(e.target.value)}
                            />
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold" onClick={handleBroadcast}>
                            إرسال الآن
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="space-y-3">
                {filteredCustomers.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/5 font-bold">
                        لا يوجد عملاء في هذه الفئة حالياً
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <div key={customer.id} className="glass-card p-5 group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{customer.name}</h3>
                                        {(() => {
                                            const cat = getCategory(customer.lastActive)
                                            return (
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.color} border border-white/5`}>
                                                    {cat.label}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-teal-500" />
                                            <span>@{customer.username}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{customer.phone}</span>
                                        </div>
                                        {customer.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-orange-400" />
                                                <span>{customer.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="glass"
                                    size="icon"
                                    className="h-9 w-9 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                    onClick={() => handleEdit(customer)}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="glass"
                                    size="icon"
                                    className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                    onClick={() => {
                                        if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
                                            deleteCustomer(customer.id)
                                        }
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AdminCustomerForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialCustomer={editingCustomer}
            />
        </div>
    )
}
