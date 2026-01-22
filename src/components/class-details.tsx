"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { CalendarDays, User, UserPen, Clock, Edit, Plus } from "lucide-react"
import { getSessions } from "@/lib/get/get-classes"
import { useEffect, useState, useCallback } from "react"
import { ClassSessionType } from "@/types"
import { useRouter } from "next/navigation"
import { formatDateTime, utcToLocal, combineDateTimeToUtc } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { toZonedTime, formatInTimeZone } from "date-fns-tz"
import { format } from "date-fns"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { ClientTimeDisplay } from "./client-time-display"
import { AddSessionDialog } from "./add-session-dialog"
import React from "react"

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
`

type ClassDetailsProps = {
  classData: {
    class_id: string
    title: string
    description: string | null
    subject: string
    start_date: string
    end_date: string
    status: string
    days_repeated: {
      monday?: { start: string; end: string }
      tuesday?: { start: string; end: string }
      wednesday?: { start: string; end: string }
      thursday?: { start: string; end: string }
      friday?: { start: string; end: string }
      saturday?: { start: string; end: string }
      sunday?: { start: string; end: string }
    }
    class_link: string | null
    timezone?: string // IANA timezone identifier (e.g., 'America/New_York')
    teachers: {
      teacher_id: string
      first_name: string
      last_name: string
      avatar_url: string | null
      role: string
    }[]
    students: {
      student_id: string
      first_name: string
      last_name: string
      avatar_url: string | null
    }[]
  }
  userRole: 'admin' | 'teacher' | 'parent' | 'student'
  userParentStudents?: string[] // Only needed for parent role
}

export function ClassDetails({ classData, userRole, userParentStudents = [] }: ClassDetailsProps) {
  const [sessions, setSessions] = useState<ClassSessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false)
  const router = useRouter()
  const { timezone } = useTimezone()

  // Determine if actions should be shown based on user role
  const showActions = userRole === 'admin'

  // Determine if links should be enabled based on user role
  const enableLinks = userRole === 'admin' || userRole === 'teacher' || userRole === 'parent'

  const fetchSessions = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const sessionsData = await getSessions(classData.class_id)
      setSessions(sessionsData)
    } catch (error) {
      console.error("Error fetching sessions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [classData.class_id])

  useEffect(() => {
    fetchSessions(true)
  }, [fetchSessions])

  const getRedirectPath = (action: 'list' | 'edit') => {
    const basePath = `/${userRole}`
    return action === 'edit'
      ? `${basePath}/classes/edit/${classData.class_id}`
      : `${basePath}/classes`
  }

  const getEntityPath = (entityType: 'teachers' | 'students', entityId: string) => {
    // Check if this is a teacher entity and if the teacher is actually an admin
    if (entityType === 'teachers') {
      const teacher = classData.teachers.find(t => t.teacher_id === entityId)
      if (teacher && teacher.role === 'admin') {
        return `/${userRole}/admins/${entityId}`
      }
    }
    return `/${userRole}/${entityType}/${entityId}`
  }

  const getSessionPath = (sessionId: string) => {
    return `/${userRole}/classes/${classData.class_id}/${sessionId}`
  }

  // Check if a student is associated with the current parent user
  const isStudentAssociatedWithParent = (studentId: string) => {
    if (userRole !== 'parent') return true // Allow all students for non-parent users
    return userParentStudents.includes(studentId)
  }

  // Check if links should be enabled for a specific student
  const shouldEnableStudentLink = (studentId: string) => {
    if (!enableLinks) return false
    if (userRole === 'admin' || userRole === 'teacher') return true
    if (userRole === 'parent') return isStudentAssociatedWithParent(studentId)
    return false
  }

  // Check if links should be enabled for teachers
  const shouldEnableTeacherLink = () => {
    return enableLinks && (userRole === 'admin')
  }

  // Ensure arrays are defined
  const teachers = classData.teachers || []
  const enrolledStudents = classData.students || []
  const daysRepeated = classData.days_repeated || {}

  // Get the class timezone (default to America/New_York if not set)
  const classTimezone = classData.timezone || 'America/New_York'

  // Helper function to convert time from class timezone to user timezone and format
  // Times in days_repeated are stored as local times in the class timezone
  // We need to convert them to the user's timezone for display
  const convertAndFormatTime = (timeInClassTz: string): string => {
    try {
      // Use today's date as a reference point
      const today = new Date()
      const dateStr = format(today, 'yyyy-MM-dd')

      // Convert the time from class timezone to UTC first
      // combineDateTimeToUtc creates a UTC date from a local time in a specific timezone
      const utcDate = combineDateTimeToUtc(
        dateStr,
        `${timeInClassTz}:00`,
        classTimezone
      )

      // Now convert from UTC to user's timezone
      const userTzDate = toZonedTime(utcDate, timezone)

      // Format as 12-hour time
      const userHours = userTzDate.getHours()
      const userMinutes = userTzDate.getMinutes()
      const hour12 = userHours === 0 ? 12 : userHours > 12 ? userHours - 12 : userHours
      const ampm = userHours >= 12 ? 'PM' : 'AM'

      return `${hour12}:${String(userMinutes).padStart(2, '0')} ${ampm}`
    } catch (error) {
      console.error('Error converting and formatting time:', error)
      // Fallback: just format the original time
      const [hours, minutes] = timeInClassTz.split(':').map(Number)
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      const ampm = hours >= 12 ? 'PM' : 'AM'
      return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
    }
  }

  // Helper function to convert day name and time from class timezone to user timezone
  // Returns both the converted day name and formatted time
  const convertDayAndTime = (dayName: string, timeSlot: { start: string; end: string }): { day: string; startTime: string; endTime: string } => {
    try {
      // Map day names to day indices (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
      const dayMap: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      }

      const dayIndex = dayMap[dayName.toLowerCase()]
      if (dayIndex === undefined) {
        throw new Error(`Invalid day name: ${dayName}`)
      }

      // Find the next occurrence of this day (or use a reference date)
      const today = new Date()
      const currentDay = today.getDay()
      let daysUntilTargetDay = dayIndex - currentDay
      if (daysUntilTargetDay < 0) {
        daysUntilTargetDay += 7 // Next week
      }
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + daysUntilTargetDay)
      const dateStr = format(targetDate, 'yyyy-MM-dd')

      // Convert start time from class timezone to UTC, then to user timezone
      const startUtcDate = combineDateTimeToUtc(
        dateStr,
        `${timeSlot.start}:00`,
        classTimezone
      )
      const startUserTzDate = toZonedTime(startUtcDate, timezone)

      // Convert end time from class timezone to UTC, then to user timezone
      const endUtcDate = combineDateTimeToUtc(
        dateStr,
        `${timeSlot.end}:00`,
        classTimezone
      )
      const endUserTzDate = toZonedTime(endUtcDate, timezone)

      // Get the day name in user's timezone (the day might have changed due to timezone conversion)
      // Use formatInTimeZone with the UTC date to get the day in the user's timezone
      const convertedDayName = formatInTimeZone(startUtcDate, timezone, 'EEEE').toLowerCase()

      // Format times as 12-hour format
      const startHours = startUserTzDate.getHours()
      const startMinutes = startUserTzDate.getMinutes()
      const startHour12 = startHours === 0 ? 12 : startHours > 12 ? startHours - 12 : startHours
      const startAmpm = startHours >= 12 ? 'PM' : 'AM'
      const formattedStartTime = `${startHour12}:${String(startMinutes).padStart(2, '0')} ${startAmpm}`

      const endHours = endUserTzDate.getHours()
      const endMinutes = endUserTzDate.getMinutes()
      const endHour12 = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours
      const endAmpm = endHours >= 12 ? 'PM' : 'AM'
      const formattedEndTime = `${endHour12}:${String(endMinutes).padStart(2, '0')} ${endAmpm}`

      return {
        day: convertedDayName,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      }
    } catch (error) {
      console.error('Error converting day and time:', error)
      // Fallback: use original day and convert time only
      const formattedStartTime = timeSlot.start ? convertAndFormatTime(timeSlot.start) : ''
      const formattedEndTime = timeSlot.end ? convertAndFormatTime(timeSlot.end) : ''
      return {
        day: dayName,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      }
    }
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <Card>
        <CardHeader className="border-b pb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Title and Subject on the left */}
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle className="text-2xl truncate">{classData.title}</CardTitle>
              <CardDescription className="text-lg truncate">{classData.subject}</CardDescription>
              {classData.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  {classData.description}
                </p>
              )}
            </div>
            {/* Status Badge and Action Buttons on the right */}
            <div className="flex flex-col items-end gap-4 flex-shrink-0">
              <StatusBadge status={convertStatusToPrefixedFormat(classData.status, 'class')} />
              {showActions && (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    className="h-9 w-9 text-white border-[#3d8f5b] hover:border-[#3d8f5b] hover:bg-[#2d7a4b]"
                    style={{ backgroundColor: "#3d8f5b" }}
                    aria-label="Add session"
                    onClick={() => setIsAddSessionDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
                    aria-label="Edit class"
                    onClick={() => router.push(getRedirectPath('edit'))}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Main Info Grid - Reorganized Layout */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Schedule Section - Left Side */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Schedule</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-card">
                    <p className="text-sm font-medium">
                      {formatDateTime(classData.start_date, "MMM d, yyyy", timezone)} - {formatDateTime(classData.end_date, "MMM d, yyyy", timezone)}
                    </p>
                    {Object.keys(daysRepeated).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(daysRepeated).map(([day, timeSlot]) => {
                          // Convert day and times from class timezone to user timezone
                          const converted = timeSlot ? convertDayAndTime(day, timeSlot) : null
                          if (!converted) return null
                          return (
                            <span
                              key={day}
                              className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200 shadow-sm"
                            >
                              <CalendarDays className="h-3 w-3 mr-1 text-blue-400" />
                              {converted.day.charAt(0).toUpperCase() + converted.day.slice(1)} {converted.startTime} - {converted.endTime}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Teachers and Students - Middle and Right Side */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Teachers Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserPen className="h-5 w-5" />
                    <h3 className="text-sm font-medium">Teachers</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">{teachers.length}</span>
                  </div>
                  {teachers.length > 0 ? (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                      {teachers.map((teacher) => (
                        <React.Fragment key={teacher.teacher_id}>
                          {shouldEnableTeacherLink() ? (
                            <Link
                              href={getEntityPath('teachers', teacher.teacher_id)}
                              className="block"
                            >
                              <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                <Avatar className="h-8 w-8">
                                  {teacher.avatar_url && <AvatarImage src={teacher.avatar_url} alt={teacher.first_name} />}
                                  <AvatarFallback>{teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-primary truncate">
                                    {teacher.first_name} {teacher.last_name}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-card">
                              <Avatar className="h-8 w-8">
                                {teacher.avatar_url && <AvatarImage src={teacher.avatar_url} alt={teacher.first_name} />}
                                <AvatarFallback>{teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary truncate">
                                  {teacher.first_name} {teacher.last_name}
                                </p>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                      <UserPen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No teachers assigned</p>
                    </div>
                  )}
                </div>

                {/* Students Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-5 w-5" />
                    <h3 className="text-sm font-medium">Students</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">{enrolledStudents.length}</span>
                  </div>
                  {enrolledStudents.length > 0 ? (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                      {enrolledStudents.map((student) => (
                        <React.Fragment key={student.student_id}>
                          {shouldEnableStudentLink(student.student_id) ? (
                            <Link
                              href={getEntityPath('students', student.student_id)}
                              className="block"
                            >
                              <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                                <Avatar className="h-8 w-8">
                                  {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.first_name} />}
                                  <AvatarFallback>{student.first_name.charAt(0)}{student.last_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-primary truncate">
                                    {student.first_name} {student.last_name}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-card">
                              <Avatar className="h-8 w-8">
                                {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.first_name} />}
                                <AvatarFallback>{student.first_name.charAt(0)}{student.last_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary truncate">
                                  {student.first_name} {student.last_name}
                                </p>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                      <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No students enrolled</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sessions (Scrollable) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <h3 className="text-sm font-medium">Class Sessions</h3>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">{sessions.length}</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading sessions...</p>
              ) : sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions
                    .sort((a, b) => {
                      try {
                        const aStart = utcToLocal(a.start_date, timezone);
                        const bStart = utcToLocal(b.start_date, timezone);
                        return aStart.getTime() - bStart.getTime();
                      } catch (error) {
                        console.error('Error sorting sessions:', error);
                        return 0;
                      }
                    })
                    .map((session) => (
                      <Link
                        key={session.session_id}
                        href={getSessionPath(session.session_id)}
                        className="block transition-colors hover:bg-muted/50"
                      >
                        <div className="p-2 rounded-lg border bg-card">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {formatDateTime(session.start_date, "EEEE, MMMM d", timezone)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <ClientTimeDisplay date={utcToLocal(session.start_date, timezone)} format="h:mm a" /> - <ClientTimeDisplay date={utcToLocal(session.end_date, timezone)} format="h:mm a" />
                              </p>
                            </div>
                            <StatusBadge status={convertStatusToPrefixedFormat(session.status, 'session')} />
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sessions scheduled</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <AddSessionDialog
        open={isAddSessionDialogOpen}
        onOpenChange={setIsAddSessionDialogOpen}
        classId={classData.class_id}
        classTimezone={classTimezone}
        onSessionCreated={fetchSessions}
      />
    </>
  )
} 