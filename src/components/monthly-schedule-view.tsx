"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Calendar, CheckCircle, UserX, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClientTimeDisplay } from "./client-time-display"
import { ClassType } from "@/types"
import { createClient } from "@/utils/supabase/client"

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
const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
        case "scheduled":
            return <Calendar className="h-3 w-3" />
        case "present":
            return <CheckCircle className="h-3 w-3" />
        case "absent":
            return <UserX className="h-3 w-3" />
        default:
            return <Clock className="h-3 w-3" />
    }
}

export function MonthlyScheduleView({
    classes,
    monthStart,
    currentUserRole
}: {
    classes: ClassType[],
    monthStart: Date,
    currentUserRole: string | null
}) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Client-side only state
    useEffect(() => {
        setMounted(true)
    }, [])

    // Get current user ID
    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setCurrentUserId(user.id)
                }
            } catch (error) {
                console.error("Error getting current user:", error)
            }
        }

        getCurrentUser()
    }, [])

    // Fetch attendance data for all sessions
    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!currentUserRole || !currentUserId || classes.length === 0) return

            const attendanceMap: Record<string, string> = {}

            try {
                for (const cls of classes) {
                    for (const session of cls.sessions) {
                        let attendanceStatus = 'scheduled' // default status

                        if (currentUserRole === 'student') {
                            const { getStudentAttendanceForSession } = await import('@/lib/get/get-students')
                            const attendance = await getStudentAttendanceForSession(session.session_id, currentUserId)
                            if (attendance.length > 0) {
                                attendanceStatus = attendance[0].attendance_status
                            }
                        } else if (currentUserRole === 'teacher' || currentUserRole === 'admin') {
                            const { getTeacherAttendanceForSession } = await import('@/lib/get/get-teachers')
                            const attendance = await getTeacherAttendanceForSession(session.session_id, currentUserId)
                            if (attendance.length > 0) {
                                attendanceStatus = attendance[0].attendance_status
                            }
                        }

                        attendanceMap[session.session_id] = attendanceStatus
                    }
                }

                setAttendanceData(attendanceMap)
            } catch (error) {
                console.error('Error fetching attendance data:', error)
            }
        }

        fetchAttendanceData()
    }, [classes, currentUserRole, currentUserId])

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
                enrolled_students: cls.enrolled_students
            }))
        )
    }, [classes])

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
        return allSessions.filter((session) => {
            const classDate = parseClassDateTime(session, "start_date")
            return classDate && isSameDay(classDate, day)
        })
    }

    // Helper to get attendance status-specific border and background colors
    const getAttendanceStatusContainerStyles = (status: string) => {
        switch (status) {
            case "scheduled":
                return "border-blue-200 bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/50"
            case "present":
                return "border-emerald-200 bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/50"
            case "absent":
                return "border-rose-200 bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/50"
            default:
                return "border-gray-200 bg-gray-100 dark:border-gray-800/60 dark:bg-gray-950/50"
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
                            const isTodayDate = mounted && isToday(day)
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
                                                                getAttendanceStatusContainerStyles(attendanceData[session.session_id] || "scheduled")
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleClassClick(session.class_id, session.session_id)
                                                            }}
                                                        >
                                                            {/* Status icon at top right - only show attendance status */}
                                                            <div className="absolute top-1 right-1 p-0.5">
                                                                {getAttendanceStatusIcon(attendanceData[session.session_id] || "scheduled")}
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
                                                            {/* Show attendance status */}
                                                            <div className="text-sm">
                                                                <span className={cn(
                                                                    "ml-1 px-1.5 py-0.5 rounded text-xs font-medium",
                                                                    (attendanceData[session.session_id] || "scheduled") === "present" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                                                                    (attendanceData[session.session_id] || "scheduled") === "absent" && "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
                                                                    (attendanceData[session.session_id] || "scheduled") === "scheduled" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                )}>
                                                                    {attendanceData[session.session_id] || "scheduled"}
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