"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Shield, Save, UserPlus, ArrowRight } from "lucide-react"
import Link from "next/link"
// import { toast } from "sonner"
import { StaffManager } from "@/components/admin/staff-manager"
import { Input } from "@/components/ui/input"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { verifyGeminiKey } from "@/app/actions/gemini"


const PROTECTED_PIN = "4422707";

export default function EntityManagementPage() {
    const { storeSettings, updateStoreSettings } = useStore()
    const [settings, setSettings] = useState(storeSettings)
    const [isSaving, setIsSaving] = useState(false)

    // Security State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [pin, setPin] = useState("")

    useEffect(() => {
        setSettings(storeSettings)
    }, [storeSettings])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateStoreSettings(settings)
            await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const verifyPin = (e: React.FormEvent) => {
        e.preventDefault()
        if (pin === PROTECTED_PIN) {
            setIsAuthenticated(true)
            toast.success("تم تأكيد الرمز")
        } else {
            toast.error("رمز الدخول غير صحيح")
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">منطقة محمية</h1>
                    <p className="text-slate-400 text-sm">أدخل رمز الحماية الخاص بالإدارة للوصول لهذه الصفحة</p>
                </div>
                <form onSubmit={verifyPin} className="max-w-xs w-full space-y-4">
                    <Input
                        type="password"
                        placeholder="رمز الحماية"
                        className="bg-black/40 border-white/10 text-center text-lg tracking-widest h-12"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" className="w-full bg-primary text-black font-bold h-12">
                        دخول
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        إدارة الكيان
                    </h1>
                    <p className="text-slate-400 text-sm">إدارة الموظفين وصلاحياتهم وإعدادات العملاء</p>
                </div>
                <div className="mr-auto">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Mandatory Info Section */}
                <div className="glass-card p-6 space-y-4">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                        <Shield className="w-5 h-5" />
                        <h2 className="font-bold">سياسات العملاء</h2>
                    </div>

                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label className="text-white font-bold cursor-pointer" onClick={() => setSettings({ ...settings, requireCustomerInfoOnCheckout: !settings.requireCustomerInfoOnCheckout })}>
                                إلزام العميل بالاسم ورقم الجوال
                            </Label>
                            <span className="text-[10px] text-slate-400">لن يتمكن العميل من إتمام الطلب دون تعبئة بياناته</span>
                        </div>
                        <div
                            onClick={() => setSettings({ ...settings, requireCustomerInfoOnCheckout: !settings.requireCustomerInfoOnCheckout })}
                            className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors ${settings.requireCustomerInfoOnCheckout ? 'bg-primary' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${settings.requireCustomerInfoOnCheckout ? 'left-1' : 'left-6'}`} />
                        </div>
                    </div>
                </div>

                {/* Staff Management Section */}
                <div className="glass-card p-6 space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                        <UserPlus className="w-5 h-5" />
                        <h2 className="font-bold">إدارة الموظفين</h2>
                    </div>

                    <StaffManager />
                </div>
                {/* Security Section */}
                <div className="glass-card p-6 space-y-6">
                    <div className="flex items-center gap-3 text-primary border-b border-white/5 pb-4">
                        <Lock className="w-5 h-5" />
                        <h2 className="font-bold">الأمان وبيانات الدخول</h2>
                    </div>
                    <SecuritySettings />
                </div>
            </div>
        </div>
    )
}

function SecuritySettings() {
    const { updateAdminCredentials } = useStore()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const handleUpdate = async () => {
        if (!username || !password) return
        await updateAdminCredentials(username, password)
        setUsername("")
        setPassword("")
    }

    return (
        <div className="space-y-6">
            {/* Gemini API Key Section */}
            <div className="space-y-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">✨</span>
                    <Label className="text-primary font-bold">مفتاح الذكاء الاصطناعي (Google Gemini)</Label>
                </div>
                <p className="text-xs text-slate-400 mb-2">ضع المفتاح هنا لتفعيل مميزات "المساعد الذكي" وتحليل صور المنتجات.</p>
                <div className="flex gap-2">
                    <GeminiKeyInput />
                </div>

                {/* Advanced Gemini Settings */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <Label className="text-white font-bold flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        تخصيص المساعد (اختياري)
                    </Label>

                    <div className="space-y-2">
                        <Label className="text-xs text-slate-400">تعليمات تعديل/تحسين الصور (Prompt) - مثال: "اجعل الخلفية بيضاء نقية"</Label>
                        <CustomPromptInput />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-slate-400">رابط صورة مرجعية (للمقارنة)</Label>
                        <ReferenceImageInput />
                    </div>
                </div>
            </div>

            <hr className="border-white/5" />

            {/* Admin Credentials */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>اسم المستخدم الجديد</Label>
                    <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bg-black/20 border-white/10"
                        placeholder="ادخل اسم مستخدم جديد"
                    />
                </div>
                <div className="space-y-2">
                    <Label>كلمة المرور الجديدة</Label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black/20 border-white/10"
                        placeholder="ادخل كلمة مرور جديدة"
                    />
                </div>
                <Button
                    type="button"
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleUpdate}
                    disabled={!username || !password}
                >
                    تحديث بيانات الدخول
                </Button>
            </div>
        </div>
    )
}

interface AIKeyInputProps {
    index: number
    keyData: { key: string, status: "valid" | "invalid" | "unchecked" }
    onChange: (val: string) => void
    onBlur: () => void
    onStatusChange: (status: "valid" | "invalid" | "unchecked") => void
}

function SingleAIKeyInput({ index, keyData, onChange, onBlur, onStatusChange }: AIKeyInputProps) {
    const [show, setShow] = useState(false)
    const [checking, setChecking] = useState(false)

    const handleVerify = async () => {
        if (!keyData.key) return
        setChecking(true)
        try {
            const result = await verifyGeminiKey(keyData.key)
            if (result.success) {
                onStatusChange("valid")
                toast.success(`مفتاح ${index + 1} يعمل بنجاح ✅`)
            } else {
                onStatusChange("invalid")
                toast.error(`مفتاح ${index + 1} لا يعمل ❌`)
            }
        } catch (e) {
            onStatusChange("invalid")
            toast.error("خطأ في التحقق")
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
                <Input
                    type={show ? "text" : "password"}
                    value={keyData.key}
                    onChange={(e) => {
                        onChange(e.target.value)
                    }}
                    onBlur={onBlur}
                    className={`bg-black/20 border-white/10 pr-10 font-mono text-xs ${keyData.status === "valid" ? "border-green-500/50 focus:ring-green-500/20" : keyData.status === "invalid" ? "border-red-500/50 focus:ring-red-500/20" : ""}`}
                    placeholder={`Key #${index + 1} (AIzaSy...)`}
                />

                {/* Status Indicator */}
                <div className="absolute left-10 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {checking && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
                    {!checking && keyData.status === "valid" && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]" />}
                    {!checking && keyData.status === "invalid" && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.6)]" />}
                </div>

                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                    {show ? "إخفاء" : "عرض"}
                </button>
            </div>

            <Button
                type="button"
                onClick={handleVerify}
                disabled={checking || !keyData.key}
                size="sm"
                variant={keyData.status === "valid" ? "ghost" : "secondary"}
                className={`px-3 ${keyData.status === "valid" ? "text-green-500 hover:text-green-400" : ""}`}
            >
                {checking ? "..." : keyData.status === "valid" ? "✅" : "تحقق"}
            </Button>
        </div>
    )
}

