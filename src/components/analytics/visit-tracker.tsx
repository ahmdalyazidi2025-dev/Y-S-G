"use client"

import { useEffect, useRef } from "react"
import { incrementVisit } from "@/lib/analytics"

export function VisitTracker() {
    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        // Use localStorage with the current date to track daily visits properly,
        // even if the user keeps the tab open for multiple days.
        const todayStr = new Date().toISOString().split('T')[0]
        const lastVisitDate = localStorage.getItem("last_visit_date")

        if (lastVisitDate !== todayStr) {
            incrementVisit().then(() => {
                localStorage.setItem("last_visit_date", todayStr)
            }).catch(console.error)
        }
    }, [])

    return null
}
