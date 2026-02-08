"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/context/store-context"

export function AppBadgeManager() {
    const { messages, orders, productRequests, currentUser } = useStore()
    const [badgeCount, setBadgeCount] = useState(0)

    useEffect(() => {
        let count = 0

        if (currentUser) {
            // 1. Unread Messages (for everyone)
            const unreadMessages = messages.filter(m => {
                const isForMe = m.userId === currentUser.id || (m.isAdmin && currentUser.role !== 'admin')
                // If I'm admin, I see messages from users. If I'm customer, I see messages from admin.
                // Actually, let's stick to the store logic:
                // Admin sees messages from users.
                // Users see messages from Admin.

                if (currentUser.role === 'admin' || currentUser.role === 'staff') {
                    // Admin sees messages that are NOT from admins (i.e. from customers) and are unread
                    return !m.isAdmin && !m.read
                } else {
                    // Customer sees messages that ARE from admins and are unread
                    return m.isAdmin && !m.read && m.userId === currentUser.id
                }
            }).length

            count += unreadMessages

            // 2. Admin Specifics
            if (currentUser.role === 'admin' || currentUser.role === 'staff') {
                const pendingOrders = orders.filter(o => o.status === 'pending').length
                const pendingRequests = productRequests.filter(r => r.status === 'pending').length
                count += pendingOrders + pendingRequests
            }
        }

        setBadgeCount(count)

    }, [messages, orders, productRequests, currentUser])


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
