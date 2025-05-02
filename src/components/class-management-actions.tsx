"use client"

import { Button } from "@/components/ui/button"
import { Video, PlayCircle, Play, StopCircle, Calendar } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type ClassManagementActionsProps = {
  classData: {
    id: number
    title: string
    class_link: string
    status: string
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

  const handleRescheduleClass = () => {
    // Redirect to the reschedule page
    router.push(`/admin/schedule/${classData.id}/reschedule`)
  }

  // Check if rescheduling is allowed (only in "scheduled" status)
  const canReschedule = classStatus === "scheduled"

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
        >
          <PlayCircle className="h-4 w-4" />
          <span>Initiate</span>
        </Button>

        <Button
          onClick={handleStartClass}
          className={cn(
            "flex items-center gap-2 transition-colors duration-300",
            classStatus === "initiating" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "",
          )}
          variant={classStatus === "initiating" ? "default" : "outline"}
          disabled={classStatus !== "initiating"}
        >
          <Play className="h-4 w-4" />
          <span>Start Class</span>
        </Button>

        <Button
          onClick={handleEndClassEarly}
          className="flex items-center gap-2"
          variant="destructive"
          disabled={classStatus !== "in_progress"}
        >
          <StopCircle className="h-4 w-4" />
          <span>End Class</span>
        </Button>

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
