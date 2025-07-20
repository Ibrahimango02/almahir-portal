"use client"

import { Button } from "@/components/ui/button"
import { Video, Power, Play, CircleOff, Calendar, LogOut, UserX, Trash2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { updateSession, updateSessionAttendance } from "@/lib/put/put-classes"
import { updateTeacherAttendance } from "@/lib/put/put-teachers"
import { updateStudentAttendance } from "@/lib/put/put-students"
import { deleteSession } from "@/lib/delete/delete-classes"
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
  const [cancellationReason, setCancellationReason] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check if initiate button should be enabled (within 5 minutes of start time and before end time)
  const canInitiateSession = () => {
    const now = new Date()
    const startTime = new Date(classData.start_time)
    const endTime = new Date(classData.end_time)
    const fiveMinutesBefore = new Date(startTime.getTime() - 5 * 60 * 1000) // 5 minutes before start time

    return now >= fiveMinutesBefore && now <= endTime
  }

  // Check if cancel button should be enabled (only if current date is less than start date)
  const canCancelSession = () => {
    const now = new Date()
    const startTime = new Date(classData.start_time)

    // Compare only the date part (year, month, day) by setting time to midnight
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate())

    return nowDate < startDate
  }

  const handleZoomSession = async () => {
    if (classData.class_link) {
      // Update attendance if user role and ID are provided
      if (userRole && userId) {
        try {
          if (userRole === 'admin' || userRole === 'teacher') {
            await updateTeacherAttendance(userId, classData.session_id, 'present')
          } else if (userRole === 'student') {
            await updateStudentAttendance(userId, classData.session_id, 'present')
          }
        } catch (error) {
          console.error('Error updating attendance:', error)
          // Don't block the call joining if attendance update fails
        }
      }

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
      // Mark all students as absent
      const allStudentsAbsent: Record<string, boolean> = {}
      classData.students.forEach(student => {
        allStudentsAbsent[student.student_id] = false
      })

      // Mark all teachers as absent
      const allTeachersAbsent: Record<string, boolean> = {}
      classData.teachers.forEach(teacher => {
        allTeachersAbsent[teacher.teacher_id] = false
      })

      const attendanceResult = await updateSessionAttendance({
        sessionId: classData.session_id,
        studentAttendance: allStudentsAbsent,
        teacherAttendance: allTeachersAbsent
      })

      if (!attendanceResult.success) {
        throw new Error("Failed to update attendance records")
      }

      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'end'
      })

      if (result.success) {
        onStatusChange("complete")
        toast({
          title: "Session Ended",
          description: "The session has been ended",
        })
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

  const handleLeaveSession = async () => {
    // If user is a teacher, show cancellation dialog
    if (userRole === 'teacher') {
      setShowCancellationDialog(true)
      return
    }

    // For non-teachers, proceed with normal cancellation
    await performCancellation()
  }

  const performCancellation = async (reason?: string) => {
    setIsLoading(true)
    try {
      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'leave',
        cancellationReason: reason,
        cancelledBy: userId
      })

      if (result.success) {
        onStatusChange("cancelled")
        toast({
          title: "Session Cancelled",
          description: reason ? "Session has been cancelled with the provided reason" : "You have left and cancelled the session session",
        })
        setShowCancellationDialog(false)
        setCancellationReason("")
      } else {
        throw new Error("Failed to leave session")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to leave session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
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

    await performCancellation(cancellationReason.trim())
  }

  const handleAbsence = async () => {
    setIsLoading(true)
    try {
      // First mark all students as absent
      const allStudentsAbsent: Record<string, boolean> = {}
      classData.students.forEach(student => {
        allStudentsAbsent[student.student_id] = false
      })

      // Mark all teachers as absent
      const allTeachersAbsent: Record<string, boolean> = {}
      classData.teachers.forEach(teacher => {
        allTeachersAbsent[teacher.teacher_id] = false
      })

      const attendanceResult = await updateSessionAttendance({
        sessionId: classData.session_id,
        studentAttendance: allStudentsAbsent,
        teacherAttendance: allTeachersAbsent
      })

      if (!attendanceResult.success) {
        throw new Error("Failed to update attendance records")
      }

      // Then mark the class as absence
      const result = await updateSession({
        sessionId: classData.session_id,
        action: 'absence'
      })

      if (result.success) {
        onStatusChange("absence")
        toast({
          title: "Session Marked as Absence",
          description: "The session has been marked as absence and all students and teachers have been marked as absent",
        })
      } else {
        throw new Error("Failed to mark absence")
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark absence. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async () => {
    setIsLoading(true)
    try {
      const result = await deleteSession(classData.session_id)
      if (result.success) {
        toast({
          title: "Session Deleted",
          description: "The session has been permanently deleted.",
        })
        setShowDeleteDialog(false)
        // Optionally, you can call onStatusChange or redirect here
        onStatusChange("deleted")
      } else {
        throw new Error(result.error || "Failed to delete session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRescheduleSession = () => {
    router.push(`/admin/classes/reschedule/${classData.class_id}/${classData.session_id}`)
  }

  // Button configurations for different states
  const getButtonConfig = () => {
    switch (currentStatus) {
      case "scheduled":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md transition-all duration-200 p-0",
            title: "Join Video Call",
            disabled: false
          },
          button2: {
            icon: Power,
            onClick: handleInitiateSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-green-800 ${canInitiateSession() ? 'bg-green-700 text-white hover:bg-green-800' : 'bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50'} hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: canInitiateSession() ? "Initiate Session" : (new Date() > new Date(classData.end_time) ? "(Session has ended)" : "(Available 5 minutes before start time)"),
            disabled: isLoading || !canInitiateSession()
          },
          button3: {
            icon: LogOut,
            onClick: handleLeaveSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 ${canCancelSession() ? 'border-red-700 bg-red-600 text-white hover:bg-red-700' : 'border-gray-400 bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'} hover:shadow-md transition-all duration-200 p-0`,
            title: canCancelSession() ? "Leave/Cancel Session" : "(Session date has passed)",
            disabled: isLoading || !canCancelSession()
          },
          button4: {
            icon: Calendar,
            onClick: handleRescheduleSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 bg-white text-gray-700 hover:bg-gray-200 hover:shadow-md transition-all duration-200 p-0",
            title: "Reschedule Session",
            disabled: isLoading
          }
        }

      case "pending":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md transition-all duration-200 p-0",
            title: "Join Video Call",
            disabled: false
          },
          button2: {
            icon: Play,
            onClick: handleStartSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-green-800 bg-green-700 text-white hover:bg-green-800 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "Start Session",
            disabled: isLoading
          },
          button3: {
            icon: UserX,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Mark as Absence (Disabled)",
            disabled: true
          },
          button4: {
            icon: Calendar,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Reschedule Class (Disabled)",
            disabled: true
          }
        }

      case "running":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md transition-all duration-200 p-0",
            title: "Join Video Call",
            disabled: false
          },
          button2: {
            icon: CircleOff,
            onClick: handleEndSession,
            className: `flex items-center justify-center h-10 w-10 rounded-lg border-2 border-red-700 bg-red-600 text-white hover:bg-red-700 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "End Session",
            disabled: isLoading
          },
          button3: {
            icon: UserX,
            onClick: handleAbsence,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-amber-700 bg-amber-600 hover:bg-amber-700 text-white hover:shadow-md transition-all duration-200 p-0",
            title: "Mark as Absence",
            disabled: isLoading
          },
          button4: {
            icon: Calendar,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Reschedule Session (Disabled)",
            disabled: true
          }
        }

      case "cancelled":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Join Video Call (Disabled)",
            disabled: true
          },
          button2: {
            icon: Play,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Start Session (Disabled)",
            disabled: true
          },
          button3: {
            icon: UserX,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Mark as Absence (Disabled)",
            disabled: true
          },
          button4: {
            icon: Calendar,
            onClick: handleRescheduleSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-400 bg-white text-gray-700 hover:bg-gray-200 hover:shadow-md transition-all duration-200 p-0",
            title: "Reschedule Session",
            disabled: isLoading
          }
        }

      default: // complete, absence states
        return {
          button1: {
            icon: Video,
            onClick: handleZoomSession,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Join Video Call (Disabled)",
            disabled: true
          },
          button2: {
            icon: Play,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Start Session (Disabled)",
            disabled: true
          },
          button3: {
            icon: UserX,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Mark as Absence (Disabled)",
            disabled: true
          },
          button4: {
            icon: Calendar,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-400 opacity-50",
            title: "Reschedule Session (Disabled)",
            disabled: true
          }
        }
    }
  }

  const config = getButtonConfig()

  return (
    <div>
      <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg border">
        {/* Button 1 - Join Call (always shown) */}
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

            {/* Button 3 */}
            <div className="relative" title={config.button3.title}>
              <Button
                onClick={config.button3.onClick}
                className={config.button3.className}
                disabled={config.button3.disabled}
              >
                <config.button3.icon className="h-4 w-4" />
              </Button>
            </div>

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
                {/* <div className="relative" title="Delete Session">
                  <Button
                    size="icon"
                    className="h-10 w-10 bg-red-700 hover:bg-red-800 text-white border-red-600 hover:border-red-600"
                    aria-label="Delete session"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div> */}
              </>
            )}
          </>
        )}
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Session</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this session. This information will be visible to administrators.
            </DialogDescription>
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

      {/* Delete Session Confirmation Dialog */}
      {/* <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone and will permanently remove the session and all associated data including attendance and remarks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSession}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
            >
              {isLoading ? (
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
      </Dialog> */}
    </div>
  )
}
