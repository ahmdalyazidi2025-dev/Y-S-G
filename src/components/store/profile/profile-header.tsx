"use client"

import { motion } from "framer-motion"
import { User, Camera, Calendar, Award } from "lucide-react"
import { useStore } from "@/context/store-context"
import Image from "next/image"

interface ProfileHeaderProps {
    currentUser: any
}

export function ProfileHeader({ currentUser }: ProfileHeaderProps) {
    if (!currentUser) return null

    return (
        <div className="relative w-full mb-20 group">
            {/* Cover Image */}
            <div className="relative w-full h-48 md:h-64 rounded-[2rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-blue-500/20" />

                {/* Animated Orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] opacity-60 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] opacity-60 animate-pulse delay-700" />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

                {/* Cover Actions */}
                <button className="absolute bottom-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/80 hover:text-white transition-all cursor-not-allowed" title="Change Cover">
                    <Camera className="w-5 h-5" />
                </button>
            </div>

            {/* Profile Info Container - Floating */}
            <div className="absolute -bottom-16 left-0 right-0 px-6 md:px-10 flex flex-col md:flex-row items-center md:items-end gap-6">

                {/* Avatar */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 bg-background border border-border shadow-2xl relative z-10">
                        <div className="w-full h-full rounded-full overflow-hidden bg-secondary relative">
                            {/* Placceholder or Real Image */}
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                                <span className="text-4xl font-bold text-primary">
                                    {currentUser.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full z-20 shadow-sm" title="Online" />
                    </div>

                    {/* Animated Glow Ring behind avatar */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10 scale-110" />
                </motion.div>

                {/* Text Info */}
                <div className="flex-1 text-center md:text-right pb-4 space-y-2">
                    <div className="flex flex-col md:items-start items-center gap-1">
                        <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight drop-shadow-sm">
                            {currentUser.name}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted/50 px-3 py-1 rounded-full border border-border/50 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span>{currentUser.role === 'admin' ? 'Administrator' : 'Premium Member'}</span>
                        </div>
                    </div>
                </div>

                {/* Stats / Badges (Desktop Right) */}
                <div className="hidden md:flex gap-3 pb-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div className="flex flex-col text-xs">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Member Since</span>
                            <span className="font-bold text-foreground">2024</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-sm">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <div className="flex flex-col text-xs">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Status</span>
                            <span className="font-bold text-foreground">Gold Tier</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
