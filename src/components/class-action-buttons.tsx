"use client"

import { Button } from "@/components/ui/button"
import { Video, PlayCircle, Play, StopCircle, Calendar, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type ClassActionButtonsProps = {
  classData: {
    id: string
    title: string
    class_link?: string
    status: string
  }
  compact?: boolean
}

export function ClassActionButtons({ classData, compact = false }: ClassActionButtonsProps) {
  const [classStatus, setClassStatus] = useState(classData.status)
  const { toast } = useToast()
  const router = useRouter()

  console.log("classData ID --------------------", classData.id)

  const handleZoomCall = () => {
    if (!classData.class_link) {
      toast({
        title: "No class link available",
        description: "This class does not have a video call link",
        variant: "destructive",
      })
      return
    }

    window.open(classData.class_link, "_blank")
    toast({
      title: "Joining class video call",
      description: `Opening video call for ${classData.title}`,
    })
  }

  const handleInitiateClass = () => {
    setClassStatus("initiating")
    toast({
      title: "Class Initiated",
      description: `${classData.title} has been initiated and is ready to start`,
    })
  }

  const handleStartClass = () => {
    setClassStatus("in_progress")
    toast({
      title: "Class Started",
      description: `${classData.title} has officially started`,
    })
  }

  const handleEndClassEarly = () => {
    setClassStatus("ended_early")
    toast({
      title: "Class Ended",
      description: `${classData.title} has been ended`,
    })
  }

  const handleRescheduleClass = () => {
    router.push(`/admin/schedule/${classData.id}/reschedule`)
  }

  const handleViewDetails = () => {
    router.push(`/admin/schedule/${classData.id}`)
  }

  // Check if rescheduling is allowed (only in "scheduled" status)
  const canReschedule = classStatus === "scheduled"

  // For compact mode, show only the most relevant action based on status
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {classStatus === "scheduled" && (
          <Button onClick={handleInitiateClass} size="sm" className="flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5" />
            <span>Initiate</span>
          </Button>
        )}

        {classStatus === "initiating" && (
          <Button onClick={handleStartClass} size="sm" className="flex items-center gap-1">
            <Play className="h-3.5 w-3.5" />
            <span>Start</span>
          </Button>
        )}

        {classStatus === "in_progress" && (
          <Button onClick={handleEndClassEarly} size="sm" variant="destructive" className="flex items-center gap-1">
            <StopCircle className="h-3.5 w-3.5" />
            <span>End</span>
          </Button>
        )}

        {classData.class_link && (
          <Button
            onClick={handleZoomCall}
            size="sm"
            className="flex items-center gap-1 border-blue-600"
            style={{ backgroundColor: "#3b82f6", color: "white" }}
          >
            <Video className="h-3.5 w-3.5" />
            <span>Join</span>
          </Button>
        )}

        <Button onClick={handleViewDetails} size="sm" variant="outline" className="flex items-center gap-1">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Details</span>
        </Button>
      </div>
    )
  }

  // Full mode with all buttons
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        <Button
          onClick={handleZoomCall}
          className="flex items-center gap-2 border-2 border-blue-600 shadow-sm"
          style={{ backgroundColor: "#3b82f6", color: "white" }}
          disabled={!classData.class_link}
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
    </div>
  )
}
