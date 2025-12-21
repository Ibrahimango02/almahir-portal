"use client"

import { useMemo, useState, useEffect } from "react"
import {
    format,
    parseISO,
    isToday,
    endOfMonth,
    isWithinInterval,
    startOfDay,
    endOfDay
} from "date-fns"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle, UserX, Clock, Play, CalendarDays, BookX, Users, CalendarSync } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ClassType } from "@/types"
import { TablePagination } from "./table-pagination"

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


export function MonthlyListScheduleView({
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
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(100)

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

        // Then filter by the selected month
        const monthFiltered = sorted.filter(cls => {
            const startDateTime = parseClassDateTime(cls, "start_date")
            const endDateTime = parseClassDateTime(cls, "end_date")
            if (!startDateTime || !endDateTime) return false

            // Filter sessions to show only those in the selected month
            const monthEnd = endOfMonth(monthStart)
            return isWithinInterval(startDateTime, {
                start: startOfDay(monthStart),
                end: endOfDay(monthEnd),
            })
        })

        // Then filter by search query
        if (!searchQuery || searchQuery.trim() === '') return monthFiltered;
        const query = searchQuery.toLowerCase().trim();
        return monthFiltered.filter(session => {
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
    }, [allSessions, monthStart, searchQuery])

    // Reset to first page when month changes
    useEffect(() => {
        setCurrentPage(1);
    }, [monthStart]);

    // Reset to first page when page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    // Pagination
    const totalPages = Math.ceil(filteredSortedClasses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSessions = filteredSortedClasses.slice(startIndex, endIndex);

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
                <>
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid gap-3 p-1">
                            {currentSessions.map((session) => {
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
                                                <span className={cn(
                                                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border",
                                                    session.status === "running" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                                                    session.status === "complete" && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                                                    session.status === "pending" && "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
                                                    session.status === "scheduled" && "border-blue-200 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                                                    session.status === "rescheduled" && "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                                                    session.status === "cancelled" && "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
                                                    session.status === "absence" && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                                )}>
                                                    {/* Status icons to match weekly-schedule.tsx */}
                                                    {session.status === "scheduled" && <Calendar className="h-3 w-3" />}
                                                    {session.status === "running" && <Play className="h-3 w-3" />}
                                                    {session.status === "complete" && <CheckCircle className="h-3 w-3" />}
                                                    {session.status === "pending" && <Clock className="h-3 w-3" />}
                                                    {session.status === "rescheduled" && <CalendarSync className="h-3 w-3" />}
                                                    {session.status === "cancelled" && <BookX className="h-3 w-3" />}
                                                    {session.status === "absence" && <UserX className="h-3 w-3" />}
                                                    {session.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {filteredSortedClasses.length > 0 && (
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={itemsPerPage}
                            totalItems={filteredSortedClasses.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setItemsPerPage}
                        />
                    )}
                </>
            )}
        </div>
    )
} 