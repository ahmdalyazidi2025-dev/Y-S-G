"use client"

import { useEffect, useRef } from "react"
import { incrementVisit } from "@/lib/analytics"

export function VisitTracker() {
    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        // Simple check to avoid counting every reload in dev, 
        // or strictly one per session. 
        // For "Daily Visits", usually 1 per session is good.
        // Let's use logic: If not visited this session, increment.

        const hasVisited = sessionStorage.getItem("has_visited_today")

        if (!hasVisited) {
            incrementVisit().then(() => {
                sessionStorage.setItem("has_visited_today", "true")
            }).catch(console.error)
        }
    }, [])

    return null
}