function GeminiKeyInput() {
    const { storeSettings, updateStoreSettings } = useStore()

    // Initialize with 3 slots or existing
    const [keys, setKeys] = useState<{ key: string, status: "valid" | "invalid" | "unchecked" }[]>(() => {
        const existing = storeSettings.aiApiKeys || []
        // Fill up to 3 slots
        const filled = [...existing]
        while (filled.length < 3) {
            filled.push({ key: "", status: "unchecked" })
        }
        return filled.slice(0, 3)
    })

    // Update store only when finishing editing (onBlur behavior logic)
    // using a manual save trigger or debounced effect would be better,
    // but here we can just update the store on every change if we remove the dependency loop.
    // The issue was likely that updateStoreSettings caused a parent re-render which
    // re-initialized the component or conflict. 
    // Actually, 'useState' initializer only runs once.
    // BUT if the parent 'EntityManagementPage' re-renders, 'GeminiKeyInput' re-renders.
    // 'keys' state is kept.
    // The problem might come if 'storeSettings' updates cause 'keys' to be out of sync
    // if we don't watch storeSettings.

    // Simplest fix: Update store directly on change, but ensure we don't block UI.
    // However, frequent store updates can be laggy.

    // Let's implement a 'handleSave' or 'onBlur' equivalent found in other inputs.
    // Since we have multiple inputs, we can just update store on 'onChange' but 
    // maybe verify the input field implementation.

    // Actually, let's use a local effect but check if values actually changed markedly.
    // AND important: passing 'keys' back to store doesn't need to re-trigger this component
    // if we don't depend on storeSettings for 'keys' after mount.

    // Re-reading code: 'useEffect' dependency was '[keys]'. 
    // Inside: 'updateStoreSettings'. This updates context. 
    // Context update -> App re-render -> GeminiKeyInput re-render.
    // This cycle is usually fine unless 'updateStoreSettings' is slow or async in a way that
    // messes with React's batching.

    // Better approach: Sync on Blur for text, and immediately for status.

    const saveToStore = (newKeys: typeof keys) => {
        updateStoreSettings({ ...storeSettings, aiApiKeys: newKeys })
    }

    const updateKey = (index: number, val: string) => {
        const newKeys = [...keys]
        newKeys[index] = { ...newKeys[index], key: val, status: "unchecked" }
        setKeys(newKeys)
    }

    const handleBlur = () => {
        saveToStore(keys)
    }

    const updateStatus = (index: number, status: "valid" | "invalid" | "unchecked") => {
        const newKeys = [...keys]
        newKeys[index] = { ...newKeys[index], status }
        setKeys(newKeys)
        saveToStore(newKeys) // Save status immediately
    }

    return (
        <div className="w-full">
            <Label className="mb-2 block text-xs text-slate-400">مفاتيح الربط (3 مفاتيح احتياطية)</Label>
            {keys.map((k, i) => (
                <SingleAIKeyInput
                    key={i}
                    index={i}
                    keyData={k}
                    onChange={(val) => updateKey(i, val)}
                    onBlur={handleBlur}
                    onStatusChange={(status) => updateStatus(i, status)}
                />
            ))}
            <p className="text-[10px] text-slate-500 mt-1">
                سيقوم النظام باستخدام المفتاح الأول الصالح تلقائياً. إذا فشل، سينتقل للتالي.
            </p>
        </div>
    )
}


