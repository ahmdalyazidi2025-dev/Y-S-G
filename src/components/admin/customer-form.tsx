"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { X, Save, User, Phone, Lock, Hash, MapPin, Check } from "lucide-react"
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
    const [showConfirm, setShowConfirm] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        username: "",
        email: "", // Added email field
        password: "",
        location: "",
        allowedCategories: "all" as string[] | "all"
    })

    useEffect(() => {
        if (!isOpen) {
            setShowConfirm(false);
            return;
        }

        const timer = setTimeout(() => {
            if (initialCustomer) {
                setFormData({
                    name: initialCustomer.name,
                    phone: initialCustomer.phone,
                    username: initialCustomer.username || initialCustomer.email.split('@')[0],
                    email: initialCustomer.email.includes('@ysg.local') ? "" : initialCustomer.email, // Only show if real email
                    password: initialCustomer.password || "", // Password is never pre-filled for security
                    location: initialCustomer.location || "",
                    allowedCategories: initialCustomer.allowedCategories || "all",
                })
            } else {
                setFormData({
                    name: "",
                    phone: "",
                    username: "",
                    email: "",
                    password: "",
                    location: "",
                    allowedCategories: "all",
                })
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [initialCustomer, isOpen])

    const handleInitialSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Check for missing optional fields
        if (!formData.phone || !formData.location) {
            setShowConfirm(true)
        } else {
            console.log("All fields present, saving directly")
            performSave()
        }
    }

    const performSave = () => {
        // Use provided email OR generate fake one based on username
        const finalEmail = formData.email && formData.email.includes('@')
            ? formData.email
            : `${formData.username}@ysg.local`

        if (initialCustomer) {
            updateCustomer(initialCustomer.id, {
                name: formData.name,
                phone: formData.phone,
                email: finalEmail,
                username: formData.username,
                password: formData.password || undefined,
                location: formData.location,
                allowedCategories: formData.allowedCategories
            })
        } else {
            addCustomer({
                name: formData.name,
                phone: formData.phone,
                email: finalEmail, // Pass the chosen email
                username: formData.username,
                password: formData.password,
                location: formData.location,
                allowedCategories: formData.allowedCategories
            } as any)
        }
        setShowConfirm(false)
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

                    {/* Confirmation Modal */}
                    <AnimatePresence>
                        {showConfirm && (
                            <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl"
                                >
                                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Hash className="w-8 h-8 text-yellow-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">بيانات ناقصة!</h3>
                                    <p className="text-slate-400 text-sm">
                                        لم تقم بتعبئة بعض البيانات الاختيارية (الهاتف أو الموقع). <br />
                                        هل أنت متأكد من الحفظ بدونها؟
                                    </p>
                                    <div className="flex gap-3 pt-2">
                                        <Button onClick={performSave} className="flex-1 bg-primary text-white font-bold h-11 rounded-xl">
                                            نعم، حفظ
                                        </Button>
                                        <Button onClick={() => setShowConfirm(false)} variant="outline" className="flex-1 border-white/10 hover:bg-white/5 h-11 rounded-xl">
                                            لا، العودة
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

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

                        <form onSubmit={handleInitialSubmit} className="space-y-4">
                            {/* 1. Username */}
                            <div className="space-y-2">
                                <Label className="text-right block">اسم المستخدم (للدخول)</Label>
                                <Input
                                    required
                                    className="bg-black/20 border-white/10 text-right font-bold text-primary"
                                    placeholder="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\s/g, '').toLowerCase() })}
                                />
                                <p className="text-[10px] text-slate-500 text-right">سيتم استخدامه لتسجيل الدخول (إجباري)</p>
                            </div>

                            {/* Email (Optional for Recovery) */}
                            <div className="space-y-2">
                                <Label className="text-right block">البريد الإلكتروني (للاستعادة)</Label>
                                <Input
                                    type="email"
                                    className="bg-black/20 border-white/10 text-right"
                                    placeholder="example@gmail.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <p className="text-[10px] text-yellow-500/80 text-right">هام: أدخل بريد حقيقي لتمكين استعادة كلمة المرور للعميل</p>
                            </div>

                            {/* 2. Password */}
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

                            {/* 3. Name */}
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

                            {/* 4. Phone (Optional) */}
                            <div className="space-y-2">
                                <Label className="text-slate-400">رقم الهاتف (اختياري)</Label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                                    <Input
                                        type="tel"
                                        className="bg-black/20 border-white/10 pr-10 text-right"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* 5. Location (Optional) */}
                            <div className="space-y-2">
                                <Label className="text-slate-400">الموقع (اختياري)</Label>
                                <div className="relative">
                                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-500" />
                                    <Input
                                        className="bg-black/20 border-white/10 pr-10 text-right"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Category Access Control */}
                            <div className="space-y-3 pt-2 border-t border-white/10">
                                <Label className="text-base font-bold text-primary">صلاحيات الأقسام</Label>
                                <p className="text-[10px] text-slate-400">حدد الأقسام التي يسمح لهذا العميل برؤيتها في المتجر.</p>

                                <CategorySelector
                                    selected={formData.allowedCategories}
                                    onChange={(newSelection) => setFormData({ ...formData, allowedCategories: newSelection })}
                                />
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

function CategorySelector({ selected, onChange }: { selected: string[] | "all", onChange: (val: string[] | "all") => void }) {
    const { categories } = useStore()

    // Helper to check if a specific ID is selected
    const isSelected = (id: string) => {
        if (selected === "all") return true
        return selected.includes(id)
    }

    const toggleAll = () => {
        if (selected === "all") {
            // Deselect all
            onChange([])
        } else {
            // Select all
            onChange("all")
        }
    }

    const toggleCategory = (id: string) => {
        if (selected === "all") {
            // If strictly unchecking one item from "all", switch to array of all-minus-one
            const allIds = categories.map(c => c.id)
            onChange(allIds.filter(cId => cId !== id))
        } else {
            if (selected.includes(id)) {
                // Deselecting one
                const newVal = selected.filter(cId => cId !== id)
                onChange(newVal)
            } else {
                // Selecting one
                const newVal = [...selected, id]
                // Check if we selected everything manually -> switch to "all"
                if (newVal.length === categories.length) {
                    onChange("all")
                } else {
                    onChange(newVal)
                }
            }
        }
    }

    return (
        <div className="space-y-2">
            {/* Select All Button */}
            <div
                onClick={toggleAll}
                className={`
                    flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all
                    ${selected === "all" ? 'bg-primary/20 border-primary text-white' : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5'}
                `}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selected === "all" ? 'bg-primary border-primary' : 'border-slate-600'}`}>
                    {selected === "all" && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="text-sm font-bold">كل الأقسام</span>
            </div>

            {/* Grid of Categories */}
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 customer-scrollbar">
                {categories.map(cat => {
                    const active = isSelected(cat.id)
                    return (
                        <div
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className={`
                                flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all
                                ${active ? 'bg-primary/10 border-primary/50 text-white' : 'bg-black/10 border-white/5 text-slate-500 hover:bg-white/5'}
                            `}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${active ? 'bg-primary border-primary' : 'border-slate-700'}`}>
                                {active && <Check className="w-3 h-3 text-black" />}
                            </div>
                            <span className="text-xs truncate">{cat.nameAr}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
