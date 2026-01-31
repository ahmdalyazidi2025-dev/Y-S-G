"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { arSA } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            locale={arSA}
            dir="rtl"
            showOutsideDays={showOutsideDays}
            className={cn("p-4", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-bold text-white",
                nav: "space-x-1 flex items-center bg-white/5 rounded-lg p-0.5",
                nav_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-7 w-7 bg-transparent p-0 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1 block",
                head_row: "flex justify-between w-full mb-2",
                head_cell:
                    "text-slate-500 rounded-md w-10 font-medium text-[0.7rem] uppercase tracking-wider flex items-center justify-center",
                row: "flex w-full mt-2 justify-between",
                cell: "h-9 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-l-md [&:has([aria-selected].day-outside)]:bg-white/5 [&:has([aria-selected])]:bg-white/10 first:[&:has([aria-selected])]:rounded-r-md last:[&:has([aria-selected])]:rounded-l-md focus-within:relative focus-within:z-20",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 hover:text-white transition-all rounded-md data-[selected]:font-bold"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/25",
                day_today: "bg-white/5 text-primary font-bold border border-primary/20",
                day_outside:
                    "day-outside text-slate-600 opacity-50 aria-selected:bg-white/5 aria-selected:text-slate-500 aria-selected:opacity-30",
                day_disabled: "text-slate-600 opacity-50",
                day_range_middle:
                    "aria-selected:bg-white/10 aria-selected:text-white rounded-none",
                day_hidden: "invisible",
                ...classNames,
            }}
            formatters={{
                formatWeekdayName: (date) => {
                    const days = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
                    return days[date.getDay()];
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
