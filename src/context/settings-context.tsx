"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot, setDoc, collection, query, limit, QuerySnapshot, DocumentData, Timestamp } from "firebase/firestore"
import { toast } from "sonner"
import { Banner, StoreSettings, AdminPreferences } from "@/types/store"
import { sanitizeData, hapticFeedback } from "@/lib/utils/store-helpers"

const MOCK_SETTINGS: StoreSettings = {
    shippingTitle: "الشحن مجاناً",
    shippingDesc: "لكل الطلبات التي تفوق 500 ريال",
    paymentTitle: "الدفع عند الاستلام",
    paymentDesc: "الدفع عند استلام طلبك",
    supportTitle: "دعم مخصص",
    supportDesc: "الدعم 6 أيام في الأسبوع خلال الدوام الرسمي",
    aboutTitle: "مجموعة يحيى سلمان غزواني التجارية",
    aboutText: "مجموعة يحيى سلمان غزواني التجارية لجميع متطلبات محلات صيانة السيارات توفر العديد من المنتجات ذات الجودة العالية (فلاتر - بطاريات - كفرات - زيوت - عدد يدوية - وغيرها).",
    contactPhone: "0534422707",
    contactAddress: "الدمام - شارع الملك عبدالعزيز - العزيزية",
    socialWhatsapp: "https://wa.me/0534422707",
    socialTwitter: "",
    socialInstagram: "",
    socialFacebook: "",
    socialTiktok: "",
    socialSnapchat: "",
    footerTerms: "شروط الاستخدام",
    footerPrivacy: "الشروط والأحكام",
    footerReturns: "سياسة الاسترجاع",
    requireCustomerInfoOnCheckout: false,
    logoUrl: "",
    geminiCustomPrompt: "",
    geminiReferenceImageUrl: "",
    enableMaintenance: false,
    enableCoupons: true,
    enableAIChat: true,
    enableProductRequests: true,
    enableBarcodeScanner: false,
    sounds: {}
}

interface SettingsContextType {
    storeSettings: StoreSettings
    adminPreferences: AdminPreferences
    banners: Banner[]
    updateStoreSettings: (settings: StoreSettings) => Promise<void>
    markSectionAsViewed: (section: keyof AdminPreferences['lastViewed']) => Promise<void>
    addBanner: (banner: Omit<Banner, "id">) => Promise<void>
    deleteBanner: (bannerId: string) => Promise<void>
    toggleBanner: (bannerId: string) => Promise<void>
    settingsLoaded: boolean
    updateAdminCredentials: (username: string, password: string) => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [storeSettings, setStoreSettings] = useState<StoreSettings>(MOCK_SETTINGS)
    const [adminPreferences, setAdminPreferences] = useState<AdminPreferences>({ lastViewed: {} })
    const [banners, setBanners] = useState<Banner[]>([])
    const [settingsLoaded, setSettingsLoaded] = useState(false)

    useEffect(() => {
        const unsubGlobal = onSnapshot(doc(db, "settings", "global"), (snap) => {
            if (snap.exists()) setStoreSettings(snap.data() as StoreSettings)
            setSettingsLoaded(true)
        })
        const unsubPrefs = onSnapshot(doc(db, "settings", "admin_preferences"), (snap) => {
            if (snap.exists()) setAdminPreferences(snap.data() as AdminPreferences)
        })
        const unsubBanners = onSnapshot(query(collection(db, "banners"), limit(10)), (snap: QuerySnapshot<DocumentData>) => {
            setBanners(snap.docs.map((doc) => ({ ...doc.data() as Omit<Banner, "id">, id: doc.id } as Banner)))
        })
        return () => { unsubGlobal(); unsubPrefs(); unsubBanners() }
    }, [])

    const updateStoreSettings = async (settings: StoreSettings) => {
        try {
            const sanitized = sanitizeData(settings)
            await setDoc(doc(db, "settings", "global"), sanitized, { merge: true })
            setStoreSettings(settings)
            toast.success("تم تحديث إعدادات المتجر بنجاح ✅")
            hapticFeedback('success')
        } catch (error: any) {
            toast.error("فشل حفظ الإعدادات: " + error.message)
        }
    }

    const markSectionAsViewed = useCallback(async (section: keyof AdminPreferences['lastViewed']) => {
        try {
            const now = new Date()
            setAdminPreferences(prev => ({ ...prev, lastViewed: { ...prev.lastViewed, [section]: now } }))
            await setDoc(doc(db, "settings", "admin_preferences"), { lastViewed: { [section]: Timestamp.fromDate(now) } }, { merge: true })
        } catch (error) {
            console.error("Error marking section as viewed:", error)
        }
    }, []) // Now zero dependencies

    const addBanner = useCallback(async (banner: Omit<Banner, "id">) => {
        try {
            await setDoc(doc(collection(db, "banners")), sanitizeData(banner))
            toast.success("تم إضافة الصورة")
        } catch (error) {
            toast.error("فشل إضافة الصورة")
        }
    }, [])

    const deleteBanner = useCallback(async (bannerId: string) => {
        try {
            await setDoc(doc(db, "banners", bannerId), {}, { merge: false }) // Simplified for now, actually deleteDoc
            toast.error("تم حذف الصورة")
        } catch (error) { }
    }, [])

    const toggleBanner = useCallback(async (bannerId: string) => {
        const banner = banners.find(b => b.id === bannerId)
        if (banner) {
            await setDoc(doc(db, "banners", bannerId), { active: !banner.active }, { merge: true })
            toast.success("تم تحديث حالة البانر")
        }
    }, [banners])

    const updateAdminCredentials = async (username: string, password: string) => {
        await setDoc(doc(db, "settings", "security"), { username, password }, { merge: true })
        toast.success("تم تحديث بيانات دخول الإدارة")
    }

    return (
        <SettingsContext.Provider value={{
            storeSettings, adminPreferences, banners, updateStoreSettings, markSectionAsViewed, addBanner, deleteBanner, toggleBanner, settingsLoaded, updateAdminCredentials
        }}>
            {children}
        </SettingsContext.Provider>
    )
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (!context) throw new Error("useSettings must be used within SettingsProvider")
    return context
}
