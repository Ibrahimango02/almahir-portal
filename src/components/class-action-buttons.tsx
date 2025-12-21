"use client"

import { Button } from "@/components/ui/button"
import { Video, Power, Play, CalendarSync, LogOut, RotateCcw } from "lucide-react"
import { FaRegCircleStop } from "react-icons/fa6";
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { updateSession, updateSessionAttendance, resetSession } from "@/lib/put/put-classes"
import { createRescheduleRequest } from "@/lib/post/post-reschedule-requests"
import { getUserTimezone, localToUtc } from "@/lib/utils/timezone"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { SessionRemarksForm } from "./session-remarks-form"

type ClassActionButtonsProps = {
  classData: {
    class_id: string
    session_id: string
    title: string
    description: string
    subject: string
    start_time: string
    end_time: string
    status: string
    cancellation_reason?: string | null
    cancelled_by?: string | null
    class_link: string | null
    teachers: {
      teacher_id: string
      first_name: string
      last_name: string
      role?: string
    }[]
    students: {
      student_id: string
      first_name: string
      last_name: string
    }[]
    attendance?: Record<string, boolean>
  }
  currentStatus: string
  onStatusChange: (status: string) => void
  showOnlyJoinCall?: boolean
  userRole?: 'admin' | 'moderator' | 'teacher' | 'student' | 'parent'
  userId?: string
  existingAttendance?: {
    teacherAttendance: Array<{ teacher_id: string; attendance_status: string }>
    studentAttendance: Array<{ student_id: string; attendance_status: string }>
  }
}

