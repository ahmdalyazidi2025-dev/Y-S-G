"use client"

import { useState, useEffect } from "react"
import { format, getYear, getMonth, setYear, setMonth, setDate as setDayOfMonth, eachYearOfInterval, eachMonthOfInterval, startOfYear, endOfYear, getDaysInMonth } from "date-fns"
import { arSA } from "date-fns/locale"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronRight, ChevronLeft, Check, CalendarDays, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DatePickerWizardProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    label?: string
    placeholder?: string
}

export function DatePickerWizard({ date, setDate, label, placeholder = "اختر التاريخ" }: DatePickerWizardProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<"year" | "month" | "day">("year")
    const [viewDate, setViewDate] = useState(date || new Date())

    useEffect(() => {
        if (open) {
            setStep("year")
            setViewDate(date || new Date())
        }
    }, [open, date])

    const currentYear = new Date().getFullYear()
    const years = eachYearOfInterval({ start: new Date(2020, 0, 1), end: new Date(currentYear + 1, 0, 1) }).reverse()
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ]

    const handleYearSelect = (year: number) => {
        const newDate = setYear(viewDate, year)
        setViewDate(newDate)
        setStep("month")
    }

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = setMonth(viewDate, monthIndex)
        setViewDate(newDate)
        setStep("day")
    }

    const handleDaySelect = (d: number) => {
        const newDate = setDayOfMonth(viewDate, d)
        setDate(newDate)
        setOpen(false)
    }

    const daysInMonth = getDaysInMonth(viewDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    // Add empty slots for start of month alignment if needed (optional for simple grid)
    // For a cleaner look, let's just do a simple grid 1-31. Or real calendar.
    // Real calendar is better.
    const firstDayOfMonth = new Date(getYear(viewDate), getMonth(viewDate), 1).getDay() // 0-6 (Sun-Sat)
    // Adjust for Saturday start if needed, but 0-6 is standard.
    // Let's assume standard Sunday start for grid simplicity or handle offset.
    const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)


    const renderStepContent = () => {
        if (step === "year") {
            return (
                <div className="grid grid-cols-3 gap-3 p-2 h-[300px] overflow-y-auto custom-scrollbar">
                    {years.map(y => (
                        <Button
                            key={getYear(y)}
                            variant={getYear(viewDate) === getYear(y) ? "default" : "outline"}
                            className={cn(
                                "h-14 text-lg font-bold border-white/10 hover:bg-white/10",
                                getYear(viewDate) === getYear(y) && "bg-primary text-white hover:bg-primary/90"
                            )}
                            onClick={() => handleYearSelect(getYear(y))}
                        >
                            {format(y, "yyyy")}
                        </Button>
                    ))}
                </div>
            )
        }

        if (step === "month") {
            return (
                <div className="grid grid-cols-3 gap-3 p-2 h-[300px] overflow-y-auto">
                    {months.map((m, i) => (
                        <Button
                            key={m}
                            variant={getMonth(viewDate) === i ? "default" : "outline"}
                            className={cn(
                                "h-14 font-bold border-white/10 hover:bg-white/10",
                                getMonth(viewDate) === i && "bg-primary text-white hover:bg-primary/90"
                            )}
                            onClick={() => handleMonthSelect(i)}
                        >
                            <span className="text-sm">{m}</span>
                        </Button>
                    ))}
                </div>
            )
        }

        if (step === "day") {
            return (
                <div className="p-2">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-lg font-bold text-white">
                            {months[getMonth(viewDate)]} {format(viewDate, "yyyy")}
                        </span>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setStep("month")}>
                                <span className="text-xs">تغيير</span>
                            </Button>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2 text-center text-xs text-slate-500 font-bold">
                        {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(d => <span key={d}>{d}</span>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty Slots */}
                        {emptyDays.map(i => <div key={`empty-${i}`} />)}

                        {/* Days */}
                        {days.map(d => {
                            const currentLoopDate = new Date(getYear(viewDate), getMonth(viewDate), d)
                            const isSelected = date && format(date, 'yyyy-MM-dd') === format(currentLoopDate, 'yyyy-MM-dd')
                            const isToday = format(new Date(), 'yyyy-MM-dd') === format(currentLoopDate, 'yyyy-MM-dd')

                            return (
                                <Button
                                    key={d}
                                    variant="ghost"
                                    className={cn(
                                        "h-10 w-full rounded-lg text-sm font-bold p-0 border border-transparent",
                                        isSelected ? "bg-primary text-white hover:bg-primary/90" : "hover:bg-white/10 hover:border-white/10",
                                        !isSelected && isToday && "text-primary border-primary/50"
                                    )}
                                    onClick={() => handleDaySelect(d)}
                                >
                                    {d}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            )
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <div className="relative cursor-pointer group">
                    <div className={cn(
                        "flex items-center justify-between h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-white/5",
                        !date && "text-muted-foreground"
                    )}>
                        <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            {date ? (
                                <span className="text-white font-medium font-mono dir-ltr" style={{ direction: 'ltr', display: 'inline-block' }}>
                                    {format(date, "dd/MM/yyyy")}
                                </span>
                            ) : (
                                <span className="text-slate-500">{placeholder}</span>
                            )}
                        </span>
                        {date && (
                            <X
                                className="h-4 w-4 text-slate-500 hover:text-red-400 z-10"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setDate(undefined)
                                }}
                            />
                        )}
                    </div>
                    {label && <label className="absolute -top-2 right-3 text-[10px] bg-[#1a1f2e] px-1 text-slate-400">{label}</label>}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#0f141f] border-white/10 p-4">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                    <h3 className="font-bold text-white text-lg">
                        {step === "year" && "اختر السنة"}
                        {step === "month" && "اختر الشهر"}
                        {step === "day" && "اختر اليوم"}
                    </h3>
                    <div className="flex gap-1">
                        {step !== "year" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 hover:bg-white/5" onClick={() => setStep(step === "day" ? "month" : "year")}>
                                عودة
                            </Button>
                        )}
                    </div>
                </div>

                {renderStepContent()}

            </DialogContent>
        </Dialog>
    )
}
