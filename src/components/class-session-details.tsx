"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassActionButtons } from "@/components/class-action-buttons"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDuration } from "@/lib/utils"
import { differenceInMinutes, isValid } from "date-fns"
import {
  formatDateTime,
  utcToLocal,
} from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  CalendarDays,
  User,
  UserPen,
  Clock,
  CheckCircle,
} from "lucide-react"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { ClientTimeDisplay } from "./client-time-display"
import { SessionRemarks } from "./session-remarks"
import { AttendanceStatusBadge } from "./attendance-status-badge"
import { AttendanceTracker } from "./attendance-tracker"
import { getSessionAttendanceForAll } from "@/lib/get/get-classes"
import { CancellationReasonDisplay } from "./cancellation-reason-display"
import { getUserNameById } from "@/lib/utils/get-user-name"
import { getSessionHistory } from "@/lib/get/get-session-history"
import { formatDuration as formatIntervalDuration } from "@/lib/utils/format-duration"
import { SessionHistoryType } from "@/types"
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

interface ClassSessionDetailsProps {
  classData: {
    class_id: string
    session_id: string
    title: string
    description: string | null
    subject: string
    start_date: string
    end_date: string
    status: string
    cancellation_reason?: string | null
    cancelled_by?: string | null
    class_link: string | null
    teachers: Array<{
      teacher_id: string
      first_name: string
      last_name: string
      avatar_url?: string | null
      role: string
    }>
    students: Array<{
      student_id: string
      first_name: string
      last_name: string
      avatar_url?: string | null
    }>
  }
  userRole: 'admin' | 'teacher' | 'parent' | 'student'
  userId?: string
  userParentStudents?: string[] // Only needed for parent role
}

