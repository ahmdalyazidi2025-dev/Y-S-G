"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EntityPage() {
    const router = useRouter()
    useEffect(() => {
        router.replace("/admin/settings?tab=entity")
    }, [router])
    return null
}
