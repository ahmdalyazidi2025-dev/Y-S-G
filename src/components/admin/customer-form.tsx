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
        email: "",
        password: "",
        location: "",
    })

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (initialCustomer) {
                setFormData({
                    name: initialCustomer.name,
                    phone: initialCustomer.phone,
                    email: initialCustomer.email,
                    password: initialCustomer.password || "", // Password is never pre-filled for security
                    location: initialCustomer.location || "",
                })
            } else {
                setFormData({
                    name: "",
                    phone: "",
                    email: "",
                    password: "",
                    location: "",
                })
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [initialCustomer, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (initialCustomer) {
            updateCustomer(initialCustomer.id, {
                name: formData.name,
                phone: formData.phone,
                email: formData.email, // Updated
                password: formData.password || undefined,
                location: formData.location
            })
        } else {
            addCustomer({
                name: formData.name,
                phone: formData.phone,
                email: formData.email, // Updated
                password: formData.password,
                location: formData.location
            } as any)
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
                                <Label className="text-right block">البريد الإلكتروني</Label>
                                <Input
                                    type="email"
                                    required
                                    className="bg-black/20 border-white/10 text-right"
                                    placeholder="email@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
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
