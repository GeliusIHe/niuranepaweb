"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  onSelectRange: (range: { from: Date; to: Date }) => void; // Добавляем обработчик выбора диапазона
}

export function DateRangePicker({ onSelectRange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(); // Стейт для выбранного диапазона дат
  const [isOpen, setIsOpen] = useState(false); // Стейт для управления видимостью календаря

  // Обработчик выбора дат
  const handleSelect = (selectedDateRange: DateRange | undefined) => {
    setDate(selectedDateRange);
    if (selectedDateRange?.from && selectedDateRange?.to) {
      // Передаем диапазон дат родительскому компоненту
      onSelectRange({ from: selectedDateRange.from, to: selectedDateRange.to });
      setIsOpen(false); // Закрываем календарь после выбора
    }
  };

  return (
      <div className="flex flex-col items-center space-y-4">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
              Выбрать период
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
                initialFocus
                mode="range" // Выбор диапазона
                defaultMonth={date?.from} // Месяц начала диапазона
                selected={date} // Выбранные даты
                onSelect={handleSelect} // Обработчик выбора диапазона
                numberOfMonths={2} // Показываем 2 месяца
                locale={ru} // Локализация на русский язык
            />
          </PopoverContent>
        </Popover>
      </div>
  );
}
