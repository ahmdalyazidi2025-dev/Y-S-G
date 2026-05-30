"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { X, Save, User, Phone, Lock, Hash, MapPin, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Customer, useStore } from "@/context/store-context"
import { cn } from "@/lib/utils"

interface CustomerFormProps {
    isOpen: boolean
    onClose: () => void
    initialCustomer?: Customer | null
    onSuccess?: () => void
}

export function AdminCustomerForm({ isOpen, onClose, initialCustomer, onSuccess }: CustomerFormProps) {
    const { addCustomer, updateCustomer, categories = [], storeSettings } = useStore()

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        username: "",
        password: "",
        location: "",
    })
    const [viewAllCategories, setViewAllCategories] = useState(true)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [showFormPassword, setShowFormPassword] = useState(false)

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (initialCustomer) {
                setFormData({
                    name: initialCustomer.name,
                    phone: initialCustomer.phone,
                    username: initialCustomer.username || "",
                    password: initialCustomer.password || "", // Pre-fill password if provided (e.g. from joinRequest)
                    location: initialCustomer.location || "",
                })
                const allowed = initialCustomer.allowedCategories
                if (!allowed || allowed === "all") {
                    setViewAllCategories(true)
                    setSelectedCategories([])
                } else {
                    setViewAllCategories(false)
                    setSelectedCategories(allowed)
                }
            } else {
                setFormData({
                    name: "",
                    phone: "",
                    username: "",
                    password: "",
                    location: "",
                })
                setViewAllCategories(true)
                setSelectedCategories([])
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [initialCustomer, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const customerData = {
            name: formData.name,
            phone: formData.phone,
            username: formData.username,
            password: formData.password || undefined,
            location: formData.location,
            allowedCategories: (viewAllCategories ? "all" : selectedCategories) as "all" | string[],
        }

        try {
            if (initialCustomer && initialCustomer.id) {
                await updateCustomer({ ...customerData, id: initialCustomer.id })
            } else {
                await addCustomer(customerData)

                // WhatsApp welcome message auto-sending on success
                const baseTemplate = storeSettings?.whatsappTemplates?.newCustomer || 
                    "مرحباً بك {name} في متجرنا! تم تفعيل حسابك كعميل بنجاح.";
                
                // 1. Replace the name placeholder if exists
                let customMessage = baseTemplate.replace(/{name}/g, customerData.name);
                
                // 2. Beautifully append the username and password at the bottom automatically
                const credentialsPart = 
                    `\n\n*🔐 بيانات دخول حسابك:*\n` +
                    `• *اسم المستخدم:* ${customerData.username}\n` +
                    `• *كلمة المرور:* ${customerData.password || ""}\n\n` +
                    `🔗 رابط تسجيل الدخول:\n${window.location.origin}/login`;
                
                const messageText = customMessage + credentialsPart;
                
                let cleanPhone = customerData.phone.trim();
                if (cleanPhone.startsWith("05")) {
                    cleanPhone = "966" + cleanPhone.substring(1);
                } else if (cleanPhone.startsWith("5")) {
                    cleanPhone = "966" + cleanPhone;
                } else if (cleanPhone.startsWith("0")) {
                    cleanPhone = "966" + cleanPhone.substring(1);
                }

                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
                window.open(waUrl, "_blank");
            }
            if (onSuccess) {
                onSuccess()
            }
            onClose()
        } catch (error) {
            console.error("Submit customer form failed:", error)
        }
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
                        className="glass-card w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto no-scrollbar"
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
                                        type={showFormPassword ? "text" : "password"}
                                        className="bg-slate-100/70 dark:bg-black/20 border-slate-200 dark:border-white/10 pr-10 pl-10 text-right text-slate-800 dark:text-white h-12 rounded-xl focus-visible:ring-primary/50"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowFormPassword(!showFormPassword)}
                                        className="absolute left-3 top-3.5 text-slate-450 hover:text-slate-600 focus:outline-none"
                                        title={showFormPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                                    >
                                        {showFormPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
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

                            {/* Allowed Categories Section */}
                            <div className="space-y-3 border-t border-slate-200 dark:border-white/10 pt-4">
                                <Label className="text-slate-900 dark:text-white font-bold block text-right">صلاحيات رؤية الأقسام</Label>
                                
                                <div className="flex items-center justify-between bg-slate-100/50 dark:bg-black/20 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
                                    <Label htmlFor="view-all-cats" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">رؤية جميع الأقسام</Label>
                                    <input
                                        type="checkbox"
                                        id="view-all-cats"
                                        checked={viewAllCategories}
                                        onChange={(e) => setViewAllCategories(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/50 cursor-pointer"
                                    />
                                </div>

                                {!viewAllCategories && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-black/10 rounded-xl border border-slate-200/40 dark:border-white/5 no-scrollbar"
                                    >
                                        {categories.map((cat: any) => {
                                            const isChecked = selectedCategories.includes(cat.id) || selectedCategories.includes(cat.nameAr)
                                            return (
                                                <div 
                                                    key={cat.id} 
                                                    onClick={() => {
                                                        if (isChecked) {
                                                            setSelectedCategories(selectedCategories.filter(id => id !== cat.id && id !== cat.nameAr))
                                                        } else {
                                                            setSelectedCategories([...selectedCategories, cat.id])
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between p-2 rounded-lg border text-right cursor-pointer transition-all",
                                                        isChecked
                                                            ? "bg-primary/5 border-primary/30 text-primary font-bold"
                                                            : "bg-background border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                                                    )}
                                                >
                                                    <span className="text-[11px] truncate flex-1">{cat.nameAr}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {}} // handled by div click
                                                        className="w-3.5 h-3.5 rounded border-slate-300 text-primary pointer-events-none"
                                                    />
                                                </div>
                                            )
                                        })}
                                    </motion.div>
                                )}
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
