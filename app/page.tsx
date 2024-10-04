"use client"
import { useState, useCallback, useEffect } from "react";
import { GroupSelector } from "@/components/group-selector";
import { DarkThemeScheduleTableComponent } from "@/components/schedule-table";
import { DatePicker } from "@/components/date-picker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScheduleComponent } from "@/components/schedule-calendar";
import { Loader2 } from "lucide-react";
import {MobileScheduleRedirect} from "@/components/mobile-schedule-redirect";

type ScheduleEntry = {
    date: string;
    timestart: string;
    timefinish: string;
    name: string;
    teacher: string;
    aydit: string;
    namegroup: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
    const [groupName, setGroupName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingLocalStorage, setIsCheckingLocalStorage] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Текущая выбранная дата
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768); // Пример breakpoint для мобильных устройств
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        const savedGroup = localStorage.getItem("selectedGroup");
        const savedViewMode = localStorage.getItem("viewMode");
        if (savedGroup) {
            setGroupName(savedGroup);
            if (savedViewMode) {
                setViewMode(savedViewMode as 'table' | 'calendar');
            }
            if (viewMode === 'calendar') {
                fetchMonthlySchedule(savedGroup, selectedDate);
            } else {
                fetchWeeklySchedule(savedGroup, selectedDate);
            }
        }
        setIsCheckingLocalStorage(false);

        return () => window.removeEventListener('resize', checkMobile);
    }, [viewMode]);

    useEffect(() => {
        const savedGroup = localStorage.getItem("selectedGroup");
        const savedViewMode = localStorage.getItem("viewMode");
        if (savedGroup) {
            setGroupName(savedGroup);
            if (savedViewMode) {
                setViewMode(savedViewMode as 'table' | 'calendar');
            }
            if (viewMode === 'calendar') {
                fetchMonthlySchedule(savedGroup, selectedDate);
            } else {
                fetchWeeklySchedule(savedGroup, selectedDate);
            }
        }
        setIsCheckingLocalStorage(false);
    }, [viewMode]);



    // Функция для загрузки расписания на неделю
    const fetchWeeklySchedule = useCallback(
        async (selectedGroup: string, date: Date) => {
            if (isLoading) return;

            setIsLoading(true);
            setError(null);

            const formatDate = (date: Date) => format(date, "dd.MM.yyyy");
            const startDate = startOfMonth(date); // Начало недели (можно изменить логику под конкретные дни)
            const endDate = endOfMonth(date); // Конец недели

            try {
                const response = await fetch(
                    `${apiBaseUrl}/get_schedule/?user=${encodeURIComponent(
                        selectedGroup
                    )}&dstart=${formatDate(startDate)}&dfinish=${formatDate(endDate)}`
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (data.schedule && Array.isArray(data.schedule)) {
                    setScheduleData(data.schedule);
                } else {
                    throw new Error("Invalid data format received from server.");
                }
            } catch (err) {
                setError(
                    `Не удалось загрузить расписание: ${
                        err instanceof Error ? err.message : String(err)
                    }`
                );
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading]
    );

    // Функция для загрузки расписания на месяц
    const fetchMonthlySchedule = useCallback(
        async (selectedGroup: string, date: Date) => {
            if (isLoading) return;

            setIsLoading(true);
            setIsCalendarLoading(true);
            setError(null);

            const formatDate = (date: Date) => format(date, "dd.MM.yyyy");
            const monthStart = startOfMonth(date); // Начало месяца
            const monthEnd = endOfMonth(date); // Конец месяца

            try {
                const response = await fetch(
                    `${apiBaseUrl}/get_schedule/?user=${encodeURIComponent(
                        selectedGroup
                    )}&dstart=${formatDate(monthStart)}&dfinish=${formatDate(monthEnd)}`
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (data.schedule && Array.isArray(data.schedule)) {
                    setScheduleData(data.schedule);
                } else {
                    throw new Error("Invalid data format received from server.");
                }
            } catch (err) {
                setError(
                    `Не удалось загрузить расписание: ${
                        err instanceof Error ? err.message : String(err)
                    }`
                );
            } finally {
                setIsLoading(false);
                setIsCalendarLoading(false);
            }
        },
        [isLoading]
    );

    const handleGroupSubmit = (selectedGroup: string) => {
        setScheduleData([]);
        setGroupName(selectedGroup);
        localStorage.setItem("selectedGroup", selectedGroup);
        if (viewMode === 'calendar') {
            fetchMonthlySchedule(selectedGroup, selectedDate);
        } else {
            fetchWeeklySchedule(selectedGroup, selectedDate);
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date && groupName) {
            setSelectedDate(date);
            if (viewMode === 'calendar') {
                fetchMonthlySchedule(groupName, date);
            } else {
                fetchWeeklySchedule(groupName, date);
            }
        }
    };

    // Функция для листания месяца
    const handleLoadMore = (date: Date) => {
        setSelectedDate(date); // Обновляем выбранную дату
        if (groupName) {
            if (viewMode === 'calendar') {
                fetchMonthlySchedule(groupName, date); // Загружаем новое расписание для выбранного месяца
            } else {
                fetchWeeklySchedule(groupName, date);
            }
        }
    };

    const toggleViewMode = () => {
        const newMode = viewMode === 'table' ? 'calendar' : 'table';
        setViewMode(newMode);
        localStorage.setItem("viewMode", newMode);
        if (groupName) {
            if (newMode === 'calendar') {
                fetchMonthlySchedule(groupName, selectedDate);
            } else {
                fetchWeeklySchedule(groupName, selectedDate);
            }
        }
    };

    if (isCheckingLocalStorage) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#09090B] text-gray-300">
                <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin h-8 w-8 text-gray-300 mb-4" />
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    if (isMobile) {
        return <MobileScheduleRedirect />;
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-[#09090B] text-gray-300 p-4">
            {groupName ? (
                <>
                    <div className="mb-4 flex space-x-4">
                        {viewMode === 'table' && (
                            <DatePicker onSelect={handleDateSelect} />
                        )}
                        <Button onClick={toggleViewMode} disabled={isCalendarLoading}>
                            {isCalendarLoading ? (
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            ) : null}
                            {viewMode === 'table' ? 'Показать календарь' : 'Показать таблицу'}
                        </Button>
                    </div>
                    {viewMode === 'table' ? (
                        <DarkThemeScheduleTableComponent
                            scheduleData={scheduleData}
                            onLoadMore={handleLoadMore}
                            isLoading={isLoading}
                            groupName={groupName}
                            onChangeGroup={() => setGroupName(null)}
                            currentDate={selectedDate}
                            setCurrentDate={setSelectedDate}
                        />
                    ) : isCalendarLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin h-8 w-8 text-gray-300" />
                        </div>
                    ) : (
                        <ScheduleComponent
                            scheduleData={scheduleData}
                            onLoadMore={handleLoadMore} // Передаем функцию для загрузки при листании
                            groupName={groupName}
                            viewMode={viewMode}
                            currentMonth={selectedDate} // Передаем текущий выбранный месяц
                        />
                    )}
                </>
            ) : (
                <GroupSelector onSubmit={handleGroupSubmit} />
            )}
        </div>
    );
}