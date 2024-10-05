"use client";
import { useState, useCallback, useEffect } from "react";
import { GroupSelector } from "@/components/group-selector";
import { DarkThemeScheduleTableComponent } from "@/components/schedule-table";
import { DatePicker } from "@/components/date-picker";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScheduleComponent } from "@/components/schedule-calendar";
import { Loader2 } from "lucide-react";
import { MobileScheduleRedirect } from "@/components/mobile-schedule-redirect";

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
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [loadedRanges, setLoadedRanges] = useState<{ start: Date; end: Date }[]>([]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
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
        }
        setIsCheckingLocalStorage(false);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (groupName) {
            loadInitialSchedule(groupName, selectedDate);
        }
    }, [groupName, viewMode, selectedDate]);

    const loadInitialSchedule = (selectedGroup: string, date: Date) => {
        if (viewMode === 'calendar') {
            const startDate = startOfMonth(date);
            const endDate = endOfMonth(date);
            loadSchedule(selectedGroup, startDate, endDate);
        } else {
            const startDate = subWeeks(startOfWeek(date, { weekStartsOn: 1 }), 1);
            const endDate = addWeeks(startDate, 2);
            loadSchedule(selectedGroup, startDate, endDate);
        }
    };

    const loadSchedule = useCallback(
        async (selectedGroup: string, startDate: Date, endDate: Date) => {
            const formatDate = (date: Date) => format(date, "dd.MM.yyyy");

            if (isLoading) return;

            if (loadedRanges.some(range => range.start <= startDate && range.end >= endDate)) {
                return;
            }

            setIsLoading(true);
            setError(null);

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
                    const uniqueSchedule = removeDuplicateEntries([...scheduleData, ...data.schedule]);
                    setScheduleData(uniqueSchedule);
                    setLoadedRanges(prevRanges => [...prevRanges, { start: startDate, end: endDate }]);
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
        [isLoading, loadedRanges, scheduleData]
    );

    const removeDuplicateEntries = (entries: ScheduleEntry[]): ScheduleEntry[] => {
        const seen = new Set();
        return entries.filter(entry => {
            const key = `${entry.date}-${entry.timestart}-${entry.name}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    };

    const handleGroupSubmit = (selectedGroup: string) => {
        setScheduleData([]);
        setLoadedRanges([]);
        setGroupName(selectedGroup);
        localStorage.setItem("selectedGroup", selectedGroup);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleLoadMore = (date: Date) => {
        setSelectedDate(date);
        if (viewMode === 'calendar') {
            const startDate = startOfMonth(date);
            const endDate = endOfMonth(date);
            if (groupName && !loadedRanges.some(range => range.start <= startDate && range.end >= endDate)) {
                loadSchedule(groupName, startDate, endDate);
            }
        } else {
            const startDate = startOfWeek(date, { weekStartsOn: 1 });
            const endDate = addWeeks(startDate, 1);
            if (groupName) {
                loadSchedule(groupName, startDate, endDate);
            }
        }
    };

    const toggleViewMode = () => {
        const newMode = viewMode === 'table' ? 'calendar' : 'table';
        setViewMode(newMode);
        localStorage.setItem("viewMode", newMode);
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
        <div
            className={`flex flex-col items-center min-h-screen bg-[#09090B] text-gray-300 p-4 ${viewMode === 'calendar' ? '' : 'overflow-hidden'}`}
            style={{ overflow: viewMode === 'calendar' ? 'auto' : 'hidden', height: '100vh' }}
        >
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
                            onLoadMore={handleLoadMore}
                            groupName={groupName}
                            viewMode={viewMode}
                            currentMonth={selectedDate}
                        />
                    )}
                </>
            ) : (
                <GroupSelector onSubmit={handleGroupSubmit} />
            )}
        </div>
    );
}