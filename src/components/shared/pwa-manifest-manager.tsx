"use client"

import { usePathname } from "next/navigation"

export function PwaManifestManager() {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/login')

    return (
        <link rel="manifest" href={isAdmin ? "/manifest-admin.json" : "/manifest.json"} />
    )
}
