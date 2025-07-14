"use client"

import { useState, useEffect, useMemo } from "react"
import {
    format,
    parseISO,
    isToday
} from "date-fns"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle, UserX, Clock, CalendarDays, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
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

// Helper to get attendance status icon for monthly list view
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

export function MonthlyListScheduleView({
    classes,
    monthStart,
    currentUserRole
}: {
    classes: ClassType[],
    monthStart: Date,
    currentUserRole: string | null
}) {
    const router = useRouter()
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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



    // Sort and filter classes by date and time
    const filteredSortedClasses = useMemo(() => {
        // First get properly sorted classes
        const sorted = [...allSessions].sort((a, b) => {
            try {
                const aDateTime = parseClassDateTime(a, "start_date")
                const bDateTime = parseClassDateTime(b, "start_date")

                if (!aDateTime || !bDateTime) return 0
                return aDateTime.getTime() - bDateTime.getTime()
            } catch (error) {
                console.error("Error sorting classes:", error)
                return 0
            }
        })

        // Then filter based on the active tab
        return sorted.filter(cls => {
            const startDateTime = parseClassDateTime(cls, "start_date")
            const endDateTime = parseClassDateTime(cls, "end_date")
            if (!startDateTime || !endDateTime) return false

            // For monthly list view, we don't have an "upcoming"/"recent" filter,
            // so we just show all classes for the month.
            return true
        })
    }, [allSessions])

    const handleCardClick = (classId: string, sessionId: string) => {
        if (!currentUserRole) return
        router.push(`/${currentUserRole}/classes/${classId}/${sessionId}`)
    }

    return (
        <div className="h-full flex flex-col">
            {filteredSortedClasses.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    No classes found for {format(monthStart, "MMMM yyyy")}.
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="grid gap-3 p-1">
                        {filteredSortedClasses.map((session) => {
                            const startDateTime = parseClassDateTime(session, "start_date")
                            const endDateTime = parseClassDateTime(session, "end_date")
                            const isTodayClass = startDateTime && isToday(startDateTime)

                            if (!startDateTime || !endDateTime) return null

                            return (
                                <div
                                    key={session.session_id}
                                    className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-accent/50"
                                    onClick={() => handleCardClick(session.class_id, session.session_id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-base">{session.title}</h3>
                                                {isTodayClass && (
                                                    <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-500 text-white font-medium px-2 py-1">
                                                        Today
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {format(startDateTime, "PPP")}
                                                </span>
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {format(startDateTime, "h:mm a")} - {format(endDateTime, "h:mm a")}
                                                </span>
                                                {session.teachers.length > 0 && (
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Users className="h-3 w-3" />
                                                        {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 ml-3">
                                            {/* Show attendance status */}
                                            <span className={cn(
                                                "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                                                (attendanceData[session.session_id] || "scheduled") === "present" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                                                (attendanceData[session.session_id] || "scheduled") === "absent" && "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
                                                (attendanceData[session.session_id] || "scheduled") === "scheduled" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                            )}>
                                                {getAttendanceStatusIcon(attendanceData[session.session_id] || "scheduled")}
                                                {attendanceData[session.session_id] || "scheduled"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
} 