"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface InteractiveMarqueeProps {
    children: React.ReactNode
    className?: string
    speed?: number
    pauseOnHover?: boolean
    resumeDelay?: number
}

export function InteractiveMarquee({
    children,
    className,
    speed = 0.5,
    pauseOnHover = false,
    resumeDelay = 1000,
}: InteractiveMarqueeProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [isPaused, setIsPaused] = useState(false)
    const [isInteracting, setIsInteracting] = useState(false)
    const requestRef = useRef<number>(undefined)
    const resumeTimeoutRef = useRef<NodeJS.Timeout>(undefined)

    // Use a secondary ref to track pause state without re-rendering the animation loop
    const isPausedRef = useRef(false)

    const startAnimation = useCallback(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return

        const animate = () => {
            if (!isPausedRef.current) {
                // In RTL (Arabic), scrollLeft is usually negative or high depending on browser
                // We'll increment/decrement to move left.
                // For simplicity across browsers, we use scrollLeft - speed
                scrollContainer.scrollLeft -= speed

                // Seamless Loop Logic:
                // When we've scrolled past half the content, reset to start
                const scrollWidth = scrollContainer.scrollWidth
                const clientWidth = scrollContainer.clientWidth

                // If we've reached the 'end' in RTL (scrollLeft is 0 or positive depending on mode)
                // We'll reset if scrollLeft gets too close to 0 or too far
                if (Math.abs(scrollContainer.scrollLeft) <= 1) {
                    scrollContainer.scrollLeft = -(scrollWidth / 2)
                } else if (Math.abs(scrollContainer.scrollLeft) >= (scrollWidth / 2 + clientWidth)) {
                    scrollContainer.scrollLeft = -(scrollWidth / 2)
                }
            }
            requestRef.current = requestAnimationFrame(animate)
        }

        requestRef.current = requestAnimationFrame(animate)
    }, [speed])

    useEffect(() => {
        startAnimation()
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
        }
    }, [startAnimation])

    const handleInteractionStart = () => {
        setIsInteracting(true)
        isPausedRef.current = true
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }

    const handleInteractionEnd = () => {
        setIsInteracting(false)
        resumeTimeoutRef.current = setTimeout(() => {
            isPausedRef.current = false
        }, resumeDelay)
    }

    return (
        <div
            ref={scrollContainerRef}
            className={cn(
                "flex overflow-x-auto no-scrollbar select-none touch-pan-x",
                className
            )}
            onMouseEnter={() => pauseOnHover && (isPausedRef.current = true)}
            onMouseLeave={() => pauseOnHover && (isPausedRef.current = false)}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
            // If user scrolls manually, pause it too
            onScroll={() => {
                if (!isPausedRef.current && !isInteracting) {
                    // This was an external scroll or purely code-based, 
                    // usually we don't want to pause here unless it's user initiated
                }
            }}
            dir="rtl"
        >
            <div className="flex gap-4 shrink-0 px-4">
                {children}
            </div>
            {/* Duplicate children for seamless loop */}
            <div className="flex gap-4 shrink-0 px-4" aria-hidden="true">
                {children}
            </div>
        </div>
    )
}
