"use client"

import { useState } from "react"
import { useStore } from "@/context/store-context"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, CheckCircle, Circle, PlusSquare } from "lucide-react"

export function StaffManager() {
    const { staff, addStaff, deleteStaff } = useStore()
    const [isAdding, setIsAdding] = useState(false)
    const [newStaff, setNewStaff] = useState({
        name: "",

        username: "",
        password: "",
        role: "staff" as "admin" | "staff",
        permissions: ["orders"] as string[]
    })

    const handleAdd = () => {
        if (!newStaff.name || !newStaff.username || !newStaff.password) {
            toast.error("يرجى إكمال جميع البيانات")
            return
        }

        const generatedEmail = `${newStaff.username}@ysg.local`
        addStaff({ ...newStaff, email: generatedEmail })

        setNewStaff({ name: "", username: "", password: "", role: "staff", permissions: ["orders"] })
        setIsAdding(false)
        hapticFeedback('success')
    }

    const togglePermission = (perm: string) => {
        if (newStaff.role === "admin") return; // Admins have all perms
        setNewStaff(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }))
        hapticFeedback('light')
    }

    const ALL_PERMS = [
        { id: "orders", label: "الطلبات" },
        { id: "products", label: "المنتجات" },
        { id: "customers", label: "العملاء" },
        { id: "settings", label: "الإعدادات" },
        { id: "chat", label: "المحادثات" },
        { id: "sales", label: "المبيعات" },
    ]

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {staff.map(member => (
                    <div key={member.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-white">{member.name}</p>
                                {member.role === "admin" && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">مسؤول</span>}
                            </div>
                            <p className="text-[10px] text-slate-500">{member.email.split('@')[0]} • {member.permissions.length} صلاحيات</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-400/10"
                                onClick={() => deleteStaff(member.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px]">الاسم</Label>
                            <Input
                                placeholder="اسم الموظف"
                                value={newStaff.name}
                                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                className="bg-black/40 h-10 text-xs text-right"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px]">اسم المستخدم</Label>
                            <Input
                                placeholder="username"
                                value={newStaff.username}
                                onChange={e => setNewStaff({ ...newStaff, username: e.target.value.replace(/\s/g, '').toLowerCase() })}
                                className="bg-black/40 h-10 text-xs text-right dir-rtl"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px]">كلمة المرور</Label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={newStaff.password}
                            onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                            className="bg-black/40 h-10 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px]">نوع الحساب</Label>
                        <div className="flex gap-2 bg-black/40 p-1 rounded-lg">
                            <button
                                onClick={() => setNewStaff({ ...newStaff, role: "staff" })}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${newStaff.role === "staff" ? "bg-white/10 text-white" : "text-slate-500"}`}
                            >موظف</button>
                            <button
                                onClick={() => setNewStaff({ ...newStaff, role: "admin", permissions: ALL_PERMS.map(p => p.id) })}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${newStaff.role === "admin" ? "bg-primary text-black font-bold" : "text-slate-500"}`}
                            >مسؤول (Admin)</button>
                        </div>
                    </div>

                    <div className={`space-y-2 ${newStaff.role === "admin" ? "opacity-50 pointer-events-none" : ""}`}>
                        <Label className="text-[10px]">الصلاحيات {newStaff.role === "admin" && "(المدير يملك كافة الصلاحيات)"}</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {ALL_PERMS.map(perm => (
                                <button
                                    key={perm.id}
                                    type="button"
                                    onClick={() => togglePermission(perm.id)}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${newStaff.permissions.includes(perm.id)
                                        ? "bg-primary/20 border-primary text-primary"
                                        : "bg-black/40 border-white/5 text-slate-500 hover:border-white/10"
                                        }`}
                                >
                                    {newStaff.permissions.includes(perm.id) ? (
                                        <CheckCircle className="w-3 h-3" />
                                    ) : (
                                        <Circle className="w-3 h-3" />
                                    )}
                                    {perm.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button className="flex-1 h-10 text-xs" onClick={handleAdd}>إضافة</Button>
                        <Button variant="ghost" className="h-10 text-xs" onClick={() => setIsAdding(false)}>إلغاء</Button>
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 h-12 rounded-xl text-xs gap-2"
                    onClick={() => setIsAdding(true)}
                >
                    <PlusSquare className="w-4 h-4" />
                    <span>إضافة عضو جديد</span>
                </Button>
            )}
        </div>
    )
}
