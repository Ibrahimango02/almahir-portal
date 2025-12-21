"use client"

import { useMemo } from "react"
import {
    format,
    parseISO,
    startOfWeek,
    addDays,
    isSameDay,
    endOfMonth,
    eachDayOfInterval,
    isToday
} from "date-fns"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle, UserX, Clock, Play, BookX, CalendarSync } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClientTimeDisplay } from "./client-time-display"
import { ClassType } from "@/types"

// Utility function to parse class date and time
const parseClassDateTime = (
    cls: { start_date?: string; end_date?: string },
    timeField: "start_date" | "end_date"
): Date | null => {
    try {
        const time = cls[timeField]
        if (!time) return null

        // Parse the ISO datetime string directly
        return parseISO(time)
    } catch (error) {
        console.error(`Error parsing ${timeField} for class:`, error, cls)
        return null
    }
}

// Helper to get attendance status icon for monthly view
const getSessionStatusIcon = (status: string) => {
    switch (status) {
        case "scheduled":
            return <Calendar className="h-3 w-3" />
        case "running":
            return <Play className="h-3 w-3" />
        case "complete":
            return <CheckCircle className="h-3 w-3" />
        case "pending":
            return <Clock className="h-3 w-3" />
        case "rescheduled":
            return <CalendarSync className="h-3 w-3" />
        case "cancelled":
            return <BookX className="h-3 w-3" />
        case "absence":
            return <UserX className="h-3 w-3" />
        default:
            return <Clock className="h-3 w-3" />
    }
}

