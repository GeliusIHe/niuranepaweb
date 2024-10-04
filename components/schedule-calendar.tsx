import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, eachWeekOfInterval, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';

type ScheduleEntry = {
  date: string;
  timestart: string;
  timefinish: string;
  name: string;
  teacher: string;
  aydit: string;
  namegroup: string;
};

interface ScheduleComponentProps {
  scheduleData: ScheduleEntry[];
  onLoadMore: (date: Date) => void;
  groupName: string;
  viewMode: 'calendar' | 'table';
  currentMonth: Date;
}

const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function ScheduleComponent({ scheduleData, onLoadMore, groupName, currentMonth }: ScheduleComponentProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const currentDay = new Date().getDate();
  getDaysInMonth(currentMonth);
  const localStorageKey = useMemo(() => {
    return `selectedDays-${groupName}-${format(currentMonth, 'MM-yyyy')}`;
  }, [groupName, currentMonth]);

  useEffect(() => {
    const savedSelectedDays = localStorage.getItem(localStorageKey);
    if (savedSelectedDays) {
      setSelectedDays(JSON.parse(savedSelectedDays));
    } else {
      setSelectedDays([]);
    }
  }, [localStorageKey]);

  useEffect(() => {
    if (selectedDays.length > 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(selectedDays));
    }
  }, [selectedDays, localStorageKey]);
  getDay(startOfMonth(currentMonth));
  const scheduleByDate = useMemo(() => {
    const grouped: { [key: string]: ScheduleEntry[] } = {};
    scheduleData.forEach((entry: ScheduleEntry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }
      grouped[entry.date].push(entry);
    });
    return grouped;
  }, [scheduleData]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handlePrevMonth = () => {
    const newDate = subMonths(currentMonth, 1);
    onLoadMore(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentMonth, 1);
    onLoadMore(newDate);
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const getClassType = (subject: string) => {
    if (subject.includes("(Практ. (семин.) занятие)")) {
      return "Практика";
    }
    if (subject.includes("(Лекция)")) {
      return "Лекция";
    }
    if (subject.includes("(лабораторная работа)")) {
      return "Лабораторная работа";
    }
    return "Неизвестно";
  };

  const formatSubject = (subject: string) => subject.replace(/\(.*\)/, "").trim();

  const weeks = useMemo(() => {
    return eachWeekOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    }, { weekStartsOn: 1 });
  }, [currentMonth]);

  const hasScheduleForMonth = useMemo(() => {
    return Object.values(scheduleByDate).some(daySchedule => daySchedule.length > 0);
  }, [scheduleByDate]);

  const renderCalendarContent = () => {
    if (!hasScheduleForMonth) {
      return (
          <div className="flex items-center justify-center h-96 text-gray-400 text-xl font-bold">
            На этот месяц пар нет
          </div>
      );
    }

    return (
        <div className="grid grid-cols-7 gap-2 rounded-lg" style={{ backgroundColor: '#111113' }}>
          {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-bold text-gray-400 p-2 rounded-t-lg">
                {day}
              </div>
          ))}
          {weeks.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = new Date(week);
                  day.setDate(day.getDate() + dayIndex);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayNumber = day.getDate();
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const daySchedule = scheduleByDate[dateStr] || [];

                  return (
                      <div
                          key={dateStr}
                          className={`border border-gray-700 p-2 cursor-pointer transition-colors duration-200 rounded-lg ${
                              isCurrentMonth ? (selectedDays.includes(dayNumber) ? 'bg-white text-black' : 'hover:bg-gray-800 text-gray-200') : 'opacity-50'
                          }`}
                          style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
                          onClick={isCurrentMonth ? () => toggleDay(dayNumber) : undefined}
                      >
                        {isCurrentMonth && (
                            <>
                              <div
                                  className={`font-bold mb-2 text-lg flex items-center ${
                                      selectedDays.includes(dayNumber) ? 'text-black' : 'text-gray-200'
                                  }`}
                              >
                        <span className="flex items-center">
                          {dayNumber}
                          {dayNumber === currentDay &&
                              currentMonth.getMonth() === new Date().getMonth() && (
                                  <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              )}
                        </span>
                              </div>
                              {daySchedule.length === 0 ? (
                                  <div
                                      className="flex items-center justify-center flex-grow text-base font-medium italic text-gray-400"
                                      style={{ height: '100%' }}
                                  >
                                    Нет пар
                                  </div>
                              ) : (
                                  daySchedule.map((entry, index) => (
                                      <div key={index} className="mb-2">
                                        <div className="flex items-center justify-between">
                                          <div className="h-px bg-gray-600 flex-grow"></div>
                                          <span className={`px-2 text-xs ${selectedDays.includes(dayNumber) ? 'text-black' : 'text-gray-400'}`}>
                                {formatTime(entry.timestart)} - {formatTime(entry.timefinish)} ({entry.aydit})
                              </span>
                                          <div className="h-px bg-gray-600 flex-grow"></div>
                                        </div>
                                        <div className={`text-sm mt-1 leading-tight ${selectedDays.includes(dayNumber) ? 'text-black' : 'text-gray-300'}`}>
                                          {`${formatSubject(entry.name)} (${getClassType(entry.name)})`}
                                        </div>
                                      </div>
                                  ))
                              )}
                            </>
                        )}
                      </div>
                  );
                })}
              </React.Fragment>
          ))}
        </div>
    );
  };

  return (
      <div className="min-h-screen p-4 rounded-lg" style={{ backgroundColor: '#09090B' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4 text-gray-200">
            <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={handlePrevMonth} />
            <h2 className="text-2xl font-bold">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </h2>
            <ChevronRight className="w-6 h-6 cursor-pointer" onClick={handleNextMonth} />
          </div>
          {renderCalendarContent()}
        </div>
      </div>
  );
}