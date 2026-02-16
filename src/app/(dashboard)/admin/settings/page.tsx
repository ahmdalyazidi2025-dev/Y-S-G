"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useStore, StoreSettings } from "@/context/store-context"
// import { CouponManager } from "@/components/admin/coupon-manager"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Save, ArrowRight, Truck, Info, Phone, FileText, Download, BarChart3, ShoppingBag, Music, Volume2, RotateCcw, Upload, Layers, Printer, Scan, Play, Database
} from "lucide-react"
import Link from "next/link"
// import { useSounds, SoundEvent } from "@/hooks/use-sounds" // Missing hook, using store version
import { exportToCSV, exportComprehensiveReport, exportFullSystemBackup, exportCustomersToWord, exportStaffToWord } from "@/lib/export-utils"
import { hapticFeedback } from "@/lib/haptics"
// import { sendPushNotification, broadcastPushNotification, getRegisteredTokensCount } from "@/app/actions/notifications"
import { useFcmToken } from "@/hooks/use-fcm-token"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { Lock, Shield, UserPlus } from "lucide-react"
// import { StaffManager } from "@/components/admin/staff-manager"
import { verifyAIKey } from "@/app/actions/ai"
import { Switch } from "@/components/ui/switch"
// import { WheelPicker } from "@/components/shared/wheel-picker"

import { printProductList } from "@/lib/print-product-list"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const PROTECTED_PIN = "4422707";

type SoundEvent = 'newOrder' | 'newMessage' | 'statusUpdate' | 'generalPush' | 'passwordRequest';

export default function AdminSettingsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <AdminSettingsContent />
        </Suspense>
    )
}

function AdminSettingsContent() {
    const { storeSettings, updateStoreSettings, currentUser } = useStore()
    const [activeTab, setActiveTab] = useState<'identity' | 'alerts' | 'coupons' | 'data' | 'entity'>('identity')

    // Security State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [pin, setPin] = useState("")

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
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                    <Lock className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">منطقة محمية</h1>
                    <p className="text-muted-foreground text-sm">أدخل رمز الحماية الخاص بالإدارة للوصول للاعدادات</p>
                </div>
                <form onSubmit={verifyPin} className="max-w-xs w-full space-y-4">
                    <Input
                        type="password"
                        placeholder="رمز الحماية"
                        className="bg-background border-border text-center text-lg tracking-widest h-12 text-foreground"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold h-12">
                        دخول لصفحة الإعدادات
                    </Button>
                </form>
            </div>
        )
    }

    return (
        <div className="p-10">
            <h1>Admin Settings Debug Mode</h1>
            <p>Active Tab: {activeTab}</p>
            <div className="flex gap-2 mt-4">
                <Button onClick={() => setActiveTab('identity')}>Identity</Button>
                <Button onClick={() => setActiveTab('alerts')}>Alerts</Button>
                <Button onClick={() => setActiveTab('coupons')}>Coupons</Button>
                <Button onClick={() => setActiveTab('data')}>Data</Button>
                <Button onClick={() => setActiveTab('entity')}>Entity</Button>
            </div>
        </div>
    )
}
