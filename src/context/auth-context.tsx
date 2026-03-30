"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { auth, db, getSecondaryAuth } from "@/lib/firebase"
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail
} from "firebase/auth"
import { doc, getDoc, setDoc, onSnapshot, collection, query, QuerySnapshot, DocumentData, Timestamp, updateDoc, deleteDoc, arrayRemove } from "firebase/firestore"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { User, StaffMember } from "@/types/store"
import { sanitizeData, toDate } from "@/lib/utils/store-helpers"
import { adminCreateOrUpdateUserAction, adminDeleteUserAction } from "@/app/actions/auth-actions"

interface AuthContextType {
    currentUser: User | null
    guestId: string
    staff: StaffMember[]
    authInitialized: boolean
    login: (username: string, password: string, role: "admin" | "customer" | "staff") => Promise<boolean>
    logout: () => void
    addStaff: (member: Omit<StaffMember, "id" | "createdAt" | "role"> & { password?: string, role: "admin" | "staff" }) => Promise<void>
    updateStaff: (member: StaffMember) => Promise<void>
    deleteStaff: (memberId: string) => Promise<void>
    addExistingUserAsStaff: (user: User) => Promise<void>
    resetPassword: (email: string) => Promise<boolean>
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [guestId, setGuestId] = useState<string>("guest")
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [authInitialized, setAuthInitialized] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== "undefined") {
            let storedId = localStorage.getItem("store_guest_id")
            if (!storedId) {
                storedId = "guest_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
                localStorage.setItem("store_guest_id", storedId)
            }
            setGuestId(storedId)
        }
    }, [])

    useEffect(() => {
        const savedUser = localStorage.getItem("ysg_user")
        if (savedUser && !currentUser) {
            try {
                setCurrentUser(JSON.parse(savedUser))
            } catch (e) {
                console.error("Failed to parse saved user", e)
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    if (firebaseUser.isAnonymous) {
                        const guestUser: User = {
                            id: firebaseUser.uid,
                            name: "زائر",
                            role: "guest",
                            email: "guest@ysg.local",
                            username: `guest_${firebaseUser.uid.substring(0, 5)}`,
                            isAnonymous: true,
                            lastActive: new Date()
                        }
                        setCurrentUser(guestUser)
                    } else {
                        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
                        if (userDoc.exists()) {
                            const userData = userDoc.data() as User
                            if (["ahmd.alyazidi2030@gmail.com", "ahmd.alyazidi2025@gmail.com"].includes(firebaseUser.email || "")) {
                                if (userData.role !== "admin" || !userData.permissions?.includes("all")) {
                                    const newUserData = { ...userData, role: "admin", permissions: ["all"] }
                                    await setDoc(doc(db, "users", firebaseUser.uid), newUserData, { merge: true })
                                    setCurrentUser(newUserData as User)
                                    localStorage.setItem("ysg_user", JSON.stringify(newUserData))
                                    toast.success("تم ترقية حسابك لمدير تلقائياً! 🚀")
                                    return
                                }
                            }
                            setCurrentUser(userData)
                            localStorage.setItem("ysg_user", JSON.stringify(userData))
                        } else if (["admin@store.com", "ahmd.alyazidi2030@gmail.com", "ahmd.alyazidi2025@gmail.com"].includes(firebaseUser.email || "")) {
                            const adminUser: User = {
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || "المشرف العام",
                                role: "admin",
                                username: firebaseUser.email || "admin",
                                permissions: ["all"]
                            }
                            setCurrentUser(adminUser)
                            await setDoc(doc(db, "users", firebaseUser.uid), adminUser)
                            localStorage.setItem("ysg_user", JSON.stringify(adminUser))
                        }
                    }
                } else {
                    setCurrentUser(null)
                    localStorage.removeItem("ysg_user")
                }
            } catch (error) {
                console.error("Auth State Change Error:", error)
            } finally {
                setAuthInitialized(true)
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        if (currentUser?.role === 'admin' || currentUser?.role === 'staff') {
            const unsubStaff = onSnapshot(collection(db, "staff"), (snap: QuerySnapshot<DocumentData>) => {
                setStaff(snap.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt ? toDate(data.createdAt) : undefined
                    } as StaffMember
                }))
            }, (error) => {
                console.error("Staff List Error:", error);
                toast.error("فشل في تحميل قائمة الموظفين (مشكلة في الصلاحيات)");
            })
            return () => unsubStaff()
        }
    }, [currentUser])

    const login = useCallback(async (username: string, password: string, role: "admin" | "customer" | "staff"): Promise<boolean> => {
        try {
            let finalEmail = username.trim()
            if (role === "customer" && !finalEmail.includes("@")) {
                finalEmail = `${finalEmail.toLowerCase().replace(/\s/g, '')}@ysg.local`
            }
            if ((role === "admin" || role === "staff") && !finalEmail.includes("@")) {
                const usernameDoc = await getDoc(doc(db, "usernames", finalEmail.toLowerCase().trim()))
                if (usernameDoc.exists()) finalEmail = usernameDoc.data().email
                else finalEmail = `${finalEmail.toLowerCase().trim()}@ysg.local`
            }
            const userCredential = await signInWithEmailAndPassword(auth, finalEmail, password)

            // Validate Role safely
            let actualRole = "customer"
            try {
                const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
                if (userDoc.exists()) {
                    actualRole = userDoc.data().role || "customer"
                }

                if ((role === "admin" || role === "staff") && actualRole === "customer") {
                    await firebaseSignOut(auth)
                    toast.error("هذا الحساب مخصص للعملاء، يرجى الدخول من واجهة العملاء")
                    return false
                }

                if (role === "customer" && (actualRole === "admin" || actualRole === "staff")) {
                    await firebaseSignOut(auth)
                    toast.error("هذا الحساب مخصص للإدارة، يرجى الدخول من لوحة التحكم")
                    return false
                }
            } catch (roleError: any) {
                console.error("Role validation error (ignored):", roleError)
                // If it crashes during validation, just let them in to avoid blocking legitimate users.
            }

            // Set cookie for middleware protection
            const token = await userCredential.user.getIdToken()
            const roleMatch = actualRole || "customer"
            document.cookie = `firebase-auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
            document.cookie = `user-role=${roleMatch}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`

            return true
        } catch (error) {
            console.error("Login Error:", error)
            toast.error("بيانات الدخول غير صحيحة")
            return false
        }
    }, [])

    const logout = useCallback(async () => {
        if (currentUser && currentUser.id) {
            try {
                const token = localStorage.getItem('fcm_token')
                if (token) {
                    const collectionName = currentUser.role === "admin" || currentUser.role === "staff" ? "staff" : "customers"
                    const userRef = doc(db, collectionName, currentUser.id)
                    await updateDoc(userRef, {
                        fcmTokens: arrayRemove(token)
                    })
                    localStorage.removeItem('fcm_token')
                }
            } catch (error) {
                console.error("Failed to remove FCM token on logout:", error)
            }
        }
        await firebaseSignOut(auth)
        setCurrentUser(null)
        localStorage.removeItem("ysg_user")
        document.cookie = "firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/login")
    }, [router, currentUser])

    const resetPassword = useCallback(async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email)
            toast.success("تم إرسال رابط استعادة كلمة المرور للبريد الإلكتروني")
            return true
        } catch (error: any) {
            toast.error("فشل إرسال الرابط: " + error.message)
            return false
        }
    }, [])

    const addStaff = useCallback(async (member: Omit<StaffMember, "id" | "createdAt" | "role"> & { password?: string, role: "admin" | "staff" }) => {
        try {
            if (!member.phone) throw new Error("رقم الهاتف مطلوب")
            const normalizedUsername = (member as any).username?.toLowerCase().trim() || member.name.replace(/\s/g, '').toLowerCase()
            const generatedEmail = `${normalizedUsername}@staff.ysg.local`

            const result = await adminCreateOrUpdateUserAction(generatedEmail, member.password || "Ysg@2025", member.name, currentUser?.id);
            if (!result.success || !result.uid) {
                throw new Error(result.error || "فشل إنشاء حساب المشرف في الخادم");
            }
            const uid = result.uid;

            await setDoc(doc(db, "users", uid), {
                id: uid, name: member.name, role: member.role, email: generatedEmail, username: normalizedUsername, phone: member.phone,
                permissions: member.role === "admin" ? ["all"] : member.permissions
            })
            await setDoc(doc(db, "usernames", normalizedUsername), { email: generatedEmail, uid })
            await setDoc(doc(db, "staff", uid), sanitizeData({ ...member, id: uid, email: generatedEmail, createdAt: Timestamp.now() }))

            toast.success("تم إضافة الموظف بنجاح ✅")
        } catch (error: any) {
            toast.error("فشل إضافة الموظف: " + error.message)
        }
    }, [])

    const updateStaff = useCallback(async (member: StaffMember & { password?: string }) => {
        try {
            const { id, password, ...data } = member

            // Update Auth if password changed
            if (password) {
                const result = await adminCreateOrUpdateUserAction(member.email, password, member.name, currentUser?.id);
                if (!result.success) {
                    console.error("Admin Auth update warning:", result.error);
                    throw new Error(result.error || "فشل تحديث كلمة المرور في الخادم");
                }
            }

            await updateDoc(doc(db, "staff", id), sanitizeData(data))
            await setDoc(doc(db, "users", id), {
                id, name: member.name, role: member.role, email: member.email, phone: member.phone,
                permissions: member.role === "admin" ? ["all"] : member.permissions
            }, { merge: true })
            toast.success("تم تحديث بيانات الموظف")
        } catch (e: any) {
            toast.error("فشل تحديث البيانات: " + e.message)
        }
    }, [])

    const deleteStaff = useCallback(async (memberId: string) => {
        try {
            const member = staff.find(s => s.id === memberId)

            // Delete from Auth securely via Admin SDK Server Action
            const result = await adminDeleteUserAction(memberId, currentUser?.id);
            if (!result.success) {
                console.error("Admin Auth delete warning:", result.error);
                // We proceed anyway to ensure clean Firestore, as auth might already be deleted.
            }

            await deleteDoc(doc(db, "staff", memberId))
            await deleteDoc(doc(db, "users", memberId))
            if (member?.username) await deleteDoc(doc(db, "usernames", member.username.toLowerCase()))
            toast.error("تم حذف الموظف")
        } catch (e: any) {
            toast.error("فشل حذف الموظف: " + e.message)
        }
    }, [staff])

    const addExistingUserAsStaff = useCallback(async (user: User) => {
        try {
            await setDoc(doc(db, "staff", user.id), sanitizeData({
                id: user.id, name: user.name, email: user.email, username: user.username, phone: user.phone || "",
                role: "admin", permissions: ["all"], createdAt: Timestamp.now()
            }), { merge: true })
            await setDoc(doc(db, "users", user.id), { role: "admin", permissions: ["all"], updatedAt: Timestamp.now() }, { merge: true })
            toast.success("تم ترقية الحساب بنجاح! 🚀")
        } catch (error: any) {
            toast.error("فشل الترقية: " + error.message)
        }
    }, [])

    return (
        <AuthContext.Provider value={{
            currentUser, guestId, staff, authInitialized, login, logout, addStaff, updateStaff, deleteStaff, addExistingUserAsStaff, resetPassword, loading
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within AuthProvider")
    return context
}
