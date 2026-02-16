"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Settings Page Error:", error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 p-4">
            <h2 className="text-2xl font-bold text-rose-500">حدث خطأ في تحميل الإعدادات!</h2>
            <div className="bg-muted p-4 rounded-lg max-w-lg overflow-auto text-left text-xs font-mono border border-rose-200">
                <p className="font-bold text-rose-700">{error.name}: {error.message}</p>
                {error.digest && <p className="text-muted-foreground mt-2">Digest: {error.digest}</p>}
                {error.stack && <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap">{error.stack}</pre>}
            </div>
            <Button
                onClick={() => reset()}
                variant="outline"
                className="mt-4"
            >
                إعادة المحاولة
            </Button>
            <Button
                onClick={() => window.location.reload()}
                variant="default"
            >
                تحديث الصفحة كاملة
            </Button>
        </div>
    )
}