export function MonthlyScheduleView({
    classes,
    monthStart,
    currentUserRole,
    searchQuery
}: {
    classes: ClassType[],
    monthStart: Date,
    currentUserRole: string | null,
    searchQuery?: string
}) {
    const router = useRouter()

    const getSessionStatusContainerStyles = (status: string) => {
        switch (status) {
            case "scheduled":
                return "border-blue-200 bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-200"
            case "running":
                return "bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800/60"
            case "pending":
                return "bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800/60"
            case "complete":
                return "bg-purple-100 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800/60"
            case "rescheduled":
                return "bg-amber-100 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800/60"
            case "cancelled":
                return "bg-rose-100 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800/60"
            case "absence":
                return "bg-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800/60"
            default:
                return "border-gray-200 bg-gray-100 dark:border-gray-800/60 dark:bg-gray-950 dark:text-gray-200"
        }
    }

    const handleDayClick = (day: Date) => {
        // Navigate to the weekly view for the week containing this day
        const weekStart = startOfWeek(day, { weekStartsOn: 1 })
        // You could implement navigation to a specific week view here
        console.log("Navigate to week starting:", weekStart)
    }

    const handleClassClick = (classId: string, sessionId: string) => {
        if (!currentUserRole) return
        router.push(`/${currentUserRole}/classes/${classId}/${sessionId}`)
    }

    // Extract all sessions from classes
    const allSessions = useMemo(() => {
        return classes.flatMap(cls =>
            cls.sessions.map(session => ({
                ...session,
                class_id: cls.class_id,
                title: cls.title,
                description: cls.description,
                subject: cls.subject,
                class_link: cls.class_link,
                teachers: cls.teachers,
                students: cls.students
            }))
        )
    }, [classes])

    // Filter sessions by search query
    const filteredSessions = useMemo(() => {
        if (!searchQuery || searchQuery.trim() === '') return allSessions;
        const query = searchQuery.toLowerCase().trim();
        return allSessions.filter(session => {
            if (session.title.toLowerCase().includes(query)) return true;
            if (session.subject.toLowerCase().includes(query)) return true;
            if (session.teachers.some(teacher =>
                `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(query) ||
                teacher.first_name.toLowerCase().includes(query) ||
                teacher.last_name.toLowerCase().includes(query)
            )) return true;
            if (session.description && session.description.toLowerCase().includes(query)) return true;
            return false;
        });
    }, [allSessions, searchQuery])

    // Generate calendar days for the month
    const calendarDays = useMemo(() => {
        const monthEnd = endOfMonth(monthStart)
        const start = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start from Monday
        const end = startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 1 }) // End on Sunday of the week containing month end

        return eachDayOfInterval({ start, end })
    }, [monthStart])

    // Group days into weeks
    const weeks = useMemo(() => {
        const weeks = []
        for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7))
        }
        return weeks
    }, [calendarDays])

    // Get classes for a specific day
    const getClassesForDay = (day: Date) => {
        return filteredSessions.filter((session) => {
            const classDate = parseClassDateTime(session, "start_date")
            return classDate && isSameDay(classDate, day)
        })
    }

    return (
        <TooltipProvider>
            <div className="border rounded-lg overflow-hidden">
                {/* Calendar header */}
                <div className="grid grid-cols-7 bg-muted/30 border-b">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <div key={day} className="p-2 text-center text-sm font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar body */}
                <div className="grid grid-cols-7">
                    {weeks.map((week) =>
                        week.map((day) => {
                            const isCurrentMonth = day.getMonth() === monthStart.getMonth()
                            const isTodayDate = isToday(day)
                            const dayClasses = getClassesForDay(day)

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "min-h-[120px] p-2 border-r border-b relative cursor-pointer hover:bg-accent/50 transition-colors",
                                        !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                        isTodayDate && "bg-blue-50 dark:bg-blue-950/50"
                                    )}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {/* Day number */}
                                    <div className={cn(
                                        "text-sm font-medium mb-1",
                                        isTodayDate && "text-blue-700 dark:text-blue-400"
                                    )}>
                                        {format(day, "d")}
                                    </div>

                                    {/* Classes for this day */}
                                    <div className="space-y-0.5">
                                        {dayClasses.slice(0, 3).map((session) => {
                                            const startTime = parseClassDateTime(session, "start_date")
                                            const endTime = parseClassDateTime(session, "end_date")

                                            if (!startTime || !endTime) return null

                                            return (
                                                <Tooltip key={`${session.class_id}-${session.session_id}`}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                "p-0.5 rounded text-[10px] cursor-pointer transition-all hover:shadow-sm relative",
                                                                getSessionStatusContainerStyles(session.status)
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleClassClick(session.class_id, session.session_id)
                                                            }}
                                                        >
                                                            {/* Status icon at top right - show session status */}
                                                            <div className="absolute top-1 right-1 p-0.5">
                                                                {getSessionStatusIcon(session.status)}
                                                            </div>
                                                            <div className="font-medium truncate leading-tight pr-6">{session.title}</div>
                                                            <div className="text-muted-foreground truncate leading-tight">
                                                                <ClientTimeDisplay date={startTime} format="HH:mm" /> - <ClientTimeDisplay date={endTime} format="HH:mm" />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <div className="space-y-1">
                                                            <div className="font-semibold">{session.title}</div>
                                                            <div className="text-sm">{session.subject}</div>
                                                            <div className="text-sm">
                                                                <ClientTimeDisplay date={startTime} format="EEEE, MMMM d, yyyy" />
                                                            </div>
                                                            <div className="text-sm">
                                                                <ClientTimeDisplay date={startTime} format="h:mm a" /> - <ClientTimeDisplay date={endTime} format="h:mm a" />
                                                            </div>
                                                            {session.teachers.length > 0 && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Teachers:</span> {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                                                                </div>
                                                            )}
                                                            {/* Show session status */}
                                                            <div className="text-sm">
                                                                <span className={cn(
                                                                    "ml-1 px-1.5 py-0.5 rounded text-xs font-medium border",
                                                                    session.status === "complete" && "border-purple-200 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                                                                    session.status === "running" && "border-emerald-200 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                                                                    session.status === "scheduled" && "border-blue-200 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                                                                    session.status === "cancelled" && "border-rose-200 bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                                                                )}>
                                                                    {session.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        })}

                                        {/* Show indicator if there are more classes */}
                                        {dayClasses.length > 3 && (
                                            <div className="text-xs text-muted-foreground text-center">
                                                +{dayClasses.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
} 