"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Check } from "lucide-react"
import { format } from "date-fns"
import { arSA } from "date-fns/locale"

interface WheelPickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    label?: string
    placeholder?: string
    minYear?: number
    maxYear?: number
}

// Generate arrays
const years = Array.from({ length: 7 }, (_, i) => 2024 + i) // 2024 - 2030
const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
]

export function WheelPicker({ date, setDate, label, placeholder = "اختر التاريخ", minYear = 2024, maxYear = 2030 }: WheelPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [tempDate, setTempDate] = React.useState<Date>(date || new Date())

    // Refs for scrolling
    const yearRef = React.useRef<HTMLDivElement>(null)
    const monthRef = React.useRef<HTMLDivElement>(null)
    const dayRef = React.useRef<HTMLDivElement>(null)

    // Helper to get days in month
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

    // Derived state
    const currentYear = tempDate.getFullYear()
    const currentMonth = tempDate.getMonth()
    const currentDay = tempDate.getDate()
    const days = Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i + 1)

    // Update temp selection
    const handleScroll = (type: 'year' | 'month' | 'day', e: React.UIEvent<HTMLDivElement>) => {
        // Debounce or simple snap handling could be added here if needed for more complex logic
        // But for visual feedback, we rely on the snap-scrolling css and click selection for now or intersection observer
        // To keep it simple and robust, we will use click-to-center or just selecting the visible item
        // Let's implement a simpler "click to select" inside the wheel aimed at the center
    }

    // Scroll to position on open
    React.useEffect(() => {
        if (open) {
            // Tiny timeout to allow DOM to render
            setTimeout(() => {
                const yearIndex = years.indexOf(currentYear)
                const monthIndex = currentMonth
                const dayIndex = currentDay - 1

                if (yearRef.current) yearRef.current.children[yearIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                if (monthRef.current) monthRef.current.children[monthIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                if (dayRef.current) dayRef.current.children[dayIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
        }
    }, [open])

    const confirmSelection = () => {
        setDate(tempDate)
        setOpen(false)
    }

    const updateDate = (type: 'year' | 'month' | 'day', value: number) => {
        const newDate = new Date(tempDate)
        if (type === 'year') newDate.setFullYear(value)
        if (type === 'month') newDate.setMonth(value)
        if (type === 'day') newDate.setDate(value)
        setTempDate(newDate)
    }

    return (
        <Drawer.Root open={open} onOpenChange={setOpen}>
            <Drawer.Trigger asChild>
                <div className="relative cursor-pointer group w-full">
                    <div className={cn(
                        "flex items-center justify-between h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-white/5",
                        !date && "text-muted-foreground"
                    )}>
                        <span className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            {date ? (
                                <span className="text-white font-medium font-mono" dir="ltr">
                                    {format(date, "dd/MM/yyyy")}
                                </span>
                            ) : (
                                <span className="text-slate-500">{placeholder}</span>
                            )}
                        </span>
                    </div>
                    {label && <label className="absolute -top-2 right-3 text-[10px] bg-[#1a1f2e] px-1 text-slate-400">{label}</label>}
                </div>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
                <Drawer.Content className="bg-[#0f141f] border border-white/10 flex flex-col rounded-[20px] h-[50vh] mt-24 fixed bottom-4 left-0 right-0 z-50 outline-none max-w-md mx-auto shadow-2xl">
                    <div className="p-4 bg-white/5 rounded-[20px] flex-1 flex flex-col">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-6" />

                        <div className="flex justify-between items-center mb-6 px-2">
                            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5" onClick={() => setOpen(false)}>
                                إلغاء
                            </Button>
                            <h3 className="font-bold text-lg text-white">اختر التاريخ</h3>
                            <Button variant="default" className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl" onClick={confirmSelection}>
                                <Check className="w-4 h-4" />
                                تم
                            </Button>
                        </div>

                        <div className="flex-1 relative overflow-hidden flex gap-2">
                            {/* Selection Highlight */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-12 bg-white/5 border-y border-white/10 pointer-events-none z-10 backdrop-blur-[1px]" />

                            {/* Year Column */}
                            <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory py-[calc(50%-24px)]" ref={yearRef}>
                                <div className="h-[50%] w-full" />
                                {years.map((y) => (
                                    <div
                                        key={y}
                                        className={cn(
                                            "h-12 flex items-center justify-center snap-center cursor-pointer transition-all",
                                            currentYear === y ? "text-primary font-bold text-xl scale-110" : "text-slate-500 text-sm"
                                        )}
                                        onClick={() => updateDate('year', y)}
                                    >
                                        {y}
                                    </div>
                                ))}
                                <div className="h-[50%] w-full" />
                            </div>

                            {/* Month Column */}
                            <div className="flex-[1.5] overflow-y-auto no-scrollbar snap-y snap-mandatory py-[calc(50%-24px)]" ref={monthRef}>
                                <div className="h-[50%] w-full" />
                                {months.map((m, i) => (
                                    <div
                                        key={m}
                                        className={cn(
                                            "h-12 flex items-center justify-center snap-center cursor-pointer transition-all",
                                            currentMonth === i ? "text-white font-bold text-lg scale-110" : "text-slate-500 text-sm"
                                        )}
                                        onClick={() => updateDate('month', i)}
                                    >
                                        {m}
                                    </div>
                                ))}
                                <div className="h-[50%] w-full" />
                            </div>

                            {/* Day Column */}
                            <div className="flex-1 overflow-y-auto no-scrollbar snap-y snap-mandatory py-[calc(50%-24px)]" ref={dayRef}>
                                <div className="h-[50%] w-full" />
                                {days.map((d) => (
                                    <div
                                        key={d}
                                        className={cn(
                                            "h-12 flex items-center justify-center snap-center cursor-pointer transition-all",
                                            currentDay === d ? "text-white font-bold text-lg scale-110" : "text-slate-500 text-sm"
                                        )}
                                        onClick={() => updateDate('day', d)}
                                    >
                                        {d}
                                    </div>
                                ))}
                                <div className="h-[50%] w-full" />
                            </div>

                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}
