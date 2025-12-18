"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TablePagination } from "./table-pagination"
import { CalendarDays, Clock, Users, Calendar, Play, CheckCircle, BookX, UserX, CalendarSync } from "lucide-react"
import { useRouter } from "next/navigation"
import { ClassType, ScheduleListViewProps } from "@/types"
import {
    utcToLocal,
} from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { ClientTimeDisplay } from "./client-time-display"
import { cn } from "@/lib/utils"
import { format, parseISO, isToday } from "date-fns"

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

interface ScheduleListViewUnifiedProps extends ScheduleListViewProps {
    classData: ClassType[]
    baseRoute: string
    isLoading?: boolean
}

export function ScheduleListView({
    filter,
    currentWeekStart,
    searchQuery,
    classData,
    baseRoute,
    isLoading = false
}: ScheduleListViewUnifiedProps) {
    const router = useRouter()
    const { timezone } = useTimezone()
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(50)

    // Extract all sessions from classes
    const allClassSessions = useMemo(() => {
        return classData.flatMap(cls =>
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
    }, [classData])

    // First filter by week to get only sessions in the selected week
    const weekFilteredSessions = useMemo(() => {
        if (!currentWeekStart) return allClassSessions;

        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return allClassSessions.filter(session => {
            const startDateTime = utcToLocal(session.start_date, timezone);
            const sessionDate = new Date(startDateTime);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
    }, [allClassSessions, currentWeekStart, timezone]);

    // Then filter by search query
    const searchFilteredSessions = useMemo(() => {
        if (!searchQuery || searchQuery.trim() === '') return weekFilteredSessions;
        const query = searchQuery.toLowerCase().trim();
        return weekFilteredSessions.filter(session => {
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
    }, [weekFilteredSessions, searchQuery]);

    // Then apply additional filters based on the filter prop
    const filteredSessions = useMemo(() => {
        if (!filter) return searchFilteredSessions;
        switch (filter) {
            case "upcoming":
                return searchFilteredSessions.filter(session => {
                    try {
                        const startDateTime = utcToLocal(session.start_date, timezone);
                        return startDateTime > new Date();
                    } catch {
                        return false;
                    }
                });
            case "recent":
                return searchFilteredSessions.filter(session => {
                    try {
                        const endDateTime = utcToLocal(session.end_date, timezone);
                        return endDateTime < new Date();
                    } catch {
                        return false;
                    }
                });
            case "morning":
                return searchFilteredSessions.filter(session => {
                    try {
                        const startDateTime = utcToLocal(session.start_date, timezone);
                        const hour = startDateTime.getHours();
                        return hour >= 6 && hour < 12;
                    } catch {
                        return false;
                    }
                });
            case "afternoon":
                return searchFilteredSessions.filter(session => {
                    try {
                        const startDateTime = utcToLocal(session.start_date, timezone);
                        const hour = startDateTime.getHours();
                        return hour >= 12 && hour < 18;
                    } catch {
                        return false;
                    }
                });
            case "evening":
                return searchFilteredSessions.filter(session => {
                    try {
                        const startDateTime = utcToLocal(session.start_date, timezone);
                        const hour = startDateTime.getHours();
                        return hour >= 18 || hour < 6;
                    } catch {
                        return false;
                    }
                });
            default:
                return searchFilteredSessions;
        }
    }, [searchFilteredSessions, filter, timezone]);

    // Sort sessions by start time
    const sortedSessions = useMemo(() => {
        return [...filteredSessions].sort((a, b) => {
            try {
                const aStart = utcToLocal(a.start_date, timezone);
                const bStart = utcToLocal(b.start_date, timezone);
                return aStart.getTime() - bStart.getTime();
            } catch {
                return 0;
            }
        });
    }, [filteredSessions, timezone]);

    // Reset to first page when search query, filter, or week changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filter, currentWeekStart]);

    // Reset to first page when page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    // Pagination
    const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSessions = sortedSessions.slice(startIndex, endIndex);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Loading class schedule...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {searchQuery && (
                <div className="text-sm text-muted-foreground">
                    Showing {sortedSessions.length} result{sortedSessions.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                </div>
            )}

            {sortedSessions.length === 0 && (
                <div className="text-center py-8">
                    <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="text-muted-foreground text-lg font-semibold mb-2">No {filter} classes</h3>
                </div>
            )}

            {sortedSessions.length > 0 && (
                <>
                    <div className="grid gap-3 p-1">
                        {currentSessions.map((session) => {
                            try {
                                const startDateTime = parseClassDateTime(session, "start_date");
                                const endDateTime = parseClassDateTime(session, "end_date");
                                const isTodayClass = startDateTime && isToday(startDateTime);

                                if (!startDateTime || !endDateTime) return null;

                                return (
                                    <div
                                        key={session.session_id}
                                        className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-accent/50"
                                        onClick={() => router.push(`${baseRoute}/classes/${session.class_id}/${session.session_id}`)}
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
                                                        <ClientTimeDisplay date={startDateTime} format="h:mm a" /> - <ClientTimeDisplay date={endDateTime} format="h:mm a" />
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
                                );
                            } catch (error) {
                                console.error('Error rendering session:', error);
                                return null;
                            }
                        })}
                    </div>

                    {sortedSessions.length > 0 && (
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={itemsPerPage}
                            totalItems={sortedSessions.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setItemsPerPage}
                        />
                    )}
                </>
            )}
        </div>
    );
} 