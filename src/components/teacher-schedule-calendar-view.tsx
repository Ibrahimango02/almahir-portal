"use client"

import { useMemo, useState, useEffect } from "react"
import { format, addDays, parseISO, isSameDay, differenceInMinutes, isToday, startOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { getClassesByTeacherId } from "@/lib/get/get-classes"
import { WeeklyScheduleProps, ClassType } from "@/types"
import { Card } from "@/components/ui/card"
import { formatDateTime } from "@/lib/utils/timezone"
import { StatusBadge } from "./status-badge"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

// Helper to get status colors for classes
const getStatusStyles = (status: string) => {
    switch (status) {
        case "scheduled":
            return "border-blue-200 bg-blue-50/80 dark:border-blue-800/60 dark:bg-blue-950/50"
        case "running":
            return "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/60 dark:bg-emerald-950/50"
        case "pending":
            return "border-indigo-200 bg-indigo-50/80 dark:border-indigo-800/60 dark:bg-indigo-950/50"
        case "complete":
            return "border-purple-200 bg-purple-50/80 dark:border-purple-800/60 dark:bg-purple-950/50"
        case "cancelled":
            return "border-rose-200 bg-rose-50/80 dark:border-rose-800/60 dark:bg-rose-950/50"
        case "absence":
            return "border-orange-200 bg-orange-50/80 dark:border-orange-800/60 dark:bg-orange-950/50"
        default:
            return "border-gray-200 bg-gray-50/80 dark:border-gray-800/60 dark:bg-gray-950/50"
    }
}

export function TeacherScheduleCalendarView({ filter, currentWeekStart, timeRangeStart, timeRangeEnd, searchQuery }: WeeklyScheduleProps) {
    const router = useRouter()
    const [classData, setClassData] = useState<ClassType[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // State to track current time for the indicator
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [showTimeIndicator, setShowTimeIndicator] = useState(false)

    // Fetch class data
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    const data = await getClassesByTeacherId(user.id)
                    setClassData(data)
                }
            } catch (error) {
                console.error('Error fetching classes:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchClasses()
    }, [])

    // Update current time every 5 minutes
    useEffect(() => {
        const updateCurrentTime = () => {
            setCurrentTime(new Date());
        };

        // Update immediately
        updateCurrentTime();

        // Set interval for 5 minutes (300000 ms)
        const intervalId = setInterval(updateCurrentTime, 300000);

        // Cleanup on unmount
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        setShowTimeIndicator(true);
    }, []);

    // Generate week days based on the currentWeekStart
    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
    }, [currentWeekStart])

    // Filter classes by search query
    const filterBySearch = (classes: any[]) => {
        if (!searchQuery || searchQuery.trim() === '') return classes;

        const query = searchQuery.toLowerCase().trim();

        return classes.filter(cls => {
            // Search in class title
            if (cls.title.toLowerCase().includes(query)) return true;

            // Search in subject
            if (cls.subject.toLowerCase().includes(query)) return true;

            // Search in teacher names
            if (cls.teachers.some((teacher: any) =>
                `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(query) ||
                teacher.first_name.toLowerCase().includes(query) ||
                teacher.last_name.toLowerCase().includes(query)
            )) return true;

            // Search in description
            if (cls.description && cls.description.toLowerCase().includes(query)) return true;

            return false;
        });
    };

    // Dynamically filter classes based on the current week
    const filteredClasses = useMemo(() => {
        if (isLoading) return [];

        // Get all valid sessions from all classes that fall within the current week
        const sessionsForWeek: any[] = [];

        // Process each class
        classData.forEach(cls => {
            if (!cls || !cls.sessions) return;

            // Find sessions that fall within the current week's view
            cls.sessions.forEach(session => {
                if (!session || !session.start_date) return;

                try {
                    // Check if session date is within current week
                    const sessionDate = parseISO(session.start_date);
                    const isInCurrentWeek = weekDays.some(weekDay => isSameDay(weekDay, sessionDate));

                    if (!isInCurrentWeek) return;

                    // Process the times
                    let startDateTime, endDateTime;

                    try {
                        // Try direct parsing first - now using start_date and end_date
                        startDateTime = parseISO(session.start_date);
                        endDateTime = parseISO(session.end_date);

                        // Validate the parsed dates
                        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                            throw new Error("Invalid date produced");
                        }
                    } catch (e) {
                        // Fallback to parsing as time strings
                        const parseTimeString = (timeStr: string) => {
                            if (!timeStr) return { hours: 0, minutes: 0, seconds: 0 };

                            const parts = timeStr.split(':').map(Number);
                            return {
                                hours: parts[0] || 0,
                                minutes: parts[1] || 0,
                                seconds: parts[2] || 0
                            };
                        };

                        const startTime = parseTimeString(session.start_date);
                        startDateTime = new Date(sessionDate);
                        startDateTime.setHours(startTime.hours, startTime.minutes, startTime.seconds);

                        const endTime = parseTimeString(session.end_date);
                        endDateTime = new Date(sessionDate);
                        endDateTime.setHours(endTime.hours, endTime.minutes, endTime.seconds);
                    }

                    // Create the session object for this week
                    sessionsForWeek.push({
                        id: cls.class_id,
                        title: cls.title,
                        description: cls.description,
                        subject: cls.subject,
                        start_date: cls.start_date,
                        end_date: cls.end_date,
                        days_repeated: cls.days_repeated,
                        class_link: cls.class_link,
                        teachers: cls.teachers,
                        enrolled_students: cls.enrolled_students,
                        start_time: startDateTime.toISOString(),
                        end_time: endDateTime.toISOString(),
                        status: session.status,
                        session_id: session.session_id,
                        session_date: formatDateTime(startDateTime, 'yyyy-MM-dd')
                    });
                } catch (error) {
                    console.error("Error processing session:", {
                        class_id: cls.class_id,
                        session_id: session.session_id,
                        start_date: session.start_date
                    }, error);
                }
            });
        });

        // Apply search filtering first
        let filtered = filterBySearch(sessionsForWeek);

        // Then apply time-based filtering
        if (filter) {
            filtered = filtered.filter((cls) => {
                const hour = parseISO(cls.start_time).getHours();
                if (filter === "morning") return hour >= 4 && hour < 12;
                if (filter === "afternoon") return hour >= 12 && hour < 20;
                if (filter === "evening") return hour >= 20 || hour < 4;
                return true;
            });
        }

        return filtered;
    }, [classData, currentWeekStart, weekDays, filter, isLoading, searchQuery]);

    // Find earliest and latest class times to determine time slots
    const timeRange = useMemo(() => {
        // If explicit time range is provided, use it
        if (timeRangeStart !== undefined && timeRangeEnd !== undefined) {
            return { earliestHour: timeRangeStart, latestHour: timeRangeEnd }
        }

        // Otherwise, determine based on filter
        if (filter === "morning") {
            return { earliestHour: 6, latestHour: 12 }
        } else if (filter === "afternoon") {
            return { earliestHour: 12, latestHour: 18 }
        } else if (filter === "evening") {
            // For evening, we need to handle the day boundary
            return { earliestHour: 18, latestHour: 24 } // Using 24 to represent midnight
        } else {
            // For "all", use a standard business day
            return { earliestHour: 8, latestHour: 20 }
        }
    }, [filter, timeRangeStart, timeRangeEnd])

    // Time slots for the day
    const timeSlots = useMemo(() => {
        const slots = []
        for (let i = timeRange.earliestHour; i < timeRange.latestHour; i++) {
            // Handle hours that wrap around to the next day (for evening view)
            slots.push(i % 24)
        }
        return slots
    }, [timeRange])

    // Function to check if two classes overlap
    const doClassesOverlap = (class1: any, class2: any) => {
        const start1 = new Date(class1.start_time)
        const end1 = new Date(class1.end_time)
        const start2 = new Date(class2.start_time)
        const end2 = new Date(class2.end_time)

        return start1 < end2 && start2 < end1
    }

    // Function to group overlapping classes
    const groupOverlappingClasses = (classes: any[]) => {
        if (classes.length <= 1) {
            return [classes]
        }

        // Sort classes by start time for consistent grouping
        const sortedClasses = [...classes].sort((a, b) => {
            return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        })

        const groups: any[][] = []
        let currentGroup: any[] = [sortedClasses[0]]

        for (let i = 1; i < sortedClasses.length; i++) {
            const currentClass = sortedClasses[i]
            let overlapsWithCurrentGroup = false

            // Check if current class overlaps with any class in the current group
            for (const groupClass of currentGroup) {
                if (doClassesOverlap(currentClass, groupClass)) {
                    overlapsWithCurrentGroup = true
                    break
                }
            }

            if (overlapsWithCurrentGroup) {
                // Add to the current group if there's overlap
                currentGroup.push(currentClass)
            } else {
                // Start a new group if there's no overlap
                groups.push(currentGroup)
                currentGroup = [currentClass]
            }
        }

        // Add the last group
        groups.push(currentGroup)
        return groups
    }

    // Format the hour for display, handling hours > 24 for evening view
    const formatHour = (hour: number) => {
        const adjustedHour = hour % 24
        const date = new Date()
        date.setHours(adjustedHour, 0, 0)
        return format(date, "h a")
    }

    // Prepare classes for each day with overlap calculation
    const classesByDay = useMemo(() => {
        const byDay = weekDays.map((day) => {
            // Get all classes for this day
            const classesForDay = filteredClasses.filter((cls) => isSameDay(day, parseISO(cls.start_time)))

            // Group overlapping classes
            const groups = groupOverlappingClasses(classesForDay)

            // Flatten groups but preserve group information
            return groups.flatMap((group, groupIndex) =>
                group.map((cls, classIndex) => ({
                    ...cls,
                    groupIndex,
                    classIndex,
                    groupSize: group.length,
                })),
            )
        })

        return byDay
    }, [filteredClasses, weekDays])

    // Calculate position for the current time indicator
    const currentTimeIndicator = useMemo(() => {
        if (!currentTime) return null;

        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();

        // Check if current time is within displayed range
        if (currentHour < timeRange.earliestHour || currentHour >= timeRange.latestHour) {
            return null;
        }

        // Calculate position on the timeline
        const hourIndex = timeSlots.findIndex(hour => hour === currentHour);
        if (hourIndex === -1) return null;

        // Position within the hour (0-60 minutes)
        const minutePercentage = (currentMinute / 60) * 100;
        return {
            hourIndex,
            top: minutePercentage
        };
    }, [currentTime, timeSlots, timeRange]);

    return (
        <div className="overflow-x-auto border rounded-lg">
            <div className="min-w-[800px]">
                {/* Calendar header - Days of the week */}
                <div className="grid grid-cols-8 border-b">
                    <div className="p-3 border-r bg-muted/30 font-medium text-sm"></div>
                    {weekDays.map((day) => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "p-3 border-r last:border-r-0 font-medium text-center",
                                isToday(day) ? "bg-blue-50 dark:bg-blue-950" : "bg-muted/30",
                            )}
                        >
                            <div className="text-sm uppercase">{format(day, "EEE")}</div>
                            <div className={cn("text-2xl font-normal", isToday(day) ? "text-blue-700 dark:text-blue-400" : "")}>
                                {format(day, "d")}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Time slots */}
                {timeSlots.map((hour, hourIndex) => (
                    <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                        <div className="p-3 border-r bg-muted/20 text-sm flex items-center justify-end pr-4">
                            {formatHour(hour)}
                        </div>

                        {weekDays.map((day, dayIndex) => {
                            // Find classes that start at or span this specific hour
                            const classes = classesByDay[dayIndex].filter((cls) => {
                                const startTime = parseISO(cls.start_time)
                                const endTime = parseISO(cls.end_time)
                                const classStartHour = startTime.getHours()
                                const classEndHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0)

                                return classStartHour <= hour && classEndHour > hour
                            })

                            const isTodayColumn = isToday(day);
                            const showCurrentTimeIndicator = isTodayColumn &&
                                currentTimeIndicator &&
                                currentTimeIndicator.hourIndex === hourIndex;

                            return (
                                <div
                                    key={day.toISOString()}
                                    className="p-0 border-r last:border-r-0 text-sm relative min-h-[60px]"
                                >
                                    {/* Current time indicator */}
                                    {showCurrentTimeIndicator && showTimeIndicator && currentTime && (
                                        <div
                                            className="absolute w-full h-0.5 bg-red-500 z-30 flex items-center"
                                            style={{
                                                top: `${currentTimeIndicator.top}%`,
                                            }}
                                        >
                                            <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500"></div>
                                            <div className="absolute -right-1 w-2 h-2 rounded-full bg-red-500"></div>
                                        </div>
                                    )}

                                    {classesByDay[dayIndex].map((extendedClass) => {
                                        const startTime = parseISO(extendedClass.start_time)
                                        const endTime = parseISO(extendedClass.end_time)
                                        const classStartHour = startTime.getHours()

                                        // Skip if class doesn't start in this hour
                                        if (classStartHour !== hour) {
                                            return null
                                        }

                                        // Calculate duration in minutes and convert to pixels (60px per hour)
                                        const durationMinutes = differenceInMinutes(endTime, startTime)
                                        const heightPx = Math.max(60, Math.round((durationMinutes * 60) / 60))

                                        // Calculate width based on group size
                                        const width = 100 / extendedClass.groupSize
                                        // Calculate left offset based on index within group
                                        const left = extendedClass.classIndex * width

                                        return (
                                            <div
                                                key={`${extendedClass.id}-${extendedClass.session_id}`}
                                                className={cn(
                                                    "absolute rounded-md border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all hover:z-20 hover:shadow-md",
                                                    getStatusStyles(extendedClass.status),
                                                )}
                                                style={{
                                                    height: `${heightPx}px`,
                                                    top: `${(startTime.getMinutes() / 60) * 60}px`,
                                                    left: `${left}%`,
                                                    width: `${width}%`,
                                                    zIndex: 10,
                                                }}
                                                onClick={() => router.push(`/teacher/classes/${extendedClass.id}/${extendedClass.session_id}`)}
                                            >
                                                <div>
                                                    <p className="font-medium truncate text-xs sm:text-sm">{extendedClass.title}</p>
                                                    {heightPx >= 80 && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {extendedClass.subject}
                                                        </p>
                                                    )}
                                                    {heightPx >= 100 && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                                                        </p>
                                                    )}
                                                </div>
                                                {/* Always show status badge regardless of height */}
                                                <div className="flex justify-end items-center mt-auto">
                                                    <StatusBadge
                                                        status={convertStatusToPrefixedFormat(extendedClass.status, 'session')}
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                ))}

                {/* Current time display at the bottom */}
                <div className="grid grid-cols-8 border-t bg-muted/10 text-xs">
                    <div className="p-2 border-r bg-muted/20 flex items-center justify-end pr-4">
                        Last updated:
                    </div>
                    <div className="p-2 col-span-7 text-muted-foreground">
                        {currentTime ? format(currentTime, "h:mm a") : "Loading..."}
                    </div>
                </div>
            </div>
        </div>
    )
} 