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
    speed = 0.6,
    pauseOnHover = false,
    resumeDelay = 1000,
}: InteractiveMarqueeProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [isInteracting, setIsInteracting] = useState(false)
    const requestRef = useRef<number>(undefined)
    const resumeTimeoutRef = useRef<NodeJS.Timeout>(undefined)
    const boundaryTimeoutRef = useRef<NodeJS.Timeout>(undefined)

    // Refs for animation state to avoid closure issues and unnecessary re-renders
    const isPausedRef = useRef(false)
    const directionRef = useRef<-1 | 1>(-1) // -1 for left (forward in RTL), 1 for right (backward)
    const isAtBoundaryRef = useRef(false)

    const startAnimation = useCallback(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return

        const animate = () => {
            if (!isPausedRef.current && !isInteracting && !isAtBoundaryRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainer

                // In RTL, scrollLeft is usually 0 at max right and negative at left.
                // We move by subtracting speed * direction (direction -1 moves left, 1 moves right)
                const nextScroll = scrollLeft + (speed * directionRef.current)
                scrollContainer.scrollLeft = nextScroll

                // Boundary Detection
                const maxScrollLeft = -(scrollWidth - clientWidth)

                // If we hit the "left" end (most negative)
                if (directionRef.current === -1 && scrollContainer.scrollLeft <= maxScrollLeft + 1) {
                    scrollContainer.scrollLeft = maxScrollLeft
                    isAtBoundaryRef.current = true
                    boundaryTimeoutRef.current = setTimeout(() => {
                        directionRef.current = 1 // Reverse to right
                        isAtBoundaryRef.current = false
                    }, 1500) // Pause at the end
                }
                // If we hit the "right" end (0)
                else if (directionRef.current === 1 && scrollContainer.scrollLeft >= -1) {
                    scrollContainer.scrollLeft = 0
                    isAtBoundaryRef.current = true
                    boundaryTimeoutRef.current = setTimeout(() => {
                        directionRef.current = -1 // Reverse to left
                        isAtBoundaryRef.current = false
                    }, 1500) // Pause at the start
                }
            }
            requestRef.current = requestAnimationFrame(animate)
        }

        requestRef.current = requestAnimationFrame(animate)
    }, [speed, isInteracting])

    useEffect(() => {
        startAnimation()
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
            if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current)
        }
    }, [startAnimation])

    const handleInteractionStart = () => {
        setIsInteracting(true)
        isPausedRef.current = true
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
        if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current)
    }

    const handleInteractionEnd = () => {
        setIsInteracting(false)
        resumeTimeoutRef.current = setTimeout(() => {
            isPausedRef.current = false
            isAtBoundaryRef.current = false
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
            onMouseLeave={() => pauseOnHover && !isInteracting && (isPausedRef.current = false)}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
            dir="rtl"
        >
            <div className="flex gap-4 shrink-0 px-4">
                {children}
            </div>
        </div>
    )
}
