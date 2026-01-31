"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { arSA } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    startDate: Date | undefined
    endDate: Date | undefined
    onDateChange: (range: { start: Date | undefined; end: Date | undefined }) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DateRangePicker({
    startDate,
    endDate,
    onDateChange,
    placeholder = "اختر الفترة",
    className,
    disabled
}: DateRangePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: startDate,
        to: endDate,
    })

    // Sync internal state with props
    React.useEffect(() => {
        setDate({
            from: startDate,
            to: endDate,
        })
    }, [startDate, endDate])

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range)
        onDateChange({
            start: range?.from,
            end: range?.to,
        })
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDate(undefined)
        onDateChange({ start: undefined, end: undefined })
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-start text-right font-normal bg-black/40 border-white/10 hover:bg-white/5 relative",
                            !date?.from && "text-muted-foreground",
                            className
                        )}
                    >
                        <CalendarIcon className="ml-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "dd/MM/yyyy")} -{" "}
                                        {format(date.to, "dd/MM/yyyy")}
                                    </>
                                ) : (
                                    format(date.from, "dd/MM/yyyy")
                                )
                            ) : (
                                <span>{placeholder}</span>
                            )}
                        </span>
                        {(date?.from) && (
                            <div
                                onClick={handleClear}
                                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full cursor-pointer z-10"
                            >
                                <X className="h-3 w-3 text-slate-500 hover:text-red-400" />
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={arSA}
                        dir="rtl"
                        className="bg-[#0f141f] text-white"
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
