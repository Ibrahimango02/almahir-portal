"use client"

import { Button } from "@/components/ui/button"
import { Video, Power, Play, CalendarSync, LogOut, Trash2 } from "lucide-react"
import { FaRegCircleStop } from "react-icons/fa6";
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { updateSession } from "@/lib/put/put-classes"
import { deleteSession } from "@/lib/delete/delete-classes"
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
  userRole?: 'admin' | 'teacher' | 'student' | 'parent'
  userId?: string
}

export function ClassActionButtons({ classData, currentStatus, onStatusChange, showOnlyJoinCall = false, userRole, userId }: ClassActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSessionRemarksDialog, setShowSessionRemarksDialog] = useState(false)
  const { toast } = useToast()
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

  // Check if cancel button should be enabled (only if current time is 2 hours before start time and status is scheduled)
  const canCancelSession = () => {
    // Only allow cancellation if status is 'scheduled'
    if (currentStatus !== 'scheduled') {
      return false
    }

    const now = new Date()
    const startTime = new Date(classData.start_time)
    const twoHoursBefore = new Date(startTime.getTime() - 2 * 60 * 60 * 1000) // 2 hours before start time

    return now <= twoHoursBefore
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

  const handleEndSession = async () => {
    setIsLoading(true)
    try {
      // Get current attendance data from classData
      const studentAttendance = classData.attendance || {}

      // If no attendance data exists, assume students are present (default behavior)
      // This prevents automatically marking all sessions as absence
      if (Object.keys(studentAttendance).length === 0) {
        // No attendance data available, assume students are present
        // Teachers would typically mark attendance before ending a session
        classData.students.forEach(student => {
          studentAttendance[student.student_id] = true // Assume present by default
        })
      }

      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'end',
        studentAttendance
      })

      if (result.success) {
        // Determine the status based on attendance
        const hasPresentStudents = Object.values(studentAttendance).some(isPresent => isPresent)
        const newStatus = hasPresentStudents ? 'complete' : 'absence'

        onStatusChange(newStatus)
        toast({
          title: hasPresentStudents ? "Session Ended" : "Session Marked as Absence",
          description: hasPresentStudents
            ? "The session has been ended. Please ensure attendance has been recorded before the session is marked as complete."
            : "The session has been marked as absence since no students were present.",
        })
        setShowSessionRemarksDialog(true)
      } else {
        throw new Error("Failed to end session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
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

  const handleDeleteSession = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteSession(classData.session_id)
      if (result.success) {
        toast({
          title: "Session Deleted",
          description: "The session has been deleted successfully.",
        })
        setShowDeleteDialog(false)
        // Redirect to class page
        router.push(`/admin/classes/${classData.class_id}`)
      } else {
        throw new Error(result.error || "Failed to delete session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete session",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRescheduleSession = () => {
    router.push(`/admin/classes/reschedule/${classData.class_id}/${classData.session_id}`)
  }

  // Button configurations for different states
  const getButtonConfig = () => {
    const deleteButton = {
      icon: Trash2,
      onClick: () => setShowDeleteDialog(true),
      className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-red-500 bg-white text-red-600 hover:bg-red-100 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
      title: currentStatus === 'scheduled' ? "Delete Session" : "Delete Session (Disabled)",
      disabled: isLoading || currentStatus !== 'scheduled',
    }
    switch (currentStatus) {
      case "scheduled":
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
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${currentStatus === 'scheduled' ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: currentStatus === 'scheduled' ? "Reschedule Session" : "Reschedule Session (Disabled)",
            disabled: isLoading || currentStatus !== 'scheduled'
          },
          button5: {
            ...deleteButton,
            disabled: isLoading || currentStatus !== 'scheduled',
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-red-500 ${currentStatus === 'scheduled' ? 'bg-white text-red-600 hover:bg-red-100' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
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
          button5: {
            ...deleteButton,
            disabled: true,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50"
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
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
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-red-700 bg-red-600 text-white hover:bg-red-700 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "End Session",
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
            title: "Reschedule Session \n(Disabled)",
            disabled: true
          },
          button5: {
            ...deleteButton,
            disabled: true,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50"
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
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
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50",
            title: "Reschedule Session (Disabled)",
            disabled: true
          },
          button5: {
            ...deleteButton,
            disabled: true,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50"
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
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
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Reschedule Session \n(Disabled)",
            disabled: true
          },
          button5: {
            ...deleteButton,
            disabled: true,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50"
          },
          button6: {
            icon: CalendarSync,
            onClick: handleRequestReschedule,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 ${canCancelSession() ? 'bg-white text-gray-700 hover:bg-gray-200' : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Request Reschedule" : "Request Reschedule \n(Only available 2 hours before start time)",
            disabled: isLoading || !canCancelSession()
          }
        }
    }
  }

  const config = getButtonConfig()

  return (
    <div>
      <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg border">
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

            {/* Button 4 - Reschedule (only for admins) */}
            {userRole === 'admin' && (
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
                {/* Button 5 - Delete Session (only for admins) */}
                <div className="relative" title={config.button5.title}>
                  <Button
                    onClick={config.button5.onClick}
                    className={config.button5.className}
                    disabled={config.button5.disabled}
                  >
                    <config.button5.icon className="h-4 w-4" />
                  </Button>
                </div>
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
      </div>

      {/* Cancellation Dialog (for teachers, students, and parents) */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone and will permanently remove the session and its records from the database.
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
              onClick={handleDeleteSession}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </>
              )}
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
    </div>
  )
}