function CustomPromptInput() {
    const { storeSettings, updateStoreSettings } = useStore()
    const [value, setValue] = useState(storeSettings.geminiCustomPrompt || "")

    // Debounce save or save on blur
    const handleBlur = () => {
        if (value !== storeSettings.geminiCustomPrompt) {
            updateStoreSettings({ ...storeSettings, geminiCustomPrompt: value })
            toast.success("تم حفظ التعليمات الخاصة")
        }
    }

    return (
        <textarea
            className="w-full bg-black/20 border-white/10 rounded-xl p-3 text-sm h-24 focus:ring-1 focus:ring-primary outline-none resize-none text-right"
            placeholder="اكتب تعليماتك هنا..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
        />
    )
}

function ReferenceImageInput() {
    const { storeSettings, updateStoreSettings } = useStore()
    const [value, setValue] = useState(storeSettings.geminiReferenceImageUrl || "")

    const handleBlur = () => {
        if (value !== storeSettings.geminiReferenceImageUrl) {
            updateStoreSettings({ ...storeSettings, geminiReferenceImageUrl: value })
            toast.success("تم حفظ رابط الصورة المرجعية")
        }
    }

    return (
        <Input
            className="bg-black/20 border-white/10 text-left ltr"
            placeholder="https://example.com/reference-image.jpg"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
        />
    )
}
