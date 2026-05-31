"use client"

import { useStore } from "@/context/store-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function ProtectedRoute({ children, role }: { children: React.ReactNode, role: "admin" | "customer" }) {
    const { currentUser } = useStore()
    const router = useRouter()
    const pathname = usePathname()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Wait for context to load user from localStorage
        const checkAuth = async () => {
            try {
                // Give a tiny bit of time for the Provider's useEffect to run
                await new Promise(resolve => setTimeout(resolve, 50))

                const savedUser = localStorage.getItem("ysg_user")
                let user = currentUser
                if (savedUser) {
                    try {
                        user = JSON.parse(savedUser)
                    } catch (e) {
                        localStorage.removeItem("ysg_user")
                    }
                }

                if (!user) {
                    document.cookie = "firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                    document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                    router.replace(`/login?role=${role}`)
                } else if (role === "admin" && user.role !== "admin" && user.role !== "staff") {
                    router.replace("/customer")
                } else if (role === "admin" && user.role === "staff") {
                    // Strict URL-level permission enforcement for staff members
                    const perms: Record<string, string> = {
                        "/admin/products": "products",
                        "/admin/categories": "products",
                        "/admin/customers": "customers",
                        "/admin/analytics": "sales",
                        "/admin/orders": "orders",
                        "/admin/requests": "orders",
                        "/admin/password-requests": "customers",
                        "/admin/banners": "settings",
                        "/admin/chat": "chat",
                        "/admin/join-requests": "customers",
                        "/admin/notifications": "settings",
                        "/admin/system": "settings",
                        "/admin/settings": "settings",
                    }
                    
                    const matchedPath = Object.keys(perms).find(path => pathname.startsWith(path))
                    if (matchedPath) {
                        const requiredPermission = perms[matchedPath]
                        if (!user.permissions?.includes(requiredPermission)) {
                            // Staff is unauthorized! Redirect back to main admin dashboard
                            router.replace("/admin")
                            return
                        }
                    }
                    setIsChecking(false)
                } else if (role === "customer" && user.role !== "customer") {
                    router.replace(user.role === "admin" || user.role === "staff" ? "/admin" : `/login?role=customer`)
                } else {
                    setIsChecking(false)
                }
            } catch (error) {
                console.error("Auth check failed:", error)
                document.cookie = "firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                router.replace(`/login?role=${role}`)
            }
        }

        checkAuth()
    }, [currentUser, router, role])

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}
