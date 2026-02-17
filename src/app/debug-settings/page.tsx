"use client"

import { useStore } from "@/context/store-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useState, useEffect } from "react"

export default function DebugPage() {
    const { storeSettings, currentUser } = useStore()
    const [rawSettings, setRawSettings] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchRaw = async () => {
        setLoading(true)
        try {
            const snap = await getDoc(doc(db, "settings", "global"))
            if (snap.exists()) {
                setRawSettings(snap.data())
            } else {
                setRawSettings({ error: "Document does not exist" })
            }
        } catch (e: any) {
            setRawSettings({ error: e.message })
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchRaw()
    }, [])

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen font-mono text-xs">
            <h1 className="text-2xl font-bold">Settings Debugger</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Context State (useStore)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="p-4 bg-slate-900 text-green-400 rounded-xl overflow-auto max-h-[400px]">
                            {JSON.stringify(storeSettings, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Firestore Raw (settings/global)</CardTitle>
                        <Button size="sm" onClick={fetchRaw} disabled={loading}>
                            {loading ? "Loading..." : "Refresh Raw"}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <pre className="p-4 bg-slate-900 text-blue-400 rounded-xl overflow-auto max-h-[400px]">
                            {JSON.stringify(rawSettings, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Auth State</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="p-4 bg-slate-900 text-amber-400 rounded-xl overflow-auto">
                        {JSON.stringify({
                            uid: currentUser?.id,
                            role: currentUser?.role,
                            email: currentUser?.email
                        }, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    )
}
