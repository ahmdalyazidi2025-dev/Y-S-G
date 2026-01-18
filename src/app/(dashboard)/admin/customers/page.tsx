"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus, Edit2, Trash2, User, Phone, ShieldCheck, MapPin } from "lucide-react"
import Link from "next/link"
import { useStore, Customer } from "@/context/store-context"
import { AdminCustomerForm } from "@/components/admin/customer-form"

export default function CustomersPage() {
    const { customers, deleteCustomer } = useStore()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

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
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold flex-1">إدارة العملاء</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-full h-10 px-4"
                    onClick={handleAddNew}
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة عميل</span>
                </Button>
            </div>

            <div className="space-y-3">
                {customers.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-white/5">
                        لا يوجد عملاء مسجلين
                    </div>
                ) : (
                    customers.map((customer) => (
                        <div key={customer.id} className="glass-card p-5 group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-white text-lg">{customer.name}</h3>
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
