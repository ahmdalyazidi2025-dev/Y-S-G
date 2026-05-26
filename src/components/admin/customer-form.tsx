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
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (initialCustomer) {
                setFormData({
                    name: initialCustomer.name,
                    phone: initialCustomer.phone,
                    username: initialCustomer.username,
                    password: "", // Password is never pre-filled for security
                    location: initialCustomer.location || "",
                })
            } else {
                setFormData({
                    name: "",
                    phone: "",
                    username: "",
                    password: "",
                    location: "",
                })
            }
        }, 0);

        return () => clearTimeout(timer);
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
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{initialCustomer ? "تعديل عميل" : "إضافة عميل جديد"}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-400 font-bold block text-right pr-1">اسم العميل</Label>
                                <div className="relative">
                                    <User className="absolute right-3 top-4 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 pr-10 text-right text-slate-800 dark:text-white h-12 rounded-xl focus-visible:ring-primary/50"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-400 font-bold block text-right pr-1">اسم المستخدم (لتسجيل الدخول)</Label>
                                <div className="relative">
                                    <Hash className="absolute right-3 top-4 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 pr-10 text-right text-slate-800 dark:text-white h-12 rounded-xl focus-visible:ring-primary/50"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-400 font-bold block text-right pr-1">رقم الهاتف</Label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-4 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        type="tel"
                                        className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 pr-10 text-right text-slate-800 dark:text-white h-12 rounded-xl focus-visible:ring-primary/50"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-400 font-bold block text-right pr-1">{initialCustomer ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}</Label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-4 w-4 h-4 text-slate-500" />
                                    <Input
                                        required={!initialCustomer}
                                        type="password"
                                        className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 pr-10 text-right text-slate-800 dark:text-white h-12 rounded-xl focus-visible:ring-primary/50"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 dark:text-slate-400 font-bold block text-right pr-1">الموقع (المدينة)</Label>
                                <div className="relative">
                                    <MapPin className="absolute right-3 top-4 w-4 h-4 text-slate-500" />
                                    <Input
                                        required
                                        className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 pr-10 text-right text-slate-800 dark:text-white h-12 rounded-xl focus-visible:ring-primary/50"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 bg-primary text-white rounded-xl gap-2 shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all">
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
