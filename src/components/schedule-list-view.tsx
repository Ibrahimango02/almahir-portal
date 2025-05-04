"use client"

import type React from "react"
import { format, parseISO, addDays, isSameDay, isWithinInterval, isPast, isFuture, isAfter, isBefore, endOfDay } from "date-fns"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getClasses } from "@/lib/get-classes"
import { ScheduleListViewProps, ClassType, ClassSessionType, StudentType, TeacherType, SessionType } from "@/types"


export function ScheduleListView({ filter, currentWeekStart }: ScheduleListViewProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [classData, setClassData] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch class data
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classes = await getClasses()
        setClassData(classes)
      } catch (error) {
        console.error("Error fetching classes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

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

  // Transform classes with sessions_status into flattened class sessions for display
  const getClassSessions = (classes: ClassType[]): ClassSessionType[] => {
    return classes.flatMap(cls => {
      // If no sessions, return empty array
      if (!cls.sessions || cls.sessions.length === 0) {
        return [];
      }

      // Create entry for each session - times are now in each session
      return cls.sessions.map(session => ({
        class_id: cls.class_id,
        session_id: session.session_id,
        title: cls.title,
        description: cls.description,
        subject: cls.subject,
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        days_repeated: cls.days_repeated || [],
        status: session.status,
        class_link: cls.class_link || "",
        teachers: cls.teachers,
        enrolled_students: cls.enrolled_students
      }));
    });
  };

  // Get all class sessions
  const allClassSessions = classData.length ? getClassSessions(classData) : [];

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
      const [year, month, day] = session.date.split('-').map(Number);
      if (!year || !month || !day) return false;

      const sessionDate = new Date(year, month - 1, day);
      sessionDate.setHours(0, 0, 0, 0);

      // Debug log to check the date comparisons
      // console.log({
      //   sessionDate: sessionDate.toISOString(),
      //   weekStart: weekStart.toISOString(),
      //   weekEnd: weekEnd.toISOString(),
      //   isInRange: sessionDate >= weekStart && sessionDate <= weekEnd
      // });

      // Strict date comparison
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
  };

  // First filter by week to get only sessions in the selected week
  const weekFilteredSessions = filterByWeek(allClassSessions);

  // Then apply additional filters (upcoming/recent)
  const filteredSessions = weekFilteredSessions.filter((session) => {
    if (!filter) return true;

    // Only handle upcoming/recent filters - week filtering is already done
    if (filter === "recent" || filter === "upcoming") {
      const now = new Date();

      // Create a combined date-time for accurate comparison
      const sessionDateTime = combineDateTime(session.date, session.end_time, true, session.start_time);

      // Use current date/time as reference point if viewing current week
      // Otherwise use a reference relative to the week
      const referencePoint = currentWeekStart && isAfter(now, endOfDay(addDays(currentWeekStart, 6)))
        ? endOfDay(addDays(currentWeekStart, 6)) // If week is in the past, use end of week
        : currentWeekStart && isBefore(now, currentWeekStart)
          ? currentWeekStart // If week is in the future, use start of week
          : now; // Current week or no week specified, use now

      if (filter === "recent") {
        // Classes with date AND time less than current date AND time
        return isBefore(sessionDateTime, referencePoint);
      } else { // upcoming
        // Classes with date AND time greater than or equal to current date AND time
        return !isBefore(sessionDateTime, referencePoint);
      }
    }

    return true;
  });

  // Sort sessions by date and time
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const aDateTime = combineDateTime(a.date, a.start_time)
    const bDateTime = combineDateTime(b.date, b.start_time)
    return aDateTime.getTime() - bDateTime.getTime()
  });

  // Recalculate pagination after filtering
  const totalFilteredItems = sortedSessions.length;
  const totalFilteredPages = Math.ceil(totalFilteredItems / pageSize);
  const finalPaginatedSessions = sortedSessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle row click to navigate to class details
  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, classId: string) => {
    // Check if the click was on a link or other interactive element
    const target = e.target as HTMLElement
    const isLink = target.tagName === "A" || target.closest("a")

    // Only navigate if the click wasn't on a link
    if (!isLink) {
      router.push(`/admin/schedule/${classId}`)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading classes...</div>
  }

  return (
    <div className="space-y-4">
      {sortedSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No classes found</div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium text-sm">Class</th>
                  <th className="text-left p-3 font-medium text-sm">Teacher</th>
                  <th className="text-left p-3 font-medium text-sm">Date & Time</th>
                  <th className="text-left p-3 font-medium text-sm">Subject</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {finalPaginatedSessions.map((session) => {
                  const startDateTime = combineDateTime(session.date, session.start_time)
                  const endDateTime = combineDateTime(session.date, session.end_time, true, session.start_time)

                  return (
                    <tr
                      key={session.session_id}
                      className="border-t hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={(e) => handleRowClick(e, session.session_id)}
                    >
                      <td className="p-3">
                        <div className="font-medium">{session.title}</div>
                        <p className="text-xs text-muted-foreground">
                          {session.description && session.description.substring(0, 50)}
                          {session.description && session.description.length > 50 ? '...' : ''}
                        </p>
                      </td>
                      <td className="p-3">
                        {session.teachers[0] ?
                          `${session.teachers[0].first_name} ${session.teachers[0].last_name}` :
                          'No teacher assigned'}
                      </td>
                      <td className="p-3">
                        <div>{format(startDateTime, "EEEE, MMMM d, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(startDateTime, "h:mm a")} - {format(endDateTime, "h:mm a")}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="inline-block">{session.subject}</div>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={session.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalFilteredPages}
            pageSize={pageSize}
            totalItems={totalFilteredItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  )
}
