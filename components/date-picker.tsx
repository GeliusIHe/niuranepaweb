"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ru } from "date-fns/locale"

interface DatePickerProps {
  onSelect: (date: Date | undefined) => void;
}

export function DatePicker({ onSelect }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>()
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Корректировка на локальный часовой пояс без смещения времени
      const adjustedDate = new Date(
          selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
      );

      console.log("Выбранная дата (локальная полночь без смещения):", adjustedDate.toISOString());
      setDate(adjustedDate);
      onSelect(adjustedDate);
      setIsOpen(false);
    }
  };



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