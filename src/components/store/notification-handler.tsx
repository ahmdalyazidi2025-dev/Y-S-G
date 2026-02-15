"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function NotificationHandlerContent({ onOpen }: { onOpen: () => void }) {
    const searchParams = useSearchParams()

    useEffect(() => {
        if (searchParams.get("notifications") === "open") {
            onOpen()
        }
    }, [searchParams, onOpen])

    return null
}

export function NotificationHandler({ onOpen }: { onOpen: () => void }) {
    return (
        <Suspense fallback={null}>
            <NotificationHandlerContent onOpen={onOpen} />
        </Suspense>
    )
}
