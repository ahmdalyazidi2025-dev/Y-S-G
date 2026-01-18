"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { X, Save, User, Phone, Lock, Hash, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Customer, useStore } from "@/context/store-context"

interface CustomerFormProps {
    isOpen: boolean
    onClose: () => void
    initialCustomer?: Customer | null
}

export function AdminCustomerForm({ isOpen, onClose, initialCustomer }: CustomerFormProps) {
    const { addCustomer, updateCustomer } = useStore()

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        username: "",
        password: "",
        location: "",
    })

    useEffect(() => {
        if (initialCustomer) {
            setFormData(prev => {
                const newData = {
                    name: initialCustomer.name,
                    phone: initialCustomer.phone,
                    username: initialCustomer.username,
                    password: "", // Password is never pre-filled for security
                    location: initialCustomer.location || "",
                }
                // Only update if the new data is different from the current form data
                if (JSON.stringify(prev) === JSON.stringify(newData)) return prev
                return newData
            })
        } else {
            setFormData(prev => {
                const newData = {
                    name: "",
                    phone: "",
                    username: "",
                    password: "",
                    location: "",
                }
                if (JSON.stringify(prev) === JSON.stringify(newData)) return prev
                return newData
            })
        }
    }, [initialCustomer, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const customerData = {
            name: formData.name,
            phone: formData.phone,
            username: formData.username,
            password: formData.password || undefined,
            location: formData.location,
        }

        if (initialCustomer) {
            updateCustomer({ ...customerData, id: initialCustomer.id })
        } else {
            addCustomer(customerData)
        }
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-card w-full max-w-md p-6 relative"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">{initialCustomer ? "تعديل عميل" : "إضافة عميل جديد"}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>اسم العميل</Label>
                                <div className="relative">
                                    <User className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        className="bg-black/20 border-white/10 pr-10 text-right"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>اسم المستخدم (لتسجيل الدخول)</Label>
                                <div className="relative">
                                    <Hash className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        className="bg-black/20 border-white/10 pr-10 text-right"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>رقم الهاتف</Label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        type="tel"
                                        className="bg-black/20 border-white/10 pr-10 text-right"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{initialCustomer ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}</Label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                                    <Input
                                        required={!initialCustomer}
                                        type="password"
                                        className="bg-black/20 border-white/10 pr-10 text-right"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>الموقع (المدينة)</Label>
                                <div className="relative">
                                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        className="bg-black/20 border-white/10 pr-10 text-right"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 bg-primary text-white rounded-xl gap-2 shadow-lg shadow-primary/20">
                                    <Save className="w-4 h-4" />
                                    <span>{initialCustomer ? "حفظ التغييرات" : "إضافة العميل"}</span>
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
