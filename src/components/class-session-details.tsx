"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTracker } from "@/components/attendance-tracker"
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
import { useState } from "react"
import {
  CalendarDays,
  Users,
  UserCircle2,
  Clock,
} from "lucide-react"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { ClientTimeDisplay } from "./client-time-display"
import React from "react"
import { checkIfAdmin } from "@/lib/get/get-profiles"

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
    class_link: string | null
    teachers: Array<{
      teacher_id: string
      first_name: string
      last_name: string
      avatar_url?: string | null
      role: string
    }>
    enrolled_students: Array<{
      student_id: string
      first_name: string
      last_name: string
      avatar_url?: string | null
    }>
  }
  userRole: 'admin' | 'teacher' | 'parent' | 'student'
  userParentStudents?: string[] // Only needed for parent role
}

export function ClassSessionDetails({ classData, userRole, userParentStudents = [] }: ClassSessionDetailsProps) {
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
    class_link: classData.class_link,
    teacher: {
      teacher_id: classData.teachers?.[0]?.teacher_id || '',
      first_name: classData.teachers?.[0]?.first_name || '',
      last_name: classData.teachers?.[0]?.last_name || '',
      role: classData.teachers?.[0]?.role || ''
    },
    enrolled_students: classData.enrolled_students || []
  }

  // Ensure arrays are defined
  const teachers = classData.teachers || []
  const enrolledStudents = classData.enrolled_students || []

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
              />
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
                  <div className="p-4 bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Date & Time</span>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDateTime(startDateTime, "EEEE, MMMM d, yyyy", timezone)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <ClientTimeDisplay date={startDateTime} format="h:mm a" /> - <ClientTimeDisplay date={endDateTime} format="h:mm a" /> ({duration})
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
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No students enrolled</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-6">
            {/* Description section removed - now in header */}
          </div>

          {/* Attendance Tracker */}
          {showActions && (
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
          )}

        </CardContent>
      </Card>
    </>
  )
}
