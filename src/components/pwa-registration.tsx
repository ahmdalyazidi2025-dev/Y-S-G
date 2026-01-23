"use client"

import { useEffect } from "react"

export function PwaRegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => console.log("SW Registered", reg))
                .catch((err) => console.log("SW Registration Failed", err))
        }
    }, [])

    return null
}
