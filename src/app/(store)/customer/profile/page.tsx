"use client"

import { useStore } from "@/context/store-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ProfileHeader } from "@/components/store/profile/profile-header"
import { ProfileStats } from "@/components/store/profile/profile-stats"
import { ProfileInfoForm } from "@/components/store/profile/profile-info-form"
import { motion } from "framer-motion"

export default function CustomerProfilePage() {
    const { currentUser, orders, loading } = useStore()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push("/")
        }
    }, [currentUser, loading, router])

    if (loading || !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20 pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
            <ProfileHeader currentUser={currentUser} />

            <div className="grid gap-8">
                <ProfileStats currentUser={currentUser} orders={orders} />

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <ProfileInfoForm currentUser={currentUser} />

                        {/* Other potential widgets like "Recent Activity" could go here */}
                    </div>

                    <div className="space-y-6">
                        {/* Sidebar / Extra Widgets Area */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="glass-card p-6 rounded-3xl border border-border/50 sticky top-24"
                        >
                            <h3 className="font-bold text-foreground mb-4">Account Security</h3>
                            <button className="w-full py-3 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors mb-2">
                                Change Password
                            </button>
                            <button className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-colors border border-red-500/20">
                                Delete Account
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
