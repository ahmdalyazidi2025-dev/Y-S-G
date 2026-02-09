"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, User, Phone, ShieldCheck, Lock, Search } from "lucide-react"
import { useStore, Customer } from "@/context/store-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { AdminCustomerForm } from "@/components/admin/customer-form"
import { PasswordReveal } from "@/components/admin/password-reveal"
import React from "react"

export default function CustomersPage() {
    const { customers, deleteCustomer, sendNotificationToGroup, orders, sendNotification } = useStore()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
    const [broadcastMsg, setBroadcastMsg] = useState("")
    const [targetCategory, setTargetCategory] = useState<string>("vip")
    const [searchQuery, setSearchQuery] = useState("")

    // Notification State
    const [isNotifyOpen, setIsNotifyOpen] = useState(false)
    const [notifyTitle, setNotifyTitle] = useState("")
    const [notifyBody, setNotifyBody] = useState("")
    const [notifyTargetId, setNotifyTargetId] = useState<string | null>(null)

    // Segmentation Logic
    const [activeTab, setActiveTab] = useState<"all" | "vip" | "active" | "semi_active" | "interactive" | "dormant">("all")

    const getCustomerStats = (customerId: string) => {
        const customerOrders = orders.filter(o => o.customerId === customerId)
        const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0)
        const lastOrderDate = customerOrders.length > 0
            ? new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
            : null
        return { totalSpent, lastOrderDate, orderCount: customerOrders.length }
    }

    const segments = {
        vip: (c: Customer) => getCustomerStats(c.id).totalSpent > 5000,
        active: (c: Customer) => {
            const lastOrder = getCustomerStats(c.id).lastOrderDate
            if (!lastOrder) return false
            const days = (new Date().getTime() - lastOrder.getTime()) / (1000 * 3600 * 24)
            return days <= 30
        },
        semi_active: (c: Customer) => {
            const lastOrder = getCustomerStats(c.id).lastOrderDate
            if (!lastOrder) return false
            const days = (new Date().getTime() - lastOrder.getTime()) / (1000 * 3600 * 24)
            return days > 30 && days <= 90
        },
        interactive: (c: Customer) => {
            if (!c.lastActive) return false
            const stats = getCustomerStats(c.id)
            const daysSinceActive = (new Date().getTime() - new Date(c.lastActive).getTime()) / (1000 * 3600 * 24)
            // Interactive: Logged in recently (<7 days) but NO orders OR very old orders
            return daysSinceActive <= 7 && stats.orderCount === 0
        },
        dormant: (c: Customer) => {
            if (!c.lastActive) return true // No activity ever = dormant
            const daysSinceActive = (new Date().getTime() - new Date(c.lastActive).getTime()) / (1000 * 3600 * 24)
            return daysSinceActive > 90
        }
    }

    const filteredCustomers = customers.filter(c => {
        // 1. Tab Filter
        let matchesTab = true;
        if (activeTab !== "all") {
            matchesTab = segments[activeTab](c);
        }

        if (!searchQuery) return matchesTab;

        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.phone && c.phone.includes(query)) ||
            (c.email && c.email.toLowerCase().includes(query)) ||
            (c.username && c.username.toLowerCase().includes(query));

        return matchesTab && matchesSearch;
    })

    const handleBroadcast = async () => {
        if (!broadcastMsg || !notifyTitle) {
            toast.error("الرجاء كتابة العنوان والنص")
            return
        }
        await sendNotificationToGroup(targetCategory as "vip" | "active" | "semi_active" | "interactive" | "dormant" | "all", notifyTitle, broadcastMsg)
        setIsBroadcastOpen(false)
        setBroadcastMsg("")
        setNotifyTitle("")
        // Success toast is handled in context
    }

    const handleSendNotification = async () => {
        if (!notifyTitle || !notifyBody || !notifyTargetId) return
        await sendNotification({
            userId: notifyTargetId,
            title: notifyTitle,
            body: notifyBody,
            type: "info"
        })
        setIsNotifyOpen(false)
        setNotifyTitle("")
        setNotifyBody("")
        setNotifyTargetId(null)
        toast.success("تم إرسال الإشعار للعميل")
    }

    const openNotifyModal = (customerId: string) => {
        setNotifyTargetId(customerId)
        setIsNotifyOpen(true)
    }

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingCustomer(null)
        setIsFormOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted text-foreground">
                            <ArrowRight className="w-5 h-5 transform rtl:rotate-180" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">إدارة العملاء</h1>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            className="bg-white/5 border-white/10 rounded-full pr-10 text-right h-10 w-full focus:bg-white/10 transition-colors"
                            placeholder="بحث باسم، جوال، أو بريد العميل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
                            <DialogTrigger>
                                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-slate-400 gap-2 rounded-full h-10 px-4 w-full sm:w-auto justify-center">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>بث</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-card border-white/5 text-white max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-right">إرسال إشعار لمجموعة</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="block text-right">الفئة المستهدفة</Label>
                                        <select
                                            className="w-full bg-black/20 border-white/10 rounded-xl h-10 px-3 text-right text-sm text-white"
                                            value={targetCategory}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetCategory(e.target.value)}
                                        >
                                            <option value="all">الكل ({customers.length})</option>
                                            <option value="vip">كبار العملاء (VIP)</option>
                                            <option value="active">النشطين (طلبات &lt; 30 يوم)</option>
                                            <option value="semi_active">شبة نشطين (30-90 يوم)</option>
                                            <option value="interactive">متفاعلين (دخول بدون شراء)</option>
                                            <option value="dormant">خاملين (&gt; 90 يوم)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="block text-right">عنوان الإشعار</Label>
                                        <Input
                                            className="bg-black/20 border-white/10 rounded-xl text-right"
                                            placeholder="مثال: خصم خاص لك!"
                                            value={notifyTitle}
                                            onChange={(e) => setNotifyTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="block text-right">نص الإشعار</Label>
                                        <Textarea
                                            className="bg-black/20 border-white/10 rounded-xl text-right h-32"
                                            placeholder="اكتب تفاصيل العرض هنا..."
                                            value={broadcastMsg}
                                            onChange={(e) => setBroadcastMsg(e.target.value)}
                                        />
                                    </div>
                                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold" onClick={handleBroadcast}>
                                        إرسال للمجموعة
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4 w-full sm:w-auto justify-center"
                            onClick={handleAddNew}
                        >
                            <Plus className="w-4 h-4" />
                            <span>إضافة</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Segment Tabs */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar gap-1">
                {[
                    { id: "all", label: "الكل" },
                    { id: "vip", label: "كبار العملاء" },
                    { id: "active", label: "النشطين" },
                    { id: "semi_active", label: "شبة نشطين" },
                    { id: "interactive", label: "متفاعلين" },
                    { id: "dormant", label: "خاملين" }
                ].map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as "all" | "vip" | "active" | "semi_active" | "interactive" | "dormant")}
                        className={cn(
                            "group flex items-center justify-between px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex-1 cursor-pointer min-w-fit gap-2",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg"
                                : "text-slate-500 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <span>{tab.label}</span>

                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setTargetCategory(tab.id);
                                setIsBroadcastOpen(true);
                            }}
                            className={cn(
                                "p-1.5 rounded-full hover:bg-white/20 transition-colors",
                                activeTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-white"
                            )}
                            title={`إرسال إشعار لـ ${tab.label}`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {filteredCustomers.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        لا يوجد عملاء في هذه الفئة
                    </div>
                ) : (
                    filteredCustomers.map((customer) => {
                        const stats = getCustomerStats(customer.id)
                        return (
                            <div key={customer.id} className="glass-card p-5 group flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-white text-lg">{customer.name}</h3>
                                            {stats.totalSpent > 5000 && (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                    VIP
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3 text-teal-500" />
                                                <span className="truncate max-w-[100px] sm:max-w-auto">{customer.email}</span>
                                            </div>

                                            <PasswordReveal password={customer.password} />

                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                <span>{customer.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-green-400">
                                                <span>مجموع الشراء: {stats.totalSpent} ر.س</span>
                                            </div>
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
                                        className="h-9 w-9 text-orange-400 hover:text-orange-300 hover:bg-orange-400/10"
                                        onClick={() => openNotifyModal(customer.id)}
                                        title="إرسال إشعار"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="glass"
                                        size="icon"
                                        className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                        onClick={() => {
                                            if (confirm("تحذير هام: سيتم حذف هذا العميل نهائياً من النظام ولن يتمكن من الدخول مجدداً. هل أنت متأكد؟")) {
                                                deleteCustomer(customer.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Notify Modal */}
            <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
                <DialogContent className="glass-card border-white/5 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right">إرسال إشعار للعميل</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="block text-right">عنوان الإشعار</Label>
                            <Input
                                className="bg-black/20 border-white/10 rounded-xl text-right"
                                placeholder="مثال: عرض خاص لك!"
                                value={notifyTitle}
                                onChange={(e) => setNotifyTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="block text-right">نص الإشعار</Label>
                            <Textarea
                                className="bg-black/20 border-white/10 rounded-xl text-right h-32"
                                placeholder="اكتب نص الإشعار هنا..."
                                value={notifyBody}
                                onChange={(e) => setNotifyBody(e.target.value)}
                            />
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold" onClick={handleSendNotification}>
                            إرسال
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AdminCustomerForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialCustomer={editingCustomer}
            />
        </div>
    )
}
