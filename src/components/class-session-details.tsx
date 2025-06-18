"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { ClassManagementActions } from "@/components/class-management-actions"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDuration } from "@/lib/utils"
import { differenceInMinutes, isValid } from "date-fns"
import {
  formatDateTime,
  formatTime,
  utcToLocal,
} from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import Link from "next/link"
import { useState } from "react"
import {
  CalendarDays,
  Users,
  BookOpen,
  Link as LinkIcon,
  UserCircle2,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  UserX
} from "lucide-react"

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

// Helper function to safely format dates
const safeFormat = (date: Date, formatStr: string, fallback = "N/A") => {
  try {
    if (!date || !isValid(date)) return fallback;
    return formatDateTime(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

// Helper function to safely parse ISO date strings
const safeParseISO = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    return utcToLocal(dateString);
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

// Helper function to parse time strings (HH:mm:ss)
const parseTimeString = (timeString: string | null | undefined): Date | null => {
  if (!timeString) return null;
  try {
    // Check if it's just a time string (no date part)
    if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
      const today = new Date();
      // For time-only strings, we'll use a different approach
      const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
      const result = new Date(today);
      result.setHours(hours || 0, minutes || 0, seconds);
      return isValid(result) ? result : null;
    }
    // If not a simple time string, try standard ISO parsing
    return safeParseISO(timeString);
  } catch (error) {
    console.error("Error parsing time:", error);
    return null;
  }
}

interface ClassSessionDetailsProps {
  classData: {
    session_id: string
    title: string
    description: string | null
    subject: string
    start_date: string
    end_date: string
    status: string
    class_link: string | null
    teachers: Array<{
      teacher_id: string
      first_name: string
      last_name: string
      avatar_url?: string | null
    }>
    enrolled_students: Array<{
      student_id: string
      first_name: string
      last_name: string
      avatar_url?: string | null
    }>
  }
}

export function ClassSessionDetails({ classData }: ClassSessionDetailsProps) {
  const [currentStatus, setCurrentStatus] = useState(classData.status)
  const { timezone } = useTimezone()

  // Convert UTC times to local timezone for display
  const startDateTime = utcToLocal(classData.start_date, timezone)
  const endDateTime = utcToLocal(classData.end_date, timezone)

  // Calculate duration
  let durationMinutes = 60 // default to 1 hour
  if (isValid(startDateTime) && isValid(endDateTime)) {
    durationMinutes = Math.max(differenceInMinutes(endDateTime, startDateTime), 0)
  }

  const duration = formatDuration(durationMinutes)

  // Prepare data for ClassManagementActions
  const classDataForActions = {
    session_id: classData.session_id,
    title: classData.title,
    description: classData.description || '',
    subject: classData.subject,
    start_time: classData.start_date,
    end_time: classData.end_date,
    status: classData.status,
    class_link: classData.class_link,
    teacher: {
      teacher_id: classData.teachers?.[0]?.teacher_id || '',
      first_name: classData.teachers?.[0]?.first_name || '',
      last_name: classData.teachers?.[0]?.last_name || ''
    },
    enrolled_students: classData.enrolled_students || []
  }

  // Ensure arrays are defined
  const teachers = classData.teachers || []
  const enrolledStudents = classData.enrolled_students || []

  // Get status icon based on current status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return <CalendarDays className="h-4 w-4" />
      case 'running':
        return <Play className="h-4 w-4" />
      case 'complete':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'absence':
        return <UserX className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <Card>
        <CardHeader className="border-b pb-6">
          <div className="flex items-center justify-between">
            {/* Title and Buttons Row */}
            <div className="flex items-center gap-8 flex-1 min-w-0">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-2xl truncate">{classData.title}</CardTitle>
                <CardDescription className="text-lg truncate">{classData.subject}</CardDescription>
              </div>
              <div className="flex-shrink-0 ml-6">
                <ClassManagementActions
                  classData={classDataForActions}
                  currentStatus={currentStatus}
                  onStatusChange={setCurrentStatus}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <StatusBadge status={currentStatus} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Session Details - Left Side */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Session Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Date & Time</span>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDateTime(startDateTime, "EEEE, MMMM d, yyyy", timezone)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(startDateTime, "h:mm a", timezone)} - {formatDateTime(endDateTime, "h:mm a", timezone)} ({duration})
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Teachers and Students - Right Side */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Teachers Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserCircle2 className="h-5 w-5" />
                    <h3 className="text-sm font-medium">Teachers</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">{teachers.length}</span>
                  </div>
                  {teachers.length > 0 ? (
                    <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                      {teachers.map((teacher) => (
                        <Link
                          key={teacher.teacher_id}
                          href={`/admin/teachers/${teacher.teacher_id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                            <Avatar className="h-12 w-12">
                              {teacher.avatar_url && <AvatarImage src={teacher.avatar_url} alt={teacher.first_name} />}
                              <AvatarFallback className="text-sm font-medium">
                                {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-primary truncate">
                                {teacher.first_name} {teacher.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">Teacher</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                      <UserCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No teachers assigned</p>
                    </div>
                  )}
                </div>

                {/* Students Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <h3 className="text-sm font-medium">Students Enrolled</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">{enrolledStudents.length}</span>
                  </div>
                  {enrolledStudents.length > 0 ? (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                      {enrolledStudents.map((student) => (
                        <Link
                          key={student.student_id}
                          href={`/admin/students/${student.student_id}`}
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
                              <p className="text-xs text-muted-foreground">Student</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No students enrolled</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {/* Description */}
                {classData.description && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-5 w-5" />
                      <h3 className="text-sm font-medium">Description</h3>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {classData.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Tracker */}
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <h3 className="text-sm font-medium">Attendance</h3>
              </div>
              <div>
                <AttendanceTracker
                  sessionId={classData.session_id}
                  sessionDate={formatDateTime(startDateTime, 'yyyy-MM-dd', timezone)}
                  students={classData.enrolled_students}
                  currentStatus={currentStatus}
                  onStatusChange={setCurrentStatus}
                />
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </>
  )
}
