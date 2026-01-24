"use client"

import { useState } from "react"
import { useStore } from "@/context/store-context"
import { toast } from "sonner"
import { hapticFeedback } from "@/lib/haptics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, CheckCircle, Circle, PlusSquare, Lock, Edit } from "lucide-react"

export function StaffManager() {
    const { staff, addStaff, deleteStaff, updateStaff, currentUser, resetPassword } = useStore() // Added resetPassword
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newStaff, setNewStaff] = useState({
        name: "",
        username: "",
        email: "", // Added
        password: "",
        role: "staff" as "admin" | "staff",
        permissions: ["orders"] as string[]
    })

    const resetForm = () => {
        setNewStaff({ name: "", username: "", email: "", password: "", role: "staff", permissions: ["orders"] })
        setIsAdding(false)
        setEditingId(null)
    }

    const handleSave = () => {
        if (!newStaff.name || !newStaff.username) {
            toast.error("يرجى إكمال البيانات الأساسية")
            return
        }

        if (editingId) {
            // Update existing
            const staffMember = staff.find(s => s.id === editingId)
            if (staffMember) {
                updateStaff({
                    ...staffMember,
                    name: newStaff.name,
                    role: newStaff.role,
                    permissions: newStaff.role === "admin" ? [] : newStaff.permissions, // Admin gets full perms implicitly in backend or UI logic
                    email: staffMember.email // Keep original email/username
                })
            }
            resetForm()
        } else {
            // Add new
            if (!newStaff.password) {
                toast.error("كلمة المرور مطلوبة للحساب الجديد")
                return
            }

            // Should we force a real email? 
            // If user puts an email, use it. If not, auto-generate (legacy) but warn regarding reset?
            // The prompt implies we WANT to support recovery. So let's default to auto-gen if empty, BUT allow input.
            // Better: use username logic to generate email only if email is empty.

            let finalEmail = newStaff.email
            if (!finalEmail) {
                finalEmail = `${newStaff.username}@ysg.local`
            }

            addStaff({
                ...newStaff,
                email: finalEmail
                // username is passed spread from newStaff 
            })
            resetForm()
        }
        hapticFeedback('success')
    }

    const startEdit = (member: any) => {
        // Extract username from email (user@ysg.local -> user) or lookup?
        // Ideally we should have saved username in the staff doc, but if not we guess it.
        // If it's a real email, username is not obvious unless we saved it.
        // Let's assume for editing we just show the email.
        const isLegacy = member.email.includes("@ysg.local")
        const username = member.username || (isLegacy ? member.email.split("@")[0] : "")

        setNewStaff({
            name: member.name,
            username: username,
            email: member.email,
            password: "", // Password not editable directly here for security/complexity, or maybe optional?
            role: member.role,
            permissions: member.permissions || []
        })
        setEditingId(member.id)
        setIsAdding(true)
    }

    const addCurrentUser = () => {
        if (!currentUser) return

        // Check if already exists
        if (staff.some(s => s.id === currentUser.id)) {
            toast.info("أنت موجود بالفعل في قائمة الموظفين")
            return
        }

        const staffData = {
            id: currentUser.id, // Important to reuse ID
            name: currentUser.name,
            email: currentUser.username.includes('@') ? currentUser.username : `${currentUser.username}@ysg.local`,
            role: "admin" as const,
            permissions: ["orders", "products", "customers", "settings", "chat", "sales", "admins"],
            password: "existing_user" // Dummy password as auth is already handled
        }

        // We use addStaff but simpler
        addStaff(staffData)
        toast.success("تم إضافة حسابك الحالي كمسؤول")
        hapticFeedback('success')
    }

    const togglePermission = (perm: string) => {
        if (newStaff.role === "admin") return;
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
            {/* Add Current User Shortcut */}
            {currentUser && !staff.some(s => s.id === currentUser.id) && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
                            {currentUser.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">حسابك الحالي ({currentUser.name})</p>
                            <p className="text-[10px] text-emerald-400">لست في قائمة الموظفين بعد</p>
                        </div>
                    </div>
                    <Button size="sm" onClick={addCurrentUser} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8">
                        إضافة كمسؤول
                    </Button>
                </div>
            )}

            <div className="space-y-2">
                {staff.map(member => (
                    <div key={member.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between group">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-white">{member.name}</p>
                                {member.role === "admin" && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">مسؤول</span>}
                                {currentUser?.id === member.id && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">أنت</span>}
                            </div>
                            <p className="text-[10px] text-slate-500">{member.email.split('@')[0]} • {member.permissions.length} صلاحيات</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg text-blue-400 hover:bg-blue-400/10 text-xs"
                                onClick={() => startEdit(member)}
                            >
                                تعديل
                            </Button>

                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg text-emerald-400 hover:bg-emerald-400/10 text-xs"
                                onClick={() => {
                                    if (confirm("هل أنت متأكد من إرسال رابط استعادة كلمة المرور لهذا المستخدم؟")) {
                                        resetPassword(member.email)
                                    }
                                }}
                            >
                                <Lock className="w-4 h-4" />
                            </Button>

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
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-primary">{editingId ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</h3>
                    </div>

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
                                disabled={!!editingId} // Disable username edit to prevent email mismatches
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[10px]">البريد الإلكتروني (للاستعادة)</Label>
                        <Input
                            placeholder="email@example.com (اختياري)"
                            value={newStaff.email}
                            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                            className="bg-black/40 h-10 text-xs text-right"
                        />
                        <p className="text-[9px] text-slate-500">يفضل استخدام بريد حقيقي لاستعادة كلمة المرور</p>
                    </div>
                    {!editingId && (
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
                    )}

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
                        <Button className="flex-1 h-10 text-xs" onClick={handleSave}>{editingId ? "حفظ التعديلات" : "إضافة"}</Button>
                        <Button variant="ghost" className="h-10 text-xs" onClick={resetForm}>إلغاء</Button>
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
