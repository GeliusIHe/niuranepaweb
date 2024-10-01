"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface DatePickerProps {
  onSelect: (date: Date | undefined) => void;
}

export function DatePicker({ onSelect }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>()
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      console.log("Выбранная дата:", format(selectedDate, "dd.MM.yyyy"))
      onSelect(selectedDate)
      setIsOpen(false)
    }
  }

  return (
      <div className="flex flex-col items-center space-y-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
                className="bg-white text-black hover:bg-gray-200"
            >
              Указать дату
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
                mode="single"
                selected={date}
                onSelect={handleSelect}
                initialFocus
                locale={ru}
            />
          </PopoverContent>
        </Popover>
      </div>
  )
}