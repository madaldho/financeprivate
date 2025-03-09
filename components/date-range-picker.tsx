"use client"

import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date: DateRange
  onDateChange: (date: DateRange) => void
  className?: string
}

export function DatePickerWithRange({ date, onDateChange, className }: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "d MMMM yyyy", { locale: id })} - {format(date.to, "d MMMM yyyy", { locale: id })}
                </>
              ) : (
                format(date.from, "d MMMM yyyy", { locale: id })
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            locale={id}
          />
          <div className="grid grid-cols-4 gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                onDateChange({
                  from: today,
                  to: today,
                })
              }}
            >
              Hari Ini
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                onDateChange({
                  from: weekAgo,
                  to: today,
                })
              }}
            >
              7 Hari
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const monthAgo = new Date(today)
                monthAgo.setDate(monthAgo.getDate() - 30)
                onDateChange({
                  from: monthAgo,
                  to: today,
                })
              }}
            >
              30 Hari
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                const yearAgo = new Date(today)
                yearAgo.setFullYear(yearAgo.getFullYear() - 1)
                onDateChange({
                  from: yearAgo,
                  to: today,
                })
              }}
            >
              1 Tahun
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

