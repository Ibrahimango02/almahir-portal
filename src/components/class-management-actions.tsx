"use client"

import { Button } from "@/components/ui/button"
import { Video, PlayCircle, Play, StopCircle, Calendar, LogOut, UserX } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
  const { toast } = useToast()
  const router = useRouter()

  const handleZoomCall = () => {
    // In a real app, this would open the Zoom call in a new tab
    window.open(classData.class_link, "_blank")
    toast({
      title: "Joining class video call",
      description: "Opening video call link in a new tab",
    })
  }

  const handleInitiateClass = () => {
    setClassStatus("initiating")
    toast({
      title: "Class Initiated",
      description: "The class has been initiated and is ready to start",
    })
  }

  const handleStartClass = () => {
    setClassStatus("in_progress")
    toast({
      title: "Class Started",
      description: "The class has officially started",
    })
  }

  const handleEndClassEarly = () => {
    setClassStatus("ended_early")
    toast({
      title: "Class Ended Early",
      description: "The class has been ended early",
    })
  }

  const handleLeaveClass = () => {
    // Only available before initiation (when status is "scheduled")
    setClassStatus("ended_early")
    toast({
      title: "Class Cancelled",
      description: "You have left and cancelled the class session",
    })
  }

  const handleAbsence = () => {
    // Available after initiation (when status is "initiating" or "in_progress")
    setClassStatus("ended_early")
    toast({
      title: "Class Marked as Absence",
      description: "The class has been marked as absence and ended",
    })
  }

  const handleRescheduleClass = () => {
    // Redirect to the reschedule page
    router.push(`/admin/schedule/${classData.session_id}/reschedule`)
  }

  // Check if rescheduling is allowed (only in "scheduled" status)
  const canReschedule = classStatus === "scheduled"

  // Check if leaving is allowed (only in "scheduled" status - before initiation)
  const canLeave = classStatus === "scheduled"

  // Check if absence button should be shown (after initiation but before ending)
  // Modified to only allow absence in "initiating" state, not in "in_progress" state
  const showAbsence = classStatus === "initiating"

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
          disabled={classStatus !== "scheduled"}
          style={classStatus === "scheduled" ? { backgroundColor: "#3d8f5b", color: "white" } : {}}
        >
          <PlayCircle className="h-4 w-4" />
          <span>{classStatus === "scheduled" ? "Initiate" : "Initiated"}</span>
        </Button>

        {classStatus === "initiating" ? (
          <Button
            onClick={handleStartClass}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            variant="default"
            style={{ backgroundColor: "#3d8f5b", color: "white" }}
          >
            <Play className="h-4 w-4" />
            <span>Start Class</span>
          </Button>
        ) : classStatus === "in_progress" ? (
          <Button
            onClick={handleEndClassEarly}
            className="flex items-center gap-2"
            variant="destructive"
            style={{ backgroundColor: "#d14747", color: "white" }}
          >
            <StopCircle className="h-4 w-4" />
            <span>End Class</span>
          </Button>
        ) : (
          <Button className="flex items-center gap-2 opacity-50 cursor-not-allowed" variant="outline" disabled>
            {classStatus === "ended_early" ? (
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

        {/* Conditionally show Leave or Absence button based on class status */}
        {canLeave ? (
          <Button
            onClick={handleLeaveClass}
            className="flex items-center gap-2 hover:bg-red-700 text-white"
            style={{ backgroundColor: "#d14747", color: "white" }}
          >
            <LogOut className="h-4 w-4" />
            <span>Leave</span>
          </Button>
        ) : showAbsence ? (
          <Button
            onClick={handleAbsence}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
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
          <Button onClick={handleRescheduleClass} className="flex items-center gap-2" variant="outline">
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
