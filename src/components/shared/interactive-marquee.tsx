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

    const isPausedRef = useRef(false)
    const directionRef = useRef<-1 | 1>(-1)
    const isAtBoundaryRef = useRef(false)

    // Cache dimensions to avoid layout thrashing in the animation loop
    const dimsRef = useRef({ scrollWidth: 0, clientWidth: 0 })

    const updateDims = useCallback(() => {
        if (scrollContainerRef.current) {
            dimsRef.current = {
                scrollWidth: scrollContainerRef.current.scrollWidth,
                clientWidth: scrollContainerRef.current.clientWidth
            }
        }
    }, [])

    const startAnimation = useCallback(() => {
        const scrollContainer = scrollContainerRef.current
        if (!scrollContainer) return

        updateDims()

        const animate = () => {
            if (!isPausedRef.current && !isInteracting && !isAtBoundaryRef.current) {
                const { scrollLeft } = scrollContainer
                const { scrollWidth, clientWidth } = dimsRef.current

                if (scrollWidth <= clientWidth) {
                    requestRef.current = requestAnimationFrame(animate)
                    return
                }

                const nextScroll = scrollLeft + (speed * directionRef.current)
                scrollContainer.scrollLeft = nextScroll

                // Boundary Detection for RTL
                const maxScrollLeft = -(scrollWidth - clientWidth)

                if (directionRef.current === -1 && scrollLeft <= maxScrollLeft + 1) {
                    scrollContainer.scrollLeft = maxScrollLeft
                    isAtBoundaryRef.current = true
                    boundaryTimeoutRef.current = setTimeout(() => {
                        directionRef.current = 1
                        isAtBoundaryRef.current = false
                    }, 1500)
                }
                else if (directionRef.current === 1 && scrollLeft >= -1) {
                    scrollContainer.scrollLeft = 0
                    isAtBoundaryRef.current = true
                    boundaryTimeoutRef.current = setTimeout(() => {
                        directionRef.current = -1
                        isAtBoundaryRef.current = false
                    }, 1500)
                }
            }
            requestRef.current = requestAnimationFrame(animate)
        }

        requestRef.current = requestAnimationFrame(animate)
    }, [speed, isInteracting, updateDims])

    useEffect(() => {
        startAnimation()
        window.addEventListener('resize', updateDims)
        return () => {
            window.removeEventListener('resize', updateDims)
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
            if (boundaryTimeoutRef.current) clearTimeout(boundaryTimeoutRef.current)
        }
    }, [startAnimation, updateDims])

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
                "flex overflow-x-auto no-scrollbar touch-pan-x",
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
