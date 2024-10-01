"use client";

import { useState, useCallback, useEffect } from "react";
import { GroupSelector } from "@/components/group-selector";
import { DarkThemeScheduleTableComponent } from "@/components/dark-theme-schedule-table";

type ScheduleEntry = {
    date: string;
    timestart: string;
    timefinish: string;
    name: string;
    teacher: string;
    aydit: string;
    namegroup: string;
};

export default function Home() {
    const [groupName, setGroupName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedDate, setLastFetchedDate] = useState<Date | null>(null);
    const [isCheckingLocalStorage, setIsCheckingLocalStorage] = useState(true);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
        from: null,
        to: null,
    });

    useEffect(() => {
        const savedGroup = localStorage.getItem("selectedGroup");
        if (savedGroup) {
            setGroupName(savedGroup);
            const today = new Date();
            const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            fetchSchedule(savedGroup, today, oneWeekLater, true).finally(() => {
                setIsCheckingLocalStorage(false);
            });
        } else {
            setIsCheckingLocalStorage(false);
        }
    }, []);

    const fetchSchedule = useCallback(
        async (selectedGroup: string, startDate: Date, endDate: Date, isInitialLoad = false) => {
            if (isLoading) return;

            setIsLoading(true);
            setError(null);

            const formatDate = (date: Date) => {
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            };

            // Ensure startDate is not later than endDate
            const actualStartDate = startDate < endDate ? startDate : endDate;
            const actualEndDate = startDate < endDate ? endDate : startDate;

            const formattedStartDate = formatDate(actualStartDate);
            const formattedEndDate = formatDate(actualEndDate);

            try {
                const response = await fetch(
                    `http://localhost:8000/get_schedule/?user=${encodeURIComponent(
                        selectedGroup
                    )}&dstart=${formattedStartDate}&dfinish=${formattedEndDate}`
                );

                if (!response.ok) {
                    if (response.status === 500) {
                        setLastFetchedDate(actualEndDate);
                        return;
                    }
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.schedule && Array.isArray(data.schedule)) {
                    setScheduleData((prevData) => {
                        const newData = [...prevData, ...data.schedule];
                        const uniqueData = newData.filter(
                            (entry, index, self) =>
                                index ===
                                self.findIndex(
                                    (t) => t.date === entry.date && t.timestart === entry.timestart
                                )
                        );
                        uniqueData.sort(
                            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                        );
                        return uniqueData;
                    });
                    setLastFetchedDate(actualEndDate);
                    setGroupName(selectedGroup);
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

    const handleGroupSubmit = (selectedGroup: string) => {
        setScheduleData([]);
        setLastFetchedDate(null);
        setGroupName(selectedGroup);

        localStorage.setItem("selectedGroup", selectedGroup);

        const today = new Date();
        const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        fetchSchedule(selectedGroup, today, oneWeekLater, true);
    };

    const handleDateRangeSelect = (range: { from: Date; to: Date }) => {
        setDateRange(range);
        if (groupName && range.from && range.to) {
            fetchSchedule(groupName, range.from, range.to);
        }
    };

    if (isCheckingLocalStorage) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#09090B] text-gray-300">
                <div className="flex flex-col items-center">
                    <svg
                        className="animate-spin h-8 w-8 text-gray-300 mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                    </svg>
                    <p>Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-[#09090B] text-gray-300 p-4">
            {groupName ? (
                <>
                    <DarkThemeScheduleTableComponent
                        scheduleData={scheduleData}
                        onLoadMore={(date) => fetchSchedule(groupName, date, new Date())}
                        isLoading={isLoading}
                        groupName={groupName}
                        onChangeGroup={() => setGroupName(null)}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                    />
                </>
            ) : (
                <GroupSelector onSubmit={handleGroupSubmit} />
            )}
        </div>
    );

}
