"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, addDays, isSameDay, isWithinInterval, isPast, isFuture, isAfter, isBefore, endOfDay, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { TablePagination } from "./table-pagination"
import { CalendarDays, Clock, Users, ExternalLink, BookOpen, Link as LinkIcon, UserCircle2, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { getClasses } from "@/lib/get/get-classes"
import { ClassType, ClassSessionType, ScheduleListViewProps } from "@/types"
import {
  formatDateTime,
  formatTime,
  formatDate,
  utcToLocal,
  isTodayInTimezone
} from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { convertStatusToPrefixedFormat } from "@/lib/utils"

export function AdminScheduleListView({ filter, currentWeekStart, searchQuery }: ScheduleListViewProps) {
  const router = useRouter()
  const { timezone } = useTimezone()
  const [classData, setClassData] = useState<ClassType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Helper function to parse time string (HH:MM:SS) to a Date object
  const combineDateTime = (date: string, time: string, isEndTime: boolean = false, startTime?: string): Date => {
    // If date or time is missing, use current date
    if (!date || !time) {
      return new Date()
    }

    // Date format: YYYY-MM-DD
    // Time format: HH:MM:SS or HH:MM:SS-TZ

    // Remove timezone suffix if present (e.g., "18:00:00-04" -> "18:00:00")
    const cleanTime = time.replace(/(-|\+)\d{2}.*$/, '')
    const [hours, minutes] = cleanTime.split(':').map(Number)

    // Create date from YYYY-MM-DD format
    // Use the YYYY-MM-DD format directly for better parsing
    try {
      const [year, month, day] = date.split('-').map(Number)
      const result = new Date(year, month - 1, day) // Month is 0-indexed in JS
      result.setHours(hours || 0, minutes || 0, 0)

      // If this is an end time and start time is provided, check if we need to add a day
      if (isEndTime && startTime) {
        const startCleanTime = startTime.replace(/(-|\+)\d{2}.*$/, '')
        const [startHours, startMinutes] = startCleanTime.split(':').map(Number)

        // Check if end time is earlier than start time (indicating crossing midnight)
        if (hours < startHours || (hours === startHours && minutes < startMinutes)) {
          // Add a day to the end date
          result.setDate(result.getDate() + 1)
        }
      }

      return result
    } catch (e) {
      // Fallback if date parsing fails
      console.warn('Error parsing date:', date)
      const result = new Date(date)
      result.setHours(hours || 0, minutes || 0, 0)
      return result
    }
  }

  // Handle card click to navigate to class details
  const handleCardClick = (classId: string, sessionId: string) => {
    router.push(`/admin/classes/${classId}/${sessionId}`)
  }

  // Fetch class data
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getClasses()
        setClassData(data)
      } catch (error) {
        console.error('Error fetching classes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [])

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
    weekStart.setHours(0, 0, 0, 0); // Start of the first day

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999); // End of the last day of the week

    return sessions.filter(session => {
      // Parse date accurately, ensuring time is reset to start of day
      const startDateTime = utcToLocal(session.start_date, timezone);
      const sessionDate = new Date(startDateTime);
      sessionDate.setHours(0, 0, 0, 0);

      // Strict date comparison
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
  };

  // Filter sessions by search query
  const filterBySearch = (sessions: ClassSessionType[]) => {
    if (!searchQuery || searchQuery.trim() === '') return sessions;

    const query = searchQuery.toLowerCase().trim();

    return sessions.filter(session => {
      // Search in class title
      if (session.title.toLowerCase().includes(query)) return true;

      // Search in subject
      if (session.subject.toLowerCase().includes(query)) return true;

      // Search in teacher names
      if (session.teachers.some(teacher =>
        `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(query) ||
        teacher.first_name.toLowerCase().includes(query) ||
        teacher.last_name.toLowerCase().includes(query)
      )) return true;

      // Search in description
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

    const now = new Date();

    switch (filter) {
      case "upcoming":
        return searchFilteredSessions.filter(session => {
          try {
            const startDateTime = utcToLocal(session.start_date, timezone);
            return isFuture(startDateTime);
          } catch (error) {
            console.error('Error parsing session time:', error);
            return false;
          }
        });

      case "recent":
        return searchFilteredSessions.filter(session => {
          try {
            const endDateTime = utcToLocal(session.end_date, timezone);
            return isPast(endDateTime);
          } catch (error) {
            console.error('Error parsing session time:', error);
            return false;
          }
        });

      case "morning":
        return searchFilteredSessions.filter(session => {
          try {
            const startDateTime = utcToLocal(session.start_date, timezone);
            const hour = startDateTime.getHours();
            return hour >= 6 && hour < 12;
          } catch (error) {
            console.error('Error parsing session time:', error);
            return false;
          }
        });

      case "afternoon":
        return searchFilteredSessions.filter(session => {
          try {
            const startDateTime = utcToLocal(session.start_date, timezone);
            const hour = startDateTime.getHours();
            return hour >= 12 && hour < 18;
          } catch (error) {
            console.error('Error parsing session time:', error);
            return false;
          }
        });

      case "evening":
        return searchFilteredSessions.filter(session => {
          try {
            const startDateTime = utcToLocal(session.start_date, timezone);
            const hour = startDateTime.getHours();
            return hour >= 18 || hour < 6;
          } catch (error) {
            console.error('Error parsing session time:', error);
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
      } catch (error) {
        console.error('Error sorting sessions:', error);
        return 0;
      }
    });
  }, [filteredSessions, timezone]);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No classes found</h3>
          <p className="text-muted-foreground">
            {filter === "upcoming" ? "No upcoming classes" :
              filter === "recent" ? "No recent classes" :
                `No ${filter} classes`} for this week.
          </p>
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
                    onClick={() => handleCardClick(session.class_id, session.session_id)}
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
                            {formatTime(startDateTime, 'h:mm a')} - {formatTime(endDateTime, 'h:mm a')}
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
