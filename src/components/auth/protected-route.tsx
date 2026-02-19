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
        // Optimized check: only re-check if currentUser OR role requirement changes
        // pathname is removed to prevent spinning on every internal navigation
        const checkAuth = async () => {
            const savedUser = localStorage.getItem("ysg_user")
            const user = savedUser ? JSON.parse(savedUser) : currentUser

            if (!user) {
                router.push(`/login?role=${role}`)
                return
            }

            if (role === "admin" && user.role !== "admin" && user.role !== "staff") {
                router.push("/customer")
            } else if (role === "customer" && user.role !== "customer") {
                router.push(user.role === "admin" || user.role === "staff" ? "/admin" : "/login?role=customer")
            } else {
                setIsChecking(false)
            }
        }

        checkAuth()
    }, [currentUser, router, role]) // Removed pathname

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}
