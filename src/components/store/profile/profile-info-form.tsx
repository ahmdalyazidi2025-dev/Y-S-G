"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Phone, MapPin, Mail, Lock, Edit2, Save, X } from "lucide-react"
import { useStore } from "@/context/store-context"

interface ProfileInfoFormProps {
    currentUser: any
}

export function ProfileInfoForm({ currentUser }: ProfileInfoFormProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Local state for form
    const [formData, setFormData] = useState({
        name: currentUser?.name || "",
        phone: currentUser?.phone || "",
        address: currentUser?.address || "Riyadh, Saudi Arabia",
        email: currentUser?.email || "",
    })

    const handleSave = async () => {
        setIsLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsLoading(false)
        setIsEditing(false)
        import("sonner").then(({ toast }) => toast.success("Profile updated successfully"))
    }

    const INPUTS = [
        { label: "Full Name", key: "name", icon: User, type: "text", disabled: false },
        { label: "Phone Number", key: "phone", icon: Phone, type: "tel", disabled: true }, // Usually phone is unique ID
        { label: "Email Address", key: "email", icon: Mail, type: "email", disabled: true },
        { label: "Shipping Address", key: "address", icon: MapPin, type: "text", disabled: false },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card-premium rounded-3xl p-6 md:p-8 border border-border/50 shadow-xl relative overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight">Personal Information</h2>
                    <p className="text-sm text-muted-foreground">Manage your personal details and shipping preferences</p>
                </div>
                <button
                    onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                    className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 border ${isEditing
                            ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        }`}
                >
                    {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    <span className="text-xs font-bold hidden md:inline">{isEditing ? "Cancel" : "Edit Profile"}</span>
                </button>
            </div>

            {/* Decoration Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[100px] pointer-events-none" />

            {/* Form Grid */}
            <div className="grid md:grid-cols-2 gap-6 relative z-10">
                {INPUTS.map((input) => (
                    <div key={input.key} className="space-y-2 group">
                        <label className="text-xs text-muted-foreground uppercase tracking-wider font-bold ml-1 flex items-center gap-2">
                            <input.icon className="w-3 h-3" />
                            {input.label}
                        </label>
                        <div className="relative">
                            <input
                                type={input.type}
                                value={formData[input.key as keyof typeof formData]}
                                disabled={!isEditing || input.disabled}
                                onChange={(e) => setFormData({ ...formData, [input.key]: e.target.value })}
                                className={`w-full bg-secondary/30 border rounded-xl px-4 py-3.5 outline-none transition-all duration-300 font-medium ${isEditing && !input.disabled
                                        ? "border-primary/50 bg-background shadow-[0_0_20px_rgba(59,130,246,0.1)] focus:ring-2 focus:ring-primary/20"
                                        : "border-transparent text-muted-foreground cursor-not-allowed opacity-80"
                                    }`}
                            />
                            {input.disabled && (
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Action */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-8 pt-6 border-t border-border/50 flex justify-end"
                    >
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold tracking-wide shadow-lg shadow-primary/25 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