export function ClassActionButtons({ classData, currentStatus, onStatusChange, showOnlyJoinCall = false, userRole, userId, existingAttendance }: ClassActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [showSessionRemarksDialog, setShowSessionRemarksDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [markCompleteChecked, setMarkCompleteChecked] = useState(currentStatus === 'complete')
  const { toast } = useToast()

  // Update checkbox state when currentStatus changes
  useEffect(() => {
    setMarkCompleteChecked(currentStatus === 'complete')
  }, [currentStatus])
  const router = useRouter()

  // Check if initiate button should be enabled (within 5 minutes of start time and before end time)
  const canInitiateSession = () => {
    const now = new Date()
    const startTime = new Date(classData.start_time)
    const endTime = new Date(classData.end_time)
    const fiveMinutesBefore = new Date(startTime.getTime() - 5 * 60 * 1000) // 5 minutes before start time

    // Handle sessions that cross midnight
    if (endTime < startTime) {
      // Session crosses midnight, so we need to check if current time is between start and end
      // For midnight-crossing sessions, we consider the session active if:
      // 1. Current time is after start time (same day), OR
      // 2. Current time is before end time (next day)
      return now >= fiveMinutesBefore && (now >= startTime || now <= endTime)
    }

    // Regular same-day session
    return now >= fiveMinutesBefore && now <= endTime
  }

  // Check if Join Class button should be enabled (within 5 minutes of start time and before end time)
  const canJoinClass = () => {
    const now = new Date()
    const startTime = new Date(classData.start_time)
    const endTime = new Date(classData.end_time)
    const fiveMinutesBefore = new Date(startTime.getTime() - 5 * 60 * 1000) // 5 minutes before start time

    // Handle sessions that cross midnight
    if (endTime < startTime) {
      // Session crosses midnight, so we need to check if current time is between start and end
      // For midnight-crossing sessions, we consider the session active if:
      // 1. Current time is after start time (same day), OR
      // 2. Current time is before end time (next day)
      return now >= fiveMinutesBefore && (now >= startTime || now <= endTime)
    }

    // Regular same-day session
    return now >= fiveMinutesBefore && now <= endTime
  }

  // Check if cancel button should be enabled (only if current time is 2 hours before start time and status is scheduled or rescheduled)
  const canCancelSession = () => {
    // Only allow cancellation if status is 'scheduled' or 'rescheduled'
    if (currentStatus !== 'scheduled' && currentStatus !== 'rescheduled') {
      return false
    }

    const now = new Date()
    const startTime = new Date(classData.start_time)
    const twoHoursBefore = new Date(startTime.getTime() - 2 * 60 * 60 * 1000) // 2 hours before start time

    return now <= twoHoursBefore
  }

  // Check if admin can cancel session (enabled for scheduled, pending, or running statuses)
  const canAdminCancelSession = () => {
    return (
      currentStatus === 'scheduled' ||
      currentStatus === 'rescheduled' ||
      currentStatus === 'pending' ||
      currentStatus === 'running'
    )
  }

  // Helper function to check if a session has ended, considering midnight-crossing sessions
  const hasSessionEnded = () => {
    const now = new Date()
    const startTime = new Date(classData.start_time)
    const endTime = new Date(classData.end_time)

    // Handle sessions that cross midnight
    if (endTime < startTime) {
      // Session crosses midnight
      // Session has ended if current time is after end time AND current time is after start time
      // This means we're in the next day and past the end time
      return now > endTime && now > startTime
    }

    // Regular same-day session
    return now > endTime
  }

  const handleZoomSession = async () => {
    if (classData.class_link) {
      window.open(classData.class_link, "_blank")
      toast({
        title: "Joining session video call",
        description: "Opening video call link in a new tab",
      })
    } else {
      toast({
        title: "No video call link available",
        description: "Please check the session details",
      })
    }
  }

  const handleInitiateSession = async () => {
    setIsLoading(true)
    try {
      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'initiate'
      })

      if (result.success) {
        onStatusChange("pending")
        toast({
          title: "Session Initiated",
          description: "The session has been initiated and is ready to start",
        })
      } else {
        throw new Error("Failed to initiate session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to initiate session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSession = async () => {
    setIsLoading(true)
    try {
      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'start'
      })

      if (result.success) {
        onStatusChange("running")
        toast({
          title: "Session Started",
          description: "The session has officially started",
        })
      } else {
        throw new Error("Failed to start session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if attendance has been saved for all students and teachers
  // Attendance is considered saved if records exist with a status other than 'expected'
  const isAttendanceSaved = () => {
    if (!existingAttendance) {
      return false
    }

    // Check if all students have attendance records with status other than 'expected'
    const studentIds = new Set(classData.students.map(s => s.student_id))
    const savedStudentAttendance = existingAttendance.studentAttendance.filter(
      a => a.attendance_status !== 'expected'
    )
    const savedStudentIds = new Set(savedStudentAttendance.map(a => a.student_id))
    const allStudentsHaveAttendance = studentIds.size === 0 || Array.from(studentIds).every(id => savedStudentIds.has(id))

    // Check if all teachers have attendance records with status other than 'expected'
    const teacherIds = new Set(classData.teachers.map(t => t.teacher_id))
    const savedTeacherAttendance = existingAttendance.teacherAttendance.filter(
      a => a.attendance_status !== 'expected'
    )
    const savedTeacherIds = new Set(savedTeacherAttendance.map(a => a.teacher_id))
    const allTeachersHaveAttendance = teacherIds.size === 0 || Array.from(teacherIds).every(id => savedTeacherIds.has(id))

    return allStudentsHaveAttendance && allTeachersHaveAttendance
  }

  const handleEndSession = async () => {
    setIsLoading(true)
    try {
      // Get saved attendance data from existingAttendance
      if (!existingAttendance || !isAttendanceSaved()) {
        toast({
          title: "Attendance Required",
          description: "Please save attendance for all students and teachers before ending the session.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      // Build student attendance map from saved data
      const studentAttendance: Record<string, boolean> = {}
      classData.students.forEach(student => {
        const attendanceRecord = existingAttendance.studentAttendance.find(
          a => a.student_id === student.student_id
        )
        // Use saved attendance status, default to false if not found
        studentAttendance[student.student_id] = attendanceRecord?.attendance_status === 'present'
      })

      // Build teacher attendance map from saved data
      const teacherAttendance: Record<string, boolean> = {}
      classData.teachers.forEach(teacher => {
        const attendanceRecord = existingAttendance.teacherAttendance.find(
          a => a.teacher_id === teacher.teacher_id
        )
        // Use saved attendance status, default to false if not found
        teacherAttendance[teacher.teacher_id] = attendanceRecord?.attendance_status === 'present'
      })

      // Update attendance records to ensure they're saved (in case they weren't already)
      await updateSessionAttendance({
        sessionId: classData.session_id,
        studentAttendance,
        teacherAttendance
      })

      // End the session with the saved attendance data
      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'end',
        studentAttendance,
        teacherAttendance
      })

      if (result.success) {
        // Determine the status based on attendance
        const hasPresentStudents = Object.values(studentAttendance).some(isPresent => isPresent)
        const newStatus = hasPresentStudents ? 'complete' : 'absence'

        onStatusChange(newStatus)
        toast({
          title: hasPresentStudents ? "Session Ended" : "Session Marked as Absence",
          description: hasPresentStudents
            ? "The session has been ended successfully."
            : "The session has been marked as absence since no students were present.",
        })
        setShowSessionRemarksDialog(true)
      } else {
        throw new Error("Failed to end session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestReschedule = () => {
    // Show reschedule dialog for teachers, students, and parents
    if (userRole === 'teacher' || userRole === 'student' || userRole === 'parent') {
      setShowRescheduleDialog(true)
    }
  }

  const handleCancelSession = () => {
    // Show cancellation dialog for teachers, students, and parents
    if (userRole === 'teacher' || userRole === 'student' || userRole === 'parent') {
      setShowCancellationDialog(true)
    }
  }

  const handleAdminCancelSession = () => {
    // Show cancellation dialog for admins
    if (userRole === 'admin' || userRole === 'moderator') {
      setShowCancellationDialog(true)
    }
  }

  const handleLeaveSession = async () => {
    // For admins only, proceed with normal cancellation
    await handleRescheduleOrCancellation()
  }

  const handleRescheduleRequest = async (reason: string, rescheduleDate: string) => {
    setIsLoading(true)
    try {
      // Convert local datetime to UTC before storing in database
      const localDate = new Date(rescheduleDate)
      const utcDate = localToUtc(localDate, getUserTimezone())

      const rescheduleResult = await createRescheduleRequest({
        sessionId: classData.session_id,
        requestedBy: userId!,
        requestedDate: utcDate.toISOString(),
        reason: reason,
        timezone: getUserTimezone()
      })

      if (rescheduleResult.success) {
        toast({
          title: "Reschedule Request Submitted",
          description: "Your reschedule request has been sent to administrators for approval. The session remains active until approved.",
        })
        setShowRescheduleDialog(false)
        setCancellationReason("")
        setRescheduleDate("")
      } else {
        throw new Error("Failed to create reschedule request")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSessionSubmit = async (reason: string) => {
    setIsLoading(true)
    try {
      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'leave',
        cancellationReason: reason,
        cancelledBy: userId || undefined
      })

      if (result.success) {
        toast({
          title: "Session Cancelled",
          description: "Session has been cancelled with the provided reason",
        })
        onStatusChange("cancelled")
        setShowCancellationDialog(false)
        setCancellationReason("")
      } else {
        throw new Error("Failed to cancel session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRescheduleOrCancellation = async (reason?: string) => {
    setIsLoading(true)
    try {
      // For admins only, proceed with normal cancellation
      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'leave',
        cancellationReason: reason || undefined,
        cancelledBy: userId || undefined
      })

      if (result.success) {
        toast({
          title: "Session Cancelled",
          description: reason ? "Session has been cancelled with the provided reason" : "You have left and cancelled the session",
        })
        onStatusChange("cancelled")
      } else {
        throw new Error("Failed to leave session")
      }

      setShowCancellationDialog(false)
      setCancellationReason("")
      setRescheduleDate("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rescheduling the session",
        variant: "destructive"
      })
      return
    }

    if (!rescheduleDate.trim()) {
      toast({
        title: "Reschedule Date Required",
        description: "Please select a new desired date for the session",
        variant: "destructive"
      })
      return
    }

    await handleRescheduleRequest(cancellationReason.trim(), rescheduleDate.trim())
  }

  const handleCancellationSubmit = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancelling the session",
        variant: "destructive"
      })
      return
    }

    await handleCancelSessionSubmit(cancellationReason.trim())
  }

  const handleRescheduleSession = () => {
    router.push(`/admin/classes/reschedule/${classData.class_id}/${classData.session_id}`)
  }

  const handleMarkComplete = async (checked: boolean) => {
    if (checked) {
      setIsLoading(true)
      try {
        const result = await updateSession({
          sessionId: classData.session_id,
          action: 'complete'
        })

        if (result.success) {
          setMarkCompleteChecked(true)
          onStatusChange("complete")
          toast({
            title: "Session Marked as Complete",
            description: "The session has been marked as complete",
          })
        } else {
          throw new Error("Failed to mark session as complete")
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to mark session as complete. Please try again.",
          variant: "destructive"
        })
        setMarkCompleteChecked(false)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleResetSession = async () => {
    setIsLoading(true)
    try {
      const result = await resetSession(classData.session_id)

      if (result.success) {
        onStatusChange("scheduled")
        setShowResetDialog(false)
        toast({
          title: "Session Reset",
          description: "The session has been reset to scheduled status. All attendance, reports, and payments have been cleared.",
        })
        // Refresh the page to update attendance data
        router.refresh()
      } else {
        throw new Error(result.error?.message || "Failed to reset session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Button configurations for different states
  const getButtonConfig = () => {
    switch (currentStatus) {
      case "scheduled":
      case "rescheduled":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm ${canJoinClass() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canJoinClass() ? "Join Class" : (hasSessionEnded() ? "Join Class \n(Session has ended)" : "Join Class \n(Available 5 minutes before start time)"),
            disabled: !canJoinClass()
          },
          button2: {
            icon: Power,
            onClick: handleInitiateSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-green-800 ${canInitiateSession() ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50'} hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: canInitiateSession() ? "Initiate Session" : (hasSessionEnded() ? "Initiate Session \n(Session has ended)" : "Initiate Session \n(Available 5 minutes before start time)"),
            disabled: isLoading || !canInitiateSession()
          },
          button3: {
            icon: LogOut,
            onClick: (userRole === 'teacher' || userRole === 'student' || userRole === 'parent') ? handleCancelSession : handleLeaveSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? (userRole === 'teacher' || userRole === 'student' || userRole === 'parent' ? "Cancel Session" : "Cancel Session") : (userRole === 'teacher' || userRole === 'student' || userRole === 'parent' ? "Cancel Session \n(Only available 2 hours before start time)" : "Cancel Session \n(Only available 2 hours before start time)"),
            disabled: isLoading || !canCancelSession()
          },
          button4: {
            icon: CalendarSync,
            onClick: handleRescheduleSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${currentStatus === 'scheduled' || currentStatus === 'rescheduled' ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: currentStatus === 'scheduled' || currentStatus === 'rescheduled' ? "Reschedule Session" : "Reschedule Session (Disabled)",
            disabled: isLoading || (currentStatus !== 'scheduled' && currentStatus !== 'rescheduled')
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button7: {
            icon: LogOut,
            onClick: handleAdminCancelSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canAdminCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canAdminCancelSession() ? "Cancel Session" : "Cancel Session \n(Disabled)",
            disabled: isLoading || !canAdminCancelSession()
          }
        }

      case "pending":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm ${canJoinClass() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canJoinClass() ? "Join Class" : (hasSessionEnded() ? "Join Class \n(Session has ended)" : " Join Class \n(Available 5 minutes before start time)"),
            disabled: !canJoinClass()
          },
          button2: {
            icon: Play,
            onClick: handleStartSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-green-800 bg-green-700 text-white hover:bg-green-800 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "Start Session",
            disabled: isLoading
          },
          button3: {
            icon: LogOut,
            onClick: (userRole === 'teacher' || userRole === 'student' || userRole === 'parent') ? handleCancelSession : handleLeaveSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Cancel Session" : "Cancel Session \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button4: {
            icon: CalendarSync,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Reschedule Class \n(Disabled)",
            disabled: true
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button7: {
            icon: LogOut,
            onClick: handleAdminCancelSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canAdminCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canAdminCancelSession() ? "Cancel Session" : "Cancel Session \n(Disabled)",
            disabled: isLoading || !canAdminCancelSession()
          }
        }

      case "running":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm ${canJoinClass() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canJoinClass() ? "Join Class" : (hasSessionEnded() ? "Join Class \n(Session has ended)" : " Join Class \n(Available 5 minutes before start time)"),
            disabled: !canJoinClass()
          },
          button2: {
            icon: FaRegCircleStop,
            onClick: handleEndSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${isAttendanceSaved() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: isAttendanceSaved() ? "End Session" : "End Session \n(Please save attendance first)",
            disabled: isLoading || !isAttendanceSaved()
          },
          button3: {
            icon: LogOut,
            onClick: (userRole === 'teacher' || userRole === 'student' || userRole === 'parent') ? handleCancelSession : handleLeaveSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Cancel Session" : "Cancel Session \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button4: {
            icon: CalendarSync,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Reschedule Session \n(Disabled)",
            disabled: true
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button7: {
            icon: LogOut,
            onClick: handleAdminCancelSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canAdminCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canAdminCancelSession() ? "Cancel Session" : "Cancel Session \n(Disabled)",
            disabled: isLoading || !canAdminCancelSession()
          }
        }

      case "cancelled":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg ${canJoinClass() ? 'border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canJoinClass() ? "Join Class" : "Join Class \n(Disabled)",
            disabled: !canJoinClass()
          },
          button2: {
            icon: Power,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Initiate Session (Disabled)",
            disabled: true
          },
          button3: {
            icon: LogOut,
            onClick: (userRole === 'teacher' || userRole === 'student' || userRole === 'parent') ? handleCancelSession : handleLeaveSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Cancel Session" : "Cancel Session \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button4: {
            icon: CalendarSync,
            onClick: handleRescheduleSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 bg-white text-gray-700 hover:bg-gray-200 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "Reschedule Session",
            disabled: isLoading
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 bg-white text-gray-700 hover:bg-gray-200 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "Request Reschedule",
            disabled: isLoading
          },
          button7: {
            icon: LogOut,
            onClick: handleAdminCancelSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Cancel Session \n(Disabled)",
            disabled: true
          }
        }

      default: // complete, absence states
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg ${canJoinClass() ? 'border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canJoinClass() ? "Join Class" : "Join Class \n(Disabled)",
            disabled: !canJoinClass()
          },
          button2: {
            icon: Power,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Initiate Session \n(Disabled)",
            disabled: true
          },
          button3: {
            icon: LogOut,
            onClick: (userRole === 'teacher' || userRole === 'student' || userRole === 'parent') ? handleCancelSession : handleLeaveSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Cancel Session" : "Cancel Session \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button4: {
            icon: CalendarSync,
            onClick: handleRescheduleSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${currentStatus === 'absence' ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: currentStatus === 'absence' ? "Reschedule Session" : "Reschedule Session \n(Disabled)",
            disabled: isLoading || currentStatus !== 'absence'
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          },
          button7: {
            icon: LogOut,
            onClick: handleAdminCancelSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Cancel Session \n(Disabled)",
            disabled: true
          }
        }
    }
  }

  const config = getButtonConfig()

  return (
    <div className="inline-flex flex-col items-end">
      <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg border">
        {/* Mark as Complete Checkbox (only for admins and moderators) */}
        {(userRole === 'admin' || userRole === 'moderator') && (
          <div className="flex items-center gap-2 px-2">
            <Checkbox
              id="mark-complete"
              checked={markCompleteChecked}
              onCheckedChange={handleMarkComplete}
              disabled={
                isLoading ||
                currentStatus === 'complete' ||
                currentStatus === 'scheduled' ||
                currentStatus === 'rescheduled'
              }
              className="h-4 w-4"
            />
            <Label
              htmlFor="mark-complete"
              className="text-sm font-medium cursor-pointer"
            >
              Mark as Complete
            </Label>
          </div>
        )}
        {/* Button 1 - Join Class (always shown) */}
        <div className="relative" title={config.button1.title}>
          <Button
            onClick={config.button1.onClick}
            className={config.button1.className}
            disabled={config.button1.disabled}
          >
            <config.button1.icon className="h-4 w-4" />
          </Button>
        </div>

        {/* Show other buttons only if showOnlyJoinCall is false */}
        {!showOnlyJoinCall && (
          <>
            {/* Button 2 */}
            <div className="relative" title={config.button2.title}>
              <Button
                onClick={config.button2.onClick}
                className={config.button2.className}
                disabled={config.button2.disabled}
              >
                <config.button2.icon className="h-4 w-4" />
              </Button>
            </div>

            {/* Button 3 - Cancel (for teachers, students, and parents) */}
            {(userRole === 'teacher' || userRole === 'student' || userRole === 'parent') && (
              <div className="relative" title={config.button3.title}>
                <Button
                  onClick={config.button3.onClick}
                  className={config.button3.className}
                  disabled={config.button3.disabled}
                >
                  <config.button3.icon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Button 6 - Request Reschedule (for teachers, students, and parents) */}
            {(userRole === 'teacher' || userRole === 'student' || userRole === 'parent') && (
              <div className="relative" title={config.button6.title}>
                <Button
                  onClick={config.button6.onClick}
                  className={config.button6.className}
                  disabled={config.button6.disabled}
                >
                  <config.button6.icon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Button 4 - Reschedule (for admins and moderators) */}
            {(userRole === 'admin' || userRole === 'moderator') && (
              <>
                <div className="relative" title={config.button4.title}>
                  <Button
                    onClick={config.button4.onClick}
                    className={config.button4.className}
                    disabled={config.button4.disabled}
                  >
                    <config.button4.icon className="h-4 w-4" />
                  </Button>
                </div>
                {/* Button 7 - Cancel Session (for admins and moderators) */}
                {(userRole === 'admin' || userRole === 'moderator') && (
                  <div className="relative" title={config.button7.title}>
                    <Button
                      onClick={config.button7.onClick}
                      className={config.button7.className}
                      disabled={config.button7.disabled}
                    >
                      <config.button7.icon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Show Cancel and Reschedule buttons for students and parents even when showOnlyJoinCall is true */}
        {showOnlyJoinCall && (userRole === 'student' || userRole === 'parent') && (
          <>
            <div className="relative" title={config.button3.title}>
              <Button
                onClick={config.button3.onClick}
                className={config.button3.className}
                disabled={config.button3.disabled}
              >
                <config.button3.icon className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative" title={config.button6.title}>
              <Button
                onClick={config.button6.onClick}
                className={config.button6.className}
                disabled={config.button6.disabled}
              >
                <config.button6.icon className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Reset Button (only for admins and moderators) - positioned at the very right */}
        {(userRole === 'admin' || userRole === 'moderator') && (
          <div className="relative" title="Reset Session">
            <Button
              onClick={() => setShowResetDialog(true)}
              className={`flex items-center justify-center h-10 w-10 rounded-lg border-2 transition-all duration-200 p-0 ${isLoading || currentStatus === 'scheduled' || currentStatus === 'rescheduled'
                ? 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                : 'border-red-800 bg-red-700 text-white hover:bg-red-800 hover:shadow-md'
                }`}
              disabled={isLoading || currentStatus === 'scheduled' || currentStatus === 'rescheduled'}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Attendance reminder message for running sessions */}
      {currentStatus === 'running' && !isAttendanceSaved() && (
        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-right">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Note:</span> Attendance for all students and teachers <span className="font-bold underline">must</span> be saved before ending the session.
          </p>
        </div>
      )}

      {/* Cancellation Dialog (for teachers, students, parents, admins, and moderators) */}
      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Current session date: {new Date(classData.start_time).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Enter the reason for cancelling this session..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancellationDialog(false)
                setCancellationReason("")
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancellationSubmit}
              disabled={isLoading || !cancellationReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
            >
              {isLoading ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Request Dialog (for teachers, students, and parents) */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Session Reschedule</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Current session date: {new Date(classData.start_time).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-reason">Reschedule Reason *</Label>
              <Textarea
                id="reschedule-reason"
                placeholder="Enter the reason for rescheduling this session..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date *</Label>
              <Input
                id="reschedule-date"
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)} // Prevent selecting past dates
              />
              <p className="text-sm text-muted-foreground">
                Please select a new date and time for this session (in your local timezone)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRescheduleDialog(false)
                setCancellationReason("")
                setRescheduleDate("")
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={isLoading || !cancellationReason.trim() || !rescheduleDate.trim()}
              className="text-white border-green-700 hover:bg-green-700"
              style={{ backgroundColor: "#3d8f5b", color: "white" }}
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Remarks Form Dialog */}
      <Dialog open={showSessionRemarksDialog} onOpenChange={setShowSessionRemarksDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Remarks</DialogTitle>
            <DialogDescription>
              The session has ended. Please provide a summary of the session and individual student notes.
            </DialogDescription>
          </DialogHeader>

          <SessionRemarksForm
            sessionId={classData.session_id}
            students={classData.students}
            onClose={() => setShowSessionRemarksDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Reset Session Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset this session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetSession}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
            >
              {isLoading ? "Resetting..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}