"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { CalendarDays, Users, UserPen, Clock, Trash2, Edit } from "lucide-react"
import { getSessions } from "@/lib/get/get-classes"
import { deleteClass } from "@/lib/delete/delete-classes"
import { updateClassAssignments } from "@/lib/put/put-classes"
import { useEffect, useState } from "react"
import { ClassSessionType } from "@/types"
import { useRouter } from "next/navigation"
import { formatDateTime, utcToLocal } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { ClientTimeDisplay } from "./client-time-display"
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
    teachers: {
      teacher_id: string
      first_name: string
      last_name: string
      avatar_url: string | null
      role: string
    }[]
    enrolled_students: {
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { timezone } = useTimezone()

  // Determine if actions should be shown based on user role
  const showActions = userRole === 'admin' || userRole === 'teacher'

  // Determine if links should be enabled based on user role
  const enableLinks = userRole === 'admin' || userRole === 'teacher' || userRole === 'parent'

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsData = await getSessions(classData.class_id)
        setSessions(sessionsData)
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [classData.class_id])

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

  const handleDeleteClass = async () => {
    setIsDeleting(true)
    try {
      // First, clean up teacher-student relationships by removing all assignments
      // This ensures the teacher_students table is properly cleaned up
      const cleanupResult = await updateClassAssignments({
        classId: classData.class_id,
        teacher_ids: [], // Remove all teachers
        student_ids: []  // Remove all students
      })

      if (!cleanupResult.success) {
        console.warn('Warning: Failed to clean up teacher-student relationships:', cleanupResult.error?.message)
        // Continue with deletion anyway
      }

      // Then delete the class
      const result = await deleteClass(classData.class_id)

      if (result.success) {
        toast({
          title: "Class Deleted",
          description: `"${classData.title}" has been successfully deleted.`,
        })
        // Redirect to classes list based on user role
        router.push(getRedirectPath('list'))
      } else {
        throw new Error(result.error || "Failed to delete class")
      }
    } catch (error) {
      console.error("Error deleting class:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete class. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Ensure arrays are defined
  const teachers = classData.teachers || []
  const enrolledStudents = classData.enrolled_students || []
  const daysRepeated = classData.days_repeated || {}

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
                    className="h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
                    aria-label="Edit class"
                    onClick={() => router.push(getRedirectPath('edit'))}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        className="h-9 w-9 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                        aria-label="Delete class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Class</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete &quot;{classData.title}&quot;? This action cannot be undone and will permanently remove the class and all associated data including sessions, teacher assignments, and student enrollments.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDeleteClass}
                          disabled={isDeleting}
                          className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                        >
                          {isDeleting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Class
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                        {Object.entries(daysRepeated).map(([day, timeSlot]) => (
                          <span
                            key={day}
                            className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200 shadow-sm"
                          >
                            <CalendarDays className="h-3 w-3 mr-1 text-blue-400" />
                            {day.charAt(0).toUpperCase() + day.slice(1)} {timeSlot?.start}-{timeSlot?.end}
                          </span>
                        ))}
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
                    <Users className="h-5 w-5" />
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
                      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
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
    </>
  )
} 