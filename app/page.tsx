"use client";
import { useState, useCallback, useEffect } from "react";
import { GroupSelector } from "@/components/group-selector";
import { DarkThemeScheduleTableComponent } from "@/components/schedule-table";
import { DatePicker } from "@/components/date-picker";
import { format, startOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks } from "date-fns";
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

type ScheduleState = {
    data: ScheduleEntry[];
    isLoading: boolean;
    error: string | null;
    loadedRanges: { start: Date; end: Date }[];
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function Home() {
    const [groupName, setGroupName] = useState<string | null>(null);
    const [isCheckingLocalStorage, setIsCheckingLocalStorage] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [isMobile, setIsMobile] = useState(false);

    const [scheduleState, setScheduleState] = useState<ScheduleState>({
        data: [],
        isLoading: false,
        error: null,
        loadedRanges: []
    });

    const isRangeLoaded = useCallback((startDate: Date, endDate: Date) => {
        return scheduleState.loadedRanges.some(range =>
            range.start <= startDate && range.end >= endDate
        );
    }, [scheduleState.loadedRanges]);

    const loadSchedule = useCallback(async (
        selectedGroup: string,
        startDate: Date,
        endDate: Date
    ) => {
        if (scheduleState.isLoading || isRangeLoaded(startDate, endDate)) {
            return;
        }

        setScheduleState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch(
                `${apiBaseUrl}/get_schedule/?user=${encodeURIComponent(selectedGroup)}&dstart=${formatDate(startDate)}&dfinish=${formatDate(endDate)}`
            );

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (data.schedule && Array.isArray(data.schedule)) {
                setScheduleState(prev => ({
                    ...prev,
                    data: removeDuplicateEntries([...prev.data, ...data.schedule]),
                    loadedRanges: [...prev.loadedRanges, { start: startDate, end: endDate }]
                }));
            } else {
                throw new Error("Invalid data format received from server.");
            }
        } catch (err) {
            setScheduleState(prev => ({
                ...prev,
                error: `Не удалось загрузить расписание: ${err instanceof Error ? err.message : String(err)}`
            }));
        } finally {
            setScheduleState(prev => ({ ...prev, isLoading: false }));
        }
    }, [isRangeLoaded, scheduleState.isLoading]);

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

    const getDateRange = useCallback((date: Date, mode: 'table' | 'calendar') => {
        if (mode === 'calendar') {
            return {
                start: startOfMonth(date),
                end: endOfMonth(date)
            };
        }
        const start = subWeeks(startOfWeek(date, { weekStartsOn: 1 }), 1);
        return {
            start,
            end: addWeeks(start, 2)
        };
    }, []);

    const loadInitialSchedule = useCallback((selectedGroup: string, date: Date) => {
        const { start, end } = getDateRange(date, viewMode);
        loadSchedule(selectedGroup, start, end);
    }, [getDateRange, loadSchedule, viewMode]);

    useEffect(() => {
        if (groupName) {
            loadInitialSchedule(groupName, selectedDate);
        }
    }, [groupName, viewMode, selectedDate, loadInitialSchedule]);

    const formatDate = (date: Date) => format(date, "dd.MM.yyyy");

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
        setScheduleState(prev => ({
            ...prev,
            data: [],
            loadedRanges: []
        }));
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
        if (groupName) {
            const { start, end } = getDateRange(date, viewMode);
            if (!isRangeLoaded(start, end)) {
                loadSchedule(groupName, start, end);
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
                        <Button onClick={toggleViewMode}>
                            {viewMode === 'table' ? 'Показать календарь' : 'Показать таблицу'}
                        </Button>
                    </div>
                    {viewMode === 'table' ? (
                        <DarkThemeScheduleTableComponent
                            scheduleData={scheduleState.data}
                            onLoadMore={handleLoadMore}
                            isLoading={scheduleState.isLoading}
                            groupName={groupName}
                            onChangeGroup={() => setGroupName(null)}
                            currentDate={selectedDate}
                            setCurrentDate={setSelectedDate}
                        />
                    ) : (
                        <ScheduleComponent
                            scheduleData={scheduleState.data}
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