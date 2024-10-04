"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ru } from "date-fns/locale";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface DatePickerProps {
  onSelect: (date: Date | undefined) => void;
}

export function DatePicker({ onSelect }: DatePickerProps) {
  const [date, setDate] = useState<Date>();
  const [isOpen, setIsOpen] = useState(false);

  // Обработчик выбора даты
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Устанавливаем время в полночь по локальному времени
      const localDate = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          0, 0, 0
      );

      setDate(localDate);
      onSelect(localDate);
      setIsOpen(false);
    }
  };

  return (
      <div className="flex flex-col items-center space-y-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
                variant="outline"
                className="min-w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ru }) : "Указать дату"}
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
  );
}