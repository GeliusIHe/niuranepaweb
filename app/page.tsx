"use client";

import { useState, useCallback, useEffect } from "react";
import { GroupSelector } from "@/components/group-selector";
import { DarkThemeScheduleTableComponent } from "@/components/dark-theme-schedule-table";
import { DatePicker } from "@/components/date-picker";
import { format, addDays, subDays } from "date-fns";

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
    const [isCheckingLocalStorage, setIsCheckingLocalStorage] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        const savedGroup = localStorage.getItem("selectedGroup");
        if (savedGroup) {
            setGroupName(savedGroup);
            fetchSchedule(savedGroup, selectedDate).finally(() => {
                setIsCheckingLocalStorage(false);
            });
        } else {
            setIsCheckingLocalStorage(false);
        }
    }, []);

    const fetchSchedule = useCallback(
        async (selectedGroup: string, date: Date) => {
            if (isLoading) return;

            setIsLoading(true);
            setError(null);

            const formatDate = (date: Date) => format(date, "dd.MM.yyyy");
            const startDate = subDays(date, 3);
            const endDate = addDays(date, 3);
            const formattedStartDate = formatDate(startDate);
            const formattedEndDate = formatDate(endDate);

            try {
                const response = await fetch(
                    `http://localhost:8000/get_schedule/?user=${encodeURIComponent(
                        selectedGroup
                    )}&dstart=${formattedStartDate}&dfinish=${formattedEndDate}`
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.schedule && Array.isArray(data.schedule)) {
                    setScheduleData(prevData => {
                        const newData = [...prevData, ...data.schedule];
                        const uniqueData = newData.filter((item, index, self) =>
                                index === self.findIndex((t) => (
                                    t.date === item.date && t.timestart === item.timestart
                                ))
                        );
                        return uniqueData;
                    });
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
        setGroupName(selectedGroup);
        localStorage.setItem("selectedGroup", selectedGroup);
        fetchSchedule(selectedGroup, selectedDate);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date && groupName) {
            setSelectedDate(date);
            fetchSchedule(groupName, date);
        }
    };

    const handleLoadMore = (date: Date) => {
        if (groupName) {
            fetchSchedule(groupName, date);
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
                    <div className="mb-4">
                        <DatePicker onSelect={handleDateSelect} />
                    </div>
                    <DarkThemeScheduleTableComponent
                        scheduleData={scheduleData}
                        onLoadMore={handleLoadMore}
                        isLoading={isLoading}
                        groupName={groupName}
                        onChangeGroup={() => setGroupName(null)}
                        currentDate={selectedDate}
                        setCurrentDate={setSelectedDate}
                    />
                </>
            ) : (
                <GroupSelector onSubmit={handleGroupSubmit} />
            )}
        </div>
    );
}