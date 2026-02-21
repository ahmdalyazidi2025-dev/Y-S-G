"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/context/store-context"

const toDate = (d: any) => {
    if (d?.toDate) return d.toDate()
    if (d instanceof Date) return d
    return new Date(d || 0)
}

export function AppBadgeManager() {
    const { messages, orders, productRequests, currentUser, adminPreferences, joinRequests, guestId } = useStore()
    const [badgeCount, setBadgeCount] = useState(0)

    useEffect(() => {
        let count = 0
        const lastViewed = adminPreferences?.lastViewed || {}
        const targetId = currentUser?.id || guestId

        if (currentUser?.role === 'admin' || currentUser?.role === 'staff') {
            // Admin: Smart Count using lastViewed
            // ... (existing admin logic)
            const lastOrders = toDate(lastViewed.orders)
            count += orders.filter(o => o.status === 'pending' && toDate(o.createdAt) > lastOrders).length

            const lastRequests = toDate(lastViewed.requests)
            count += productRequests.filter(r => r.status === 'pending' && toDate(r.createdAt) > lastRequests).length

            const lastChat = toDate(lastViewed.chat)
            count += messages.filter(m => !m.isAdmin && !m.read && toDate(m.createdAt) > lastChat).length

            const lastJoin = toDate(lastViewed.joinRequests)
            count += joinRequests.filter(r => toDate(r.createdAt) > lastJoin).length
        } else {
            // Customer/Guest: Standard Unread Count
            // Logic must match StoreLayout for consistency
            count = messages.filter(m => {
                const isFromAdmin = m.isAdmin || m.senderId === 'admin'
                const isForMe = m.userId === targetId || (m.text || "").includes(`(@${targetId})`)
                return isFromAdmin && isForMe && !m.read
            }).length
        }

        setBadgeCount(count)

    }, [messages, orders, productRequests, currentUser, adminPreferences, joinRequests, guestId])


    // Update PWA Badge & Favicon
    useEffect(() => {
        // 1. PWA Badge (Standard API)
        if ('setAppBadge' in navigator) {
            if (badgeCount > 0) {
                // @ts-ignore
                navigator.setAppBadge(badgeCount).catch(e => console.error("Badge Error", e))
            } else {
                // @ts-ignore
                navigator.clearAppBadge().catch(e => console.error("Clear Badge Error", e))
            }
        }

        // 2. Favicon Badge (Canvas fallback/enhancement)
        updateFavicon(badgeCount)

    }, [badgeCount])

    return null
}

// Helper to draw badge on favicon
function updateFavicon(count: number) {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (!favicon) return

    const img = new Image()
    img.src = '/logo.png' // Use the base logo
    img.crossOrigin = 'anonymous'

    img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Draw original icon
        ctx.drawImage(img, 0, 0, 32, 32)

        if (count > 0) {
            // Badge Background
            ctx.beginPath()
            ctx.arc(24, 8, 7, 0, 2 * Math.PI)
            ctx.fillStyle = '#ef4444' // Red-500
            ctx.fill()
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1
            ctx.stroke()

            // Badge Number
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 10px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            const displayCount = count > 99 ? '99+' : count.toString()
            ctx.fillText(displayCount, 24, 9)
        }

        favicon.href = canvas.toDataURL('image/png')
    }
}
