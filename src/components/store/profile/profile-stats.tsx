"use client"

import { motion } from "framer-motion"
import { ShoppingBag, Wallet, Star, Ticket } from "lucide-react"

interface ProfileStatsProps {
    currentUser: any
    orders: any[]
}

export function ProfileStats({ currentUser, orders }: ProfileStatsProps) {
    if (!currentUser) return null

    // Calculate actual stats (mock logic for now if data is missing)
    const totalOrders = orders.filter(o => o.phone === currentUser.phone).length
    const totalSpend = orders
        .filter(o => o.phone === currentUser.phone)
        .reduce((acc, curr) => acc + (curr.total || 0), 0)

    const loyaltyPoints = Math.floor(totalSpend / 10) // Mock point logic: 1 point per 10 SAR

    const STATS = [
        {
            label: "Total Orders",
            value: totalOrders.toString(),
            icon: ShoppingBag,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            label: "Total Spend",
            value: `${totalSpend.toLocaleString()} SAR`,
            icon: Wallet,
            color: "text-green-500",
            bg: "bg-green-500/10",
            border: "border-green-500/20",
        },
        {
            label: "Loyalty Points",
            value: loyaltyPoints.toLocaleString(),
            icon: Star,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
        },
        {
            label: "Active Coupons",
            value: "2", // Mocked for now
            icon: Ticket,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    className="glass-card p-4 rounded-2xl border border-border/50 hover:border-primary/20 transition-all hover:translate-y-[-2px] hover:shadow-lg flex flex-col gap-3 group"
                >
                    <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} ${stat.border} border shadow-sm`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                            {stat.value}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                            {stat.label}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
