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
            // Give a tiny bit of time for the Provider's useEffect to run
            await new Promise(resolve => setTimeout(resolve, 50))

            const savedUser = localStorage.getItem("ysg_user")
            const user = savedUser ? JSON.parse(savedUser) : currentUser

            if (!user) {
                router.push(`/login?role=${role}`)
            } else if (role === "admin" && user.role !== "admin" && user.role !== "staff") {
                router.push("/customer")
            } else if (role === "customer" && user.role !== "customer") {
                router.push(user.role === "admin" || user.role === "staff" ? "/admin" : "/login?role=customer")
            } else {
                setIsChecking(false)
            }
        }

        checkAuth()
    }, [currentUser, router, role, pathname])

    if (isChecking) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}
