"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function PwaManifestManager() {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/login')

    useEffect(() => {
        // Dynamically set manifest to ensure correct one is used
        const manifestHref = isAdmin ? "/manifest-admin.json" : "/manifest.json"
        
        // Find existing manifest link or create one
        let linkEl = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null
        
        if (linkEl) {
            // Update if different
            if (linkEl.href !== window.location.origin + manifestHref) {
                linkEl.setAttribute('href', manifestHref)
            }
        } else {
            // Create new manifest link
            linkEl = document.createElement('link')
            linkEl.rel = 'manifest'
            linkEl.href = manifestHref
            document.head.appendChild(linkEl)
        }
    }, [isAdmin])

    // Render a manifest link for SSR (initial load)
    // The useEffect above will correct it on the client if needed
    return null
}
