"use client"

import { Button } from "@/components/ui/button"
import { Video, Power, Play, CircleOff, Calendar, LogOut, UserX } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { updateClassSession, updateClassSessionAttendance } from "@/lib/put/put-classes"

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
  showOnlyJoinCall?: boolean
}

export function ClassActionButtons({ classData, currentStatus, onStatusChange, showOnlyJoinCall = false }: ClassActionButtonsProps) {
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
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

  const handleRescheduleClass = () => {
    router.push(`/admin/classes/reschedule/${classData.class_id}/${classData.session_id}`)
  }

  // Button configurations for different states
  const getButtonConfig = () => {
    switch (currentStatus) {
      case "scheduled":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomCall,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md transition-all duration-200 p-0",
            title: "Join Video Call",
            disabled: false
          },
          button2: {
            icon: Power,
            onClick: handleInitiateClass,
            className: `flex items-center justify-center h-10 w-10 rounded-lg bg-green-700 text-white hover:bg-green-800 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "Initiate Class",
            disabled: isLoading
          },
          button3: {
            icon: LogOut,
            onClick: handleLeaveClass,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-red-500 text-white hover:bg-red-700 hover:shadow-md transition-all duration-200 p-0",
            title: "Leave/Cancel Class",
            disabled: isLoading
          },
          button4: {
            icon: Calendar,
            onClick: handleRescheduleClass,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 p-0",
            title: "Reschedule Class",
            disabled: isLoading
          }
        }

      case "pending":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomCall,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md transition-all duration-200 p-0",
            title: "Join Video Call",
            disabled: false
          },
          button2: {
            icon: Play,
            onClick: handleStartClass,
            className: `flex items-center justify-center h-10 w-10 rounded-lg bg-green-700 text-white hover:bg-green-800 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "Start Class",
            disabled: isLoading
          },
          button3: {
            icon: UserX,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg opacity-50 cursor-not-allowed p-0",
            title: "Mark as Absence (Disabled)",
            disabled: true
          },
          button4: {
            icon: Calendar,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg opacity-50 cursor-not-allowed p-0",
            title: "Reschedule Class (Disabled)",
            disabled: true
          }
        }

      case "running":
        return {
          button1: {
            icon: Video,
            onClick: handleZoomCall,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md transition-all duration-200 p-0",
            title: "Join Video Call",
            disabled: false
          },
          button2: {
            icon: CircleOff,
            onClick: handleEndClass,
            className: `flex items-center justify-center h-10 w-10 rounded-lg bg-red-600 text-white hover:bg-red-700 hover:shadow-md transition-all duration-200 p-0 ${isLoading ? 'opacity-70' : ''}`,
            title: "End Class",
            disabled: isLoading
          },
          button3: {
            icon: UserX,
            onClick: handleAbsence,
            className: "flex items-center justify-center h-10 w-10 rounded-lg bg-amber-600 hover:bg-amber-700 text-white hover:shadow-md transition-all duration-200 p-0",
            title: "Mark as Absence",
            disabled: isLoading
          },
          button4: {
            icon: Calendar,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg opacity-50 cursor-not-allowed p-0",
            title: "Reschedule Class (Disabled)",
            disabled: true
          }
        }

      default: // complete, absence, cancelled states
        return {
          button1: {
            icon: Video,
            onClick: handleZoomCall,
            className: "flex items-center justify-center h-10 w-10 rounded-lg border-2 border-blue-600 shadow-sm bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md transition-all duration-200 p-0",
            title: "Join Video Call",
            disabled: false
          },
          button2: {
            icon: Play,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg opacity-50 cursor-not-allowed p-0",
            title: "Start Class (Disabled)",
            disabled: true
          },
          button3: {
            icon: UserX,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg opacity-50 cursor-not-allowed p-0",
            title: "Mark as Absence (Disabled)",
            disabled: true
          },
          button4: {
            icon: Calendar,
            onClick: () => { },
            className: "flex items-center justify-center h-10 w-10 rounded-lg opacity-50 cursor-not-allowed p-0",
            title: "Reschedule Class (Disabled)",
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
        <Button
          onClick={config.button1.onClick}
          className={config.button1.className}
          disabled={config.button1.disabled}
          title={config.button1.title}
        >
          <config.button1.icon className="h-4 w-4" />
        </Button>

        {/* Show other buttons only if showOnlyJoinCall is false */}
        {!showOnlyJoinCall && (
          <>
            {/* Button 2 */}
            <Button
              onClick={config.button2.onClick}
              className={config.button2.className}
              disabled={config.button2.disabled}
              title={config.button2.title}
            >
              <config.button2.icon className="h-4 w-4" />
            </Button>

            {/* Button 3 */}
            <Button
              onClick={config.button3.onClick}
              className={config.button3.className}
              disabled={config.button3.disabled}
              title={config.button3.title}
            >
              <config.button3.icon className="h-4 w-4" />
            </Button>

            {/* Button 4 */}
            <Button
              onClick={config.button4.onClick}
              className={config.button4.className}
              disabled={config.button4.disabled}
              title={config.button4.title}
            >
              <config.button4.icon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