export function ClassSessionDetails({ classData, userRole, userId, userParentStudents = [] }: ClassSessionDetailsProps) {
  const [currentStatus, setCurrentStatus] = useState(classData.status)
  const [attendanceData, setAttendanceData] = useState<{
    teacherAttendance: Array<{ teacher_id: string; attendance_status: string }>,
    studentAttendance: Array<{ student_id: string; attendance_status: string }>
  }>({ teacherAttendance: [], studentAttendance: [] })
  const [loadingAttendance, setLoadingAttendance] = useState(true)
  const [cancelledByName, setCancelledByName] = useState<string | null>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryType | null>(null)
  const [loadingSessionHistory, setLoadingSessionHistory] = useState(false)
  const { timezone } = useTimezone()

  // Convert UTC times to local timezone for display
  const startDateTime = utcToLocal(classData.start_date, timezone)
  const endDateTime = utcToLocal(classData.end_date, timezone)

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoadingAttendance(true)
      try {
        const data = await getSessionAttendanceForAll(classData.session_id)
        setAttendanceData(data)
      } catch (error) {
        console.error('Error fetching attendance data:', error)
      } finally {
        setLoadingAttendance(false)
      }
    }

    fetchAttendanceData()
  }, [classData.session_id])

  // Refresh attendance data when session status changes
  useEffect(() => {
    const refreshAttendanceData = async () => {
      try {
        const data = await getSessionAttendanceForAll(classData.session_id)
        setAttendanceData(data)
      } catch (error) {
        console.error('Error refreshing attendance data after status change:', error)
      }
    }

    // Only refresh if the status has changed from the original status
    if (currentStatus !== classData.status) {
      refreshAttendanceData()
    }
  }, [currentStatus, classData.session_id, classData.status])

  // Fetch cancelled by name if session is cancelled
  useEffect(() => {
    const fetchCancelledByName = async () => {
      if (currentStatus === 'cancelled' && classData.cancelled_by && userRole === 'admin') {
        try {
          const name = await getUserNameById(classData.cancelled_by)
          setCancelledByName(name)
        } catch (error) {
          console.error('Error fetching cancelled by name:', error)
        }
      }
    }

    fetchCancelledByName()
  }, [currentStatus, classData.cancelled_by, userRole])

  // Fetch session history for completed sessions
  useEffect(() => {
    const fetchSessionHistory = async () => {
      if (currentStatus === 'complete' || currentStatus === 'absence') {
        setLoadingSessionHistory(true)
        try {
          const history = await getSessionHistory(classData.session_id)
          setSessionHistory(history)
        } catch (error) {
          console.error('Error fetching session history:', error)
        } finally {
          setLoadingSessionHistory(false)
        }
      }
    }

    fetchSessionHistory()
  }, [currentStatus, classData.session_id])

  // Calculate duration
  let durationMinutes = 60 // default to 1 hour
  if (isValid(startDateTime) && isValid(endDateTime)) {
    // Handle sessions that cross midnight
    let calculatedDuration = differenceInMinutes(endDateTime, startDateTime)

    // If the duration is negative, it means the session crosses midnight
    // In this case, we need to add 24 hours (1440 minutes) to get the correct duration
    if (calculatedDuration < 0) {
      calculatedDuration += 24 * 60 // Add 24 hours in minutes
    }

    durationMinutes = Math.max(calculatedDuration, 0)
  }

  const scheduledDuration = formatDuration(durationMinutes)

  // Get actual duration from session history for completed sessions
  const actualDuration = (currentStatus === 'complete' || currentStatus === 'absence') && sessionHistory?.duration
    ? formatIntervalDuration(sessionHistory.duration)
    : null

  // Determine if actions should be shown based on user role
  const showActions = userRole === 'admin' || userRole === 'teacher'

  // Determine if links should be enabled based on user role
  const enableLinks = userRole === 'admin' || userRole === 'teacher' || userRole === 'parent'

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

  // Helper functions to get attendance status
  const getTeacherAttendanceStatus = (teacherId: string) => {
    const attendance = attendanceData.teacherAttendance.find(a => a.teacher_id === teacherId)
    return attendance?.attendance_status || 'expected'
  }

  const getStudentAttendanceStatus = (studentId: string) => {
    const attendance = attendanceData.studentAttendance.find(a => a.student_id === studentId)
    return attendance?.attendance_status || 'expected'
  }

  const getEntityPath = (entityType: 'teachers' | 'students', entityId: string) => {

    return `/${userRole}/${entityType}/${entityId}`
  }

  // Prepare data for ClassManagementActions
  const classDataForActions = {
    class_id: classData.class_id,
    session_id: classData.session_id,
    title: classData.title,
    description: classData.description || '',
    subject: classData.subject,
    start_time: classData.start_date,
    end_time: classData.end_date,
    status: classData.status,
    cancellation_reason: classData.cancellation_reason || null,
    cancelled_by: classData.cancelled_by || null,
    class_link: classData.class_link,
    teachers: classData.teachers || [],
    students: classData.students || [],
    attendance: attendanceData.studentAttendance.reduce((acc, student) => {
      acc[student.student_id] = student.attendance_status === 'present'
      return acc
    }, {} as Record<string, boolean>)
  }

  // Ensure arrays are defined
  const teachers = classData.teachers || []
  const enrolledStudents = classData.students || []

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
              <StatusBadge status={convertStatusToPrefixedFormat(currentStatus, 'session')} />
              <ClassActionButtons
                classData={classDataForActions}
                currentStatus={currentStatus}
                onStatusChange={setCurrentStatus}
                showOnlyJoinCall={!showActions}
                userRole={userRole}
                userId={userId}
              />
            </div>
          </div>
        </CardHeader>

        {/* Show cancellation reason at the top for cancelled sessions (admin only) */}
        {currentStatus === 'cancelled' && userRole === 'admin' && classData.cancellation_reason && (
          <div className="px-6 pt-4">
            <CancellationReasonDisplay
              cancellationReason={classData.cancellation_reason}
              cancelledByName={cancelledByName}
            />
          </div>
        )}

        {/* Show actual session times and duration for completed sessions */}
        {(currentStatus === 'complete' || currentStatus === 'absence') && (
          <div className="px-6 pt-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Actual Session Times</span>
              </div>
              {loadingSessionHistory ? (
                <p className="text-sm text-green-700">Loading session details...</p>
              ) : sessionHistory ? (
                <div className="space-y-2">
                  {sessionHistory.actual_start_time && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Started:</span>
                      <span className="text-sm font-medium text-green-800">
                        {formatDateTime(utcToLocal(sessionHistory.actual_start_time, timezone), "MMM d, yyyy 'at' h:mm a", timezone)}
                      </span>
                    </div>
                  )}
                  {sessionHistory.actual_end_time && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700">Ended:</span>
                      <span className="text-sm font-medium text-green-800">
                        {formatDateTime(utcToLocal(sessionHistory.actual_end_time, timezone), "MMM d, yyyy 'at' h:mm a", timezone)}
                      </span>
                    </div>
                  )}
                  {actualDuration && (
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="text-sm text-green-700">Total Duration:</span>
                      <span className="text-sm font-medium text-green-800">
                        {actualDuration}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-700">Session details not available</p>
              )}
            </div>
          </div>
        )}

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
                  <div className="p-4 bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Date & Time</span>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDateTime(startDateTime, "EEEE, MMMM d, yyyy", timezone)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <ClientTimeDisplay date={startDateTime} format="h:mm a" /> - <ClientTimeDisplay date={endDateTime} format="h:mm a" /> ({scheduledDuration})
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
                                {!loadingAttendance && (
                                  <AttendanceStatusBadge
                                    status={getTeacherAttendanceStatus(teacher.teacher_id)}
                                    size="sm"
                                  />
                                )}
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
                              {!loadingAttendance && (
                                <AttendanceStatusBadge
                                  status={getTeacherAttendanceStatus(teacher.teacher_id)}
                                  size="sm"
                                />
                              )}
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
                                {!loadingAttendance && (
                                  <AttendanceStatusBadge
                                    status={getStudentAttendanceStatus(student.student_id)}
                                    size="sm"
                                  />
                                )}
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
                              {!loadingAttendance && (
                                <AttendanceStatusBadge
                                  status={getStudentAttendanceStatus(student.student_id)}
                                  size="sm"
                                />
                              )}
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

          {/* Attendance Tracker Section */}
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5" />
                <h3 className="text-sm font-medium">Attendance</h3>
              </div>
              <AttendanceTracker
                sessionId={classData.session_id}
                sessionDate={classData.start_date}
                students={classData.students}
                teachers={classData.teachers}
                currentStatus={currentStatus}
                onStatusChange={setCurrentStatus}
                userRole={userRole}
                existingAttendance={attendanceData}
                onAttendanceUpdate={() => {
                  // Refresh attendance data
                  const fetchAttendanceData = async () => {
                    try {
                      const data = await getSessionAttendanceForAll(classData.session_id)
                      setAttendanceData(data)
                    } catch (error) {
                      console.error('Error refreshing attendance data:', error)
                    }
                  }
                  fetchAttendanceData()
                }}
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <SessionRemarks
              sessionId={classData.session_id}
              sessionStatus={currentStatus}
              students={classData.students}
              userRole={userRole}
            />
          </div>

        </CardContent>
      </Card>
    </>
  )
}
