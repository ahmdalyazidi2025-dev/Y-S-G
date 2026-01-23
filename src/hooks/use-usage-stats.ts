"use client"

import { useStore } from "@/context/store-context"
import { useMemo } from "react"

export function useUsageStats() {
    const store = useStore()

    // Constants for estimation
    const AVERAGE_IMAGE_SIZE_MB = 0.25 // Assuming ~250KB per optimized image
    const FREE_TIER_DB_MB = 1000 // 1GB
    const FREE_TIER_STORAGE_MB = 5000 // 5GB

    const stats = useMemo(() => {
        // 1. Calculate Database Usage (Text/JSON size)
        // We serialize the data to JSON to get a rough byte count
        const collections = {
            products: store.products,
            orders: store.orders,
            customers: store.customers,
            categories: store.categories,
            banners: store.banners,
            coupons: store.coupons,
            staff: store.staff,
            messages: store.messages,
            notifications: store.notifications,
            requests: store.productRequests
        }

        let totalDbBytes = 0
        const breakdown: Record<string, number> = {}

        Object.entries(collections).forEach(([key, data]) => {
            const size = new Blob([JSON.stringify(data)]).size
            totalDbBytes += size
            breakdown[key] = size
        })

        const dbUsageMB = totalDbBytes / (1024 * 1024)

        // 2. Calculate Storage Usage (Images)
        // Count all image references
        let imageCount = 0

        // Products images
        store.products.forEach(p => {
            if (p.image) imageCount++
            if (p.images && p.images.length > 0) imageCount += p.images.length
        })

        // Categories images
        store.categories.forEach(c => {
            if (c.image) imageCount++
        })

        // Banners
        store.banners.forEach(b => {
            if (b.image) imageCount++
        })

        // Requests
        store.productRequests.forEach(r => {
            if (r.image) imageCount++
        })

        const storageUsageMB = imageCount * AVERAGE_IMAGE_SIZE_MB

        return {
            db: {
                usedMB: dbUsageMB,
                limitMB: FREE_TIER_DB_MB,
                percentage: (dbUsageMB / FREE_TIER_DB_MB) * 100,
                breakdown
            },
            storage: {
                usedMB: storageUsageMB,
                limitMB: FREE_TIER_STORAGE_MB,
                percentage: (storageUsageMB / FREE_TIER_STORAGE_MB) * 100,
                imageCount
            }
        }
    }, [store])

    return stats
}
