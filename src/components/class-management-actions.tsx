"use client"

import { Button } from "@/components/ui/button"
import { Video, PlayCircle, Play, StopCircle, Calendar, LogOut, UserX } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { updateClassSession, updateClassSessionAttendance } from "@/lib/put/put-classes"

type ClassManagementActionsProps = {
  classData: {
    session_id: string
    title: string
    description: string
    subject: string
    start_time: string
    end_time: string
    status: string
    class_link: string | null
    teacher: {
      teacher_id: string
      first_name: string
      last_name: string
    }
    enrolled_students: {
      student_id: string
      first_name: string
      last_name: string
    }[]
    attendance?: Record<string, boolean>
  }
  currentStatus: string
  onStatusChange: (status: string) => void
}

export function ClassManagementActions({ classData, currentStatus, onStatusChange }: ClassManagementActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleZoomCall = () => {
    if (classData.class_link) {
      window.open(classData.class_link, "_blank")
      toast({
        title: "Joining class video call",
        description: "Opening video call link in a new tab",
      })
    } else {
      toast({
        title: "No video call link available",
        description: "Please check the class details",
      })
    }
  }

  const handleInitiateClass = async () => {
    setIsLoading(true)
    try {
      const result = await updateClassSession({
        sessionId: classData.session_id,
        action: 'initiate'
      })

      if (result.success) {
        onStatusChange("pending")
        toast({
          title: "Class Initiated",
          description: "The class has been initiated and is ready to start",
        })
      } else {
        throw new Error("Failed to initiate class")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate class. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartClass = async () => {
    setIsLoading(true)
    try {
      const result = await updateClassSession({
        sessionId: classData.session_id,
        action: 'start'
      })

      if (result.success) {
        onStatusChange("running")
        toast({
          title: "Class Started",
          description: "The class has officially started",
        })
      } else {
        throw new Error("Failed to start class")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start class. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndClass = async () => {
    setIsLoading(true)
    try {
      const result = await updateClassSession({
        sessionId: classData.session_id,
        action: 'end'
      })

      if (result.success) {
        onStatusChange("complete")
        toast({
          title: "Class Ended",
          description: "The class has been ended",
        })
      } else {
        throw new Error("Failed to end class")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end class. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveClass = async () => {
    setIsLoading(true)
    try {
      const result = await updateClassSession({
        sessionId: classData.session_id,
        action: 'leave'
      })

      if (result.success) {
        onStatusChange("cancelled")
        toast({
          title: "Class Cancelled",
          description: "You have left and cancelled the class session",
        })
      } else {
        throw new Error("Failed to leave class")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave class. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAbsence = async () => {
    setIsLoading(true)
    try {
      // First mark all students as absent
      const allAbsent: Record<string, boolean> = {}
      classData.enrolled_students.forEach(student => {
        allAbsent[student.student_id] = false
      })

      const attendanceResult = await updateClassSessionAttendance({
        sessionId: classData.session_id,
        attendance: allAbsent
      })

      if (!attendanceResult.success) {
        throw new Error("Failed to update attendance records")
      }

      // Then mark the class as absence
      const result = await updateClassSession({
        sessionId: classData.session_id,
        action: 'absence'
      })

      if (result.success) {
        onStatusChange("absence")
        toast({
          title: "Class Marked as Absence",
          description: "The class has been marked as absence and all students have been marked as absent",
        })
      } else {
        throw new Error("Failed to mark absence")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark absence. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRescheduleClass = () => {
    router.push(`/admin/schedule/reschedule/${classData.session_id}`)
  }

  // Check if rescheduling is allowed (only in "scheduled" status)
  const canReschedule = currentStatus === "scheduled"

  // Check if leaving is allowed (only in "scheduled" status - before initiation)
  const canLeave = currentStatus === "scheduled"

  // Check if absence button should be shown (after initiation but before ending)
  const showAbsence = currentStatus === "running"

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Class Management</h3>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Button
          onClick={handleZoomCall}
          className="flex items-center gap-2 border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600"
        >
          <Video className="h-4 w-4" />
          <span>Join Call</span>
        </Button>

        {currentStatus === "scheduled" ? (
          <Button
            onClick={handleInitiateClass}
            className="flex items-center gap-2 bg-green-700 text-white hover:bg-green-800"
            variant="default"
            disabled={isLoading}
          >
            <PlayCircle className="h-4 w-4" />
            <span>Initiate</span>
          </Button>
        ) : (
          <Button
            className="flex items-center gap-2 opacity-50 cursor-not-allowed"
            variant="outline"
            disabled
          >
            <PlayCircle className="h-4 w-4" />
            <span>Initiated</span>
          </Button>
        )}

        {currentStatus === "pending" ? (
          <Button
            onClick={handleStartClass}
            className="flex items-center gap-2 bg-green-700 text-white hover:bg-green-800"
            variant="default"
            disabled={isLoading}
          >
            <Play className="h-4 w-4" />
            <span>Start Class</span>
          </Button>
        ) : currentStatus === "running" ? (
          <Button
            onClick={handleEndClass}
            className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-700"
            variant="destructive"
            disabled={isLoading}
          >
            <StopCircle className="h-4 w-4" />
            <span>End Class</span>
          </Button>
        ) : (
          <Button className="flex items-center gap-2 opacity-50 cursor-not-allowed" variant="outline" disabled>
            {currentStatus === "complete" ? (
              <>
                <StopCircle className="h-4 w-4" />
                <span>Ended</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start Class</span>
              </>
            )}
          </Button>
        )}

        {canLeave ? (
          <Button
            onClick={handleLeaveClass}
            className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-700"
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4" />
            <span>Leave</span>
          </Button>
        ) : showAbsence ? (
          <Button
            onClick={handleAbsence}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            disabled={isLoading}
          >
            <UserX className="h-4 w-4" />
            <span>Absence</span>
          </Button>
        ) : (
          <Button className="flex items-center gap-2 opacity-50 cursor-not-allowed" variant="outline" disabled>
            <UserX className="h-4 w-4" />
            <span>Absence</span>
            {currentStatus === "in_progress" && <span className="sr-only">(Disabled: Class in progress)</span>}
          </Button>
        )}

        {canReschedule ? (
          <Button
            onClick={handleRescheduleClass}
            className="flex items-center gap-2"
            variant="outline"
            disabled={isLoading}
          >
            <Calendar className="h-4 w-4" />
            <span>Reschedule</span>
          </Button>
        ) : (
          <Button className="flex items-center gap-2 opacity-50 cursor-not-allowed" variant="outline" disabled>
            <Calendar className="h-4 w-4" />
            <span>Reschedule</span>
            <span className="sr-only">(Disabled: Class already initiated)</span>
          </Button>
        )}
      </div>

      {!canReschedule && currentStatus !== "in_progress" && currentStatus !== "ended_early" && (
        <p className="text-xs text-muted-foreground mt-1">Note: Rescheduling is not available after class initiation</p>
      )}
    </div>
  )
}
