"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface GroupSelectorProps {
  onSubmit: (groupName: string) => void;
}

export function GroupSelector({ onSubmit }: GroupSelectorProps) {
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatGroupName = (input: string): string => {
    // Преобразуем строку к нижнему регистру и удаляем лишние пробелы
    const trimmedInput = input.trim().toLowerCase();

    // Приводим первую букву и оставшуюся часть
    return trimmedInput
        .replace(/^([а-яa-zё]+)([-\s]?)(\d+)$/i, (_, letters, separator, numbers) => {
          const formattedLetters = letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
          return `${formattedLetters}${separator}${numbers}`;
        });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const formattedGroupName = formatGroupName(groupName);

    setIsSubmitting(true);
    await onSubmit(formattedGroupName);
    setIsSubmitting(false);
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold">Выберете группу</h2>
            <p className="mt-2 text-sm text-gray-400">
              Введите название вашей группы внизу, чтобы отобразить расписание
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <Input
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-white bg-gray-900 focus:outline-none focus:ring-white focus:border-white focus:z-10 sm:text-sm"
                placeholder="Испб-037"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={isSubmitting}
            />
            <Button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 ease-in-out hover:scale-105 disabled:hover:scale-100"
                disabled={isSubmitting}
            >
              {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
              ) : (
                  'Продолжить'
              )}
            </Button>
          </form>
        </div>
      </div>
  );
}
