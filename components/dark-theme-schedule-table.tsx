"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type ScheduleEntry = {
  date: string;
  timestart: string;
  timefinish: string;
  name: string;
  teacher: string;
  aydit: string;
  namegroup: string;
};

interface DarkThemeScheduleTableProps {
  scheduleData: ScheduleEntry[];
  onLoadMore: (date: Date) => void;
  isLoading: boolean;
  groupName: string;
  onChangeGroup: () => void;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
}

export function DarkThemeScheduleTableComponent({
                                                  scheduleData,
                                                  onLoadMore,
                                                  isLoading,
                                                  groupName,
                                                  onChangeGroup,
                                                  currentDate,
                                                  setCurrentDate,
                                                }: DarkThemeScheduleTableProps) {
  // Определение доступных дат
  const availableDates = useMemo(() => {
    const dates = scheduleData.map(entry => new Date(entry.date));
    dates.sort((a, b) => a.getTime() - b.getTime());
    const uniqueDateStrings = Array.from(new Set(dates.map(date => date.toISOString().split('T')[0])));
    return uniqueDateStrings.map(dateStr => new Date(dateStr));
  }, [scheduleData]);

  // Отфильтровка расписания для текущей даты
  const filteredSchedule = useMemo(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    return scheduleData.filter(entry => entry.date === dateStr);
  }, [currentDate, scheduleData]);

  // Функция для перехода к следующему дню
  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDate);
    if (!availableDates.some(date => date.toISOString().split('T')[0] === nextDate.toISOString().split('T')[0])) {
      onLoadMore(nextDate);
    }
  };

  // Функция для перехода к предыдущему дню
  const handlePrevDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(prevDate);
    if (!availableDates.some(date => date.toISOString().split('T')[0] === prevDate.toISOString().split('T')[0])) {
      onLoadMore(prevDate); // Запрашиваем данные, если их нет
    }
  };

  // Проверка доступности предыдущего дня
  const isPrevDayAvailable = useMemo(() => {
    const earliestDate = availableDates.length > 0 ? availableDates[0] : null;
    return earliestDate ? currentDate > earliestDate : true; // Разрешаем переход на предыдущие дни
  }, [currentDate, availableDates]);

  // Проверка доступности следующего дня
  const isNextDayAvailable = !isLoading;

  return (
      <div className="w-full min-h-screen bg-[#09090B] text-gray-300 p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Расписание группы: {groupName}</h2>
            <Button
                onClick={onChangeGroup}
                className="bg-white text-black hover:bg-gray-200"
            >
              Поменять
            </Button>
          </div>
          <div className="border border-gray-800 rounded-lg overflow-hidden bg-[#111113]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-800 hover:bg-[#17181A]">
                  <TableHead className="w-[50px] text-gray-400">No.</TableHead>
                  <TableHead className="w-[120px] text-gray-400">Время</TableHead>
                  <TableHead className="w-[100px] text-gray-400">Аудитория</TableHead>
                  <TableHead className="w-[150px] text-gray-400">Преподаватель</TableHead>
                  <TableHead className="w-[100px] text-gray-400">Тип занятия</TableHead>
                  <TableHead className="text-gray-400">Предмет</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedule.length > 0 &&
                    filteredSchedule.map((entry, index) => (
                        <TableRow
                            key={`${entry.date}-${entry.timestart}-${index}`}
                            className="border-b border-gray-800 hover:bg-[#17181A]"
                            style={{ height: '50px' }} // Фиксированная высота для заполненных строк
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{`${formatTime(entry.timestart)} - ${formatTime(entry.timefinish)}`}</TableCell>
                          <TableCell>{entry.aydit}</TableCell>
                          <TableCell>{entry.teacher}</TableCell>
                          <TableCell>{getClassType(entry.name)}</TableCell>
                          <TableCell>{formatSubject(entry.name)}</TableCell>
                        </TableRow>
                    ))}

                {/* Добавление пустых строк до 4 */}
                {Array.from({ length: 4 - filteredSchedule.length }).map((_, index) => (
                    <TableRow
                        key={`empty-row-${index}`}
                        className="border-b border-gray-800 hover:bg-[#17181A]"
                        style={{ height: '55px' }} // Фиксированная высота для пустых строк
                    >
                      <TableCell className="font-medium">-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                ))}
              </TableBody>


            </Table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevDay}
                  className="bg-white text-black border-gray-300 hover:bg-gray-100"
                  disabled={!isPrevDayAvailable}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Предыдущий день
              </Button>
            </motion.div>
            <span className="text-lg font-semibold text-gray-300">
            {formatDateWithWeekday(currentDate)}
          </span>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDay}
                  className="bg-white text-black border-gray-300 hover:bg-gray-100"
                  disabled={!isNextDayAvailable}
              >
                {isLoading ? "Загрузка..." : "Следующий день"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
  );
}

// Вспомогательные функции для форматирования даты и времени
const formatTime = (time: string) => time.slice(0, 5); // Форматируем как HH:MM

const getClassType = (subject: string) => {
  if (subject.includes("(Практ. (семин.) занятие)")) {
    return "Практика";
  }
  if (subject.includes("(Лекция)")) {
    return "Лекция";
  }
  return "Неизвестно";
};

const formatSubject = (subject: string) => subject.replace(/\(.*\)/, "").trim();

const monthsGenitive = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"
];

const formatDateWithWeekday = (date: Date) => {
  const day = date.getDate();
  const month = monthsGenitive[date.getMonth()];
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'long' });
  return `${day} ${month} (${weekday.charAt(0).toUpperCase() + weekday.slice(1)})`;
};
