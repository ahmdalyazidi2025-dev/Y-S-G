"use client"

import { Scan, MessageSquare, PlusCircle, MoreVertical } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { hapticFeedback } from "@/lib/haptics"
import { useStore } from "@/context/store-context"

interface SmartFABProps {
    onScan: () => void
    onRequest: () => void
    onChat: () => void
}

import { useRef } from "react"
import { AiChatModal } from "./ai-chat-modal"

export function SmartFAB({ onRequest, onChat }: Omit<SmartFABProps, 'onScan'>) {
    const { storeSettings } = useStore()
    const [isOpen, setIsOpen] = useState(false)
    const [isAiChatOpen, setIsAiChatOpen] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const isLongPress = useRef(false)

    // Check if AI is enabled (default to true if undefined)
    const isAiEnabled = storeSettings.enableAIChat !== false

    const handleTouchStart = () => {
        if (!isAiEnabled) return // Disable long press if AI is off

        isLongPress.current = false
        timerRef.current = setTimeout(() => {
            isLongPress.current = true
            hapticFeedback('success')
            setIsAiChatOpen(true)
        }, 600) // Long press threshold
    }

    const handleTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    return (
        <>
            <div className="fixed bottom-28 right-6 z-40 md:hidden flex flex-col items-end gap-3">
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {isAiEnabled && (
                                <motion.button
                                    initial={{ scale: 0, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0, opacity: 0, y: 10 }}
                                    onClick={() => { onChat(); setIsOpen(false); hapticFeedback('light') }}
                                    className="w-12 h-12 bg-[#1c2a36] border border-white/10 rounded-full flex items-center justify-center shadow-xl text-primary"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </motion.button>
                            )}
                            {storeSettings.enableProductRequests !== false && (
                                <motion.button
                                    initial={{ scale: 0, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0, opacity: 0, y: 10 }}
                                    onClick={() => { onRequest(); setIsOpen(false); hapticFeedback('light') }}
                                    className="w-12 h-12 bg-[#1c2a36] border border-white/10 rounded-full flex items-center justify-center shadow-xl text-primary"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                </motion.button>
                            )}
                        </>
                    )}
                </AnimatePresence>

                <Button
                    size="icon"
                    className={isOpen ? "w-14 h-14 rounded-full bg-primary text-white shadow-lg active:scale-95" : "w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/20 active:scale-95"}
                    onPointerDown={handleTouchStart}
                    onPointerUp={handleTouchEnd}
                    onPointerLeave={handleTouchEnd}
                    onClick={() => {
                        if (!isLongPress.current) {
                            setIsOpen(!isOpen)
                            hapticFeedback('medium')
                        }
                    }}
                >
                    {isOpen ? <Scan className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}
                </Button>
            </div>

            <AiChatModal isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
        </>
    )
}
