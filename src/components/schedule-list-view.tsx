"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format, addDays, isSameDay, isWithinInterval, isPast, isFuture, isAfter, isBefore, endOfDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { TablePagination } from "./table-pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, Users, ExternalLink } from "lucide-react"
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

export function ScheduleListView({ filter, currentWeekStart }: ScheduleListViewProps) {
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

  // First filter by week to get only sessions in the selected week
  const weekFilteredSessions = filterByWeek(allClassSessions);

  // Then apply additional filters based on the filter prop
  const filteredSessions = useMemo(() => {
    if (!filter) return weekFilteredSessions;

      const now = new Date();

    switch (filter) {
      case "upcoming":
        return weekFilteredSessions.filter(session => {
          try {
            const startDateTime = utcToLocal(session.start_date, timezone);
            return isFuture(startDateTime);
          } catch (error) {
            console.error('Error parsing session time:', error);
            return false;
          }
        });

      case "recent":
        return weekFilteredSessions.filter(session => {
          try {
            const endDateTime = utcToLocal(session.end_date, timezone);
            return isPast(endDateTime);
          } catch (error) {
            console.error('Error parsing session time:', error);
            return false;
          }
        });

      case "morning":
        return weekFilteredSessions.filter(session => {
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
        return weekFilteredSessions.filter(session => {
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
        return weekFilteredSessions.filter(session => {
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
        return weekFilteredSessions;
    }
  }, [weekFilteredSessions, filter, timezone]);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Class Schedule</h2>
          <p className="text-muted-foreground">
            View and manage your class schedule
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="morning">Morning</TabsTrigger>
          <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {currentSessions.map((session) => {
              try {
                const startDateTime = utcToLocal(session.start_date, timezone);
                const endDateTime = utcToLocal(session.end_date, timezone);
                const isToday = isTodayInTimezone(session.start_date, timezone);

                return (
                  <Card key={session.session_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <StatusBadge status={session.status} />
                          {isToday && (
                            <Badge variant="secondary" className="text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(startDateTime, 'PPP')}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(startDateTime, 'h:mm a')} - {formatTime(endDateTime, 'h:mm a')}
                          </span>
                          {session.teachers.length > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.class_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(session.class_link!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/classes/${session.class_id}/${session.session_id}`)}
                        >
                          View
                        </Button>
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
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {currentSessions.map((session) => {
              try {
                const startDateTime = utcToLocal(session.start_date, timezone);
                const endDateTime = utcToLocal(session.end_date, timezone);
                const isToday = isTodayInTimezone(session.start_date, timezone);

                return (
                  <Card key={session.session_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <StatusBadge status={session.status} />
                          {isToday && (
                            <Badge variant="secondary" className="text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(startDateTime, 'PPP')}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(startDateTime, 'h:mm a')} - {formatTime(endDateTime, 'h:mm a')}
                          </span>
                          {session.teachers.length > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.class_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(session.class_link!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/classes/${session.class_id}/${session.session_id}`)}
                        >
                          View
                        </Button>
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
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4">
            {currentSessions.map((session) => {
              try {
                const startDateTime = utcToLocal(session.start_date, timezone);
                const endDateTime = utcToLocal(session.end_date, timezone);
                const isToday = isTodayInTimezone(session.start_date, timezone);

                  return (
                  <Card key={session.session_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <StatusBadge status={session.status} />
                          {isToday && (
                            <Badge variant="secondary" className="text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(startDateTime, 'PPP')}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(startDateTime, 'h:mm a')} - {formatTime(endDateTime, 'h:mm a')}
                          </span>
                          {session.teachers.length > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/classes/${session.class_id}/${session.session_id}`)}
                        >
                          View
                        </Button>
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
        </TabsContent>

        <TabsContent value="morning" className="space-y-4">
          <div className="grid gap-4">
            {currentSessions.map((session) => {
              try {
                const startDateTime = utcToLocal(session.start_date, timezone);
                const endDateTime = utcToLocal(session.end_date, timezone);
                const isToday = isTodayInTimezone(session.start_date, timezone);

                return (
                  <Card key={session.session_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <StatusBadge status={session.status} />
                          {isToday && (
                            <Badge variant="secondary" className="text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(startDateTime, 'PPP')}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(startDateTime, 'h:mm a')} - {formatTime(endDateTime, 'h:mm a')}
                          </span>
                          {session.teachers.length > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.class_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(session.class_link!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/classes/${session.class_id}/${session.session_id}`)}
                        >
                          View
                        </Button>
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
        </TabsContent>

        <TabsContent value="afternoon" className="space-y-4">
          <div className="grid gap-4">
            {currentSessions.map((session) => {
              try {
                const startDateTime = utcToLocal(session.start_date, timezone);
                const endDateTime = utcToLocal(session.end_date, timezone);
                const isToday = isTodayInTimezone(session.start_date, timezone);

                return (
                  <Card key={session.session_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                        <StatusBadge status={session.status} />
                          {isToday && (
                            <Badge variant="secondary" className="text-xs">
                              Today
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{session.subject}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(startDateTime, 'PPP')}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(startDateTime, 'h:mm a')} - {formatTime(endDateTime, 'h:mm a')}
                          </span>
                          {session.teachers.length > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {session.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.class_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(session.class_link!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/classes/${session.class_id}/${session.session_id}`)}
                        >
                          View
                        </Button>
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
        </TabsContent>
      </Tabs>

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
    </div>
  );
}
