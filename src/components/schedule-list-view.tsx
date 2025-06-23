"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { TablePagination } from "./table-pagination"
import { CalendarDays, Clock, Users, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { ClassType, ClassSessionType, ScheduleListViewProps } from "@/types"
import {
    formatDateTime,
    formatDate,
    utcToLocal,
    isTodayInTimezone
} from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { ClientTimeDisplay } from "./client-time-display"

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
    const [itemsPerPage] = useState(10)

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
                enrolled_students: cls.enrolled_students
            }))
        )
    }, [classData])

    // Filter sessions based on the selected week
    const filterByWeek = (sessions: ClassSessionType[]) => {
        if (!currentWeekStart) return sessions;

        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return sessions.filter(session => {
            const startDateTime = utcToLocal(session.start_date, timezone);
            const sessionDate = new Date(startDateTime);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
    };

    // Filter sessions by search query
    const filterBySearch = (sessions: ClassSessionType[]) => {
        if (!searchQuery || searchQuery.trim() === '') return sessions;
        const query = searchQuery.toLowerCase().trim();
        return sessions.filter(session => {
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
    };

    // First filter by week to get only sessions in the selected week
    const weekFilteredSessions = filterByWeek(allClassSessions);
    // Then filter by search query
    const searchFilteredSessions = filterBySearch(weekFilteredSessions);

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

    // Reset to first page when search query changes
    // (If you want to reset on filter change too, add filter to deps)
    // useEffect(() => { setCurrentPage(1); }, [searchQuery, filter]);

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
                    Showing {sortedSessions.length} result{sortedSessions.length !== 1 ? 's' : ''} for "{searchQuery}"
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
                    <div className="grid gap-4">
                        {currentSessions.map((session) => {
                            try {
                                const startDateTime = utcToLocal(session.start_date, timezone);
                                const endDateTime = utcToLocal(session.end_date, timezone);
                                const isToday = isTodayInTimezone(session.start_date, timezone);

                                return (
                                    <Card
                                        key={session.session_id}
                                        className="p-3 cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-accent/50"
                                        onClick={() => router.push(`${baseRoute}/classes/${session.class_id}/${session.session_id}`)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-base">{session.title}</h3>
                                                    {isToday && (
                                                        <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-500 text-white font-medium px-2 py-1">
                                                            Today
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {formatDate(startDateTime, 'PPP')}
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
                                                <StatusBadge status={convertStatusToPrefixedFormat(session.status, 'session')} />
                                            </div>
                                        </div>
                                    </Card>
                                );
                            } catch (error) {
                                console.error('Error rendering session:', error);
                                return null;
                            }
                        })}
                    </div>

                    {totalPages > 1 && (
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={itemsPerPage}
                            totalItems={sortedSessions.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={() => { }} // No-op since we're not changing page size
                        />
                    )}
                </>
            )}
        </div>
    );
} 