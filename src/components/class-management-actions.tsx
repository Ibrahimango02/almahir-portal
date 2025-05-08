"use client"

import { Button } from "@/components/ui/button"
import { Video, PlayCircle, Play, StopCircle, Calendar, LogOut, UserX } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { updateClassSession } from "@/lib/put/put-classes"

type ClassManagementActionsProps = {
  classData: {
    session_id: string
    title: string
    description: string
    subject: string
    start_time: string
    end_time: string
    status: string
    class_link: string
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
}

export function ClassManagementActions({ classData }: ClassManagementActionsProps) {
  const [classStatus, setClassStatus] = useState(classData.status)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Reload the page when classStatus changes
    router.refresh()
  }, [classStatus, router])

  const handleZoomCall = () => {
    window.open(classData.class_link, "_blank")
    toast({
      title: "Joining class video call",
      description: "Opening video call link in a new tab",
    })
  }

  const handleInitiateClass = async () => {
    setIsLoading(true)
    try {
      const result = await updateClassSession({
        sessionId: classData.session_id,
        action: 'initiate'
      })

      if (result.success) {
        setClassStatus("pending")
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
        setClassStatus("running")
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
        setClassStatus("complete")
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
        setClassStatus("cancelled")
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
      const result = await updateClassSession({
        sessionId: classData.session_id,
        action: 'absence'
      })

      if (result.success) {
        setClassStatus("absence")
        toast({
          title: "Class Marked as Absence",
          description: "The class has been marked as absence and ended",
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
    setClassStatus("rescheduled")
    router.push(`/admin/schedule/reschedule/${classData.session_id}`)
  }

  // Check if rescheduling is allowed (only in "scheduled" status)
  const canReschedule = classStatus === "scheduled"

  // Check if leaving is allowed (only in "scheduled" status - before initiation)
  const canLeave = classStatus === "scheduled"

  // Check if absence button should be shown (after initiation but before ending)
  const showAbsence = classStatus === "running"

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Class Management</h3>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Button
          onClick={handleZoomCall}
          className="flex items-center gap-2 border-2 border-blue-600 shadow-sm"
          style={{ backgroundColor: "#3b82f6", color: "white" }}
        >
          <Video className="h-4 w-4" />
          <span>Join Call</span>
        </Button>

        <Button
          onClick={handleInitiateClass}
          className={cn(
            "flex items-center gap-2 transition-colors duration-300",
            classStatus === "scheduled" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "",
          )}
          variant={classStatus === "scheduled" ? "default" : "outline"}
          disabled={classStatus !== "scheduled" || isLoading}
          style={classStatus === "scheduled" ? { backgroundColor: "#3d8f5b", color: "white" } : {}}
        >
          <PlayCircle className="h-4 w-4" />
          <span>{classStatus === "scheduled" ? "Initiate" : "Initiated"}</span>
        </Button>

        {classStatus === "pending" ? (
          <Button
            onClick={handleStartClass}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            variant="default"
            disabled={isLoading}
            style={{ backgroundColor: "#3d8f5b", color: "white" }}
          >
            <Play className="h-4 w-4" />
            <span>Start Class</span>
          </Button>
        ) : classStatus === "running" ? (
          <Button
            onClick={handleEndClass}
            className="flex items-center gap-2"
            variant="destructive"
            disabled={isLoading}
            style={{ backgroundColor: "#d14747", color: "white" }}
          >
            <StopCircle className="h-4 w-4" />
            <span>End Class</span>
          </Button>
        ) : (
          <Button className="flex items-center gap-2 opacity-50 cursor-not-allowed" variant="outline" disabled>
            {classStatus === "complete" ? (
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
            className="flex items-center gap-2 hover:bg-red-700 text-white"
            disabled={isLoading}
            style={{ backgroundColor: "#d14747", color: "white" }}
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
            {classStatus === "in_progress" && <span className="sr-only">(Disabled: Class in progress)</span>}
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

      {!canReschedule && classStatus !== "in_progress" && classStatus !== "ended_early" && (
        <p className="text-xs text-muted-foreground mt-1">Note: Rescheduling is not available after class initiation</p>
      )}

    </div>
  )
}
