"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CalendarIcon } from "lucide-react"
import { createSession } from "@/lib/post/post-classes"
import { format, startOfDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type TimeOption = {
  value: string
  label: string
}

const formatTimeLabel = (hours: number, minutes: number) => {
  const period = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 === 0 ? 12 : hours % 12
  const minuteString = minutes.toString().padStart(2, "0")
  return `${displayHour}:${minuteString} ${period}`
}

// Generate time options with :00, :15, :20, :30, :40, :45 for each hour
const TIME_OPTIONS: TimeOption[] = []
const minuteOptions = [0, 15, 20, 30, 40, 45]

for (let hour = 0; hour < 24; hour++) {
  for (const minute of minuteOptions) {
    const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    TIME_OPTIONS.push({
      value,
      label: formatTimeLabel(hour, minute),
    })
  }
}

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: "15", label: "15 mins" },
  { value: "30", label: "30 mins" },
  { value: "40", label: "40 mins" },
  { value: "45", label: "45 mins" },
  { value: "60", label: "1 hr" },
  { value: "90", label: "1.5 hrs" },
  { value: "120", label: "2 hrs" },
  { value: "150", label: "2.5 hrs" },
  { value: "180", label: "3 hrs" },
  { value: "240", label: "4 hrs" },
]

// Calculate end time from start time and duration (in minutes)
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = startTotalMinutes + durationMinutes

  // Handle overflow past midnight
  const endHour = Math.floor((endTotalMinutes % (24 * 60)) / 60)
  const endMinute = (endTotalMinutes % (24 * 60)) % 60

  return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
}

interface AddSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  classTimezone: string
  onSessionCreated?: () => void
}

export function AddSessionDialog({
  open,
  onOpenChange,
  classId,
  classTimezone,
  onSessionCreated
}: AddSessionDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string>("")
  const [duration, setDuration] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasTouch =
        "ontouchstart" in window ||
        (navigator.maxTouchPoints ?? 0) > 0 ||
        ("msMaxTouchPoints" in navigator &&
          (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints !== undefined &&
          (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints! > 0)
      setIsTouchDevice(hasTouch)
    }
  }, [])

  const endTime = startTime && duration ? calculateEndTime(startTime, parseInt(duration)) : ""
  const endTimeLabel = endTime ? (() => {
    const [endHour, endMinute] = endTime.split(':').map(Number)
    return formatTimeLabel(endHour, endMinute)
  })() : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !startTime || !duration) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (!endTime) {
      toast({
        title: "Validation Error",
        description: "Please select a valid duration",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createSession({
        classId,
        date,
        startTime,
        endTime,
        classTimezone,
      })

      if (result.success) {
        toast({
          title: "Session created successfully",
          description: "The session has been added to the class.",
        })

        // Reset form
        setDate(undefined)
        setStartTime("")
        setDuration("")

        // Close dialog
        onOpenChange(false)

        // Callback to refresh sessions list
        if (onSessionCreated) {
          onSessionCreated()
        }
      } else {
        throw new Error(result.error?.message || "Failed to create session")
      }
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Session</DialogTitle>
          <DialogDescription>
            Create a new session for this class. Select the date and time for the session.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            {isTouchDevice ? (
              <Input
                id="date"
                type="date"
                value={date ? format(date, "yyyy-MM-dd") : ""}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) {
                    setDate(undefined)
                    return
                  }
                  // Create a Date at local midnight for the selected day
                  const [year, month, day] = value.split("-").map(Number)
                  setDate(new Date(year, (month || 1) - 1, day || 1))
                }}
                className="w-full border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
              />
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-200 hover:border-[#3d8f5b] focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => startOfDay(date) < startOfDay(new Date())}
                    initialFocus
                    classNames={{
                      day_selected: "bg-[#3d8f5b] text-white hover:bg-[#2d7a4b] hover:text-white focus:bg-[#3d8f5b] focus:text-white",
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Select
                value={duration}
                onValueChange={setDuration}
                disabled={!startTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder={startTime ? "Select duration" : "Pick start time first"} />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {endTimeLabel && (
            <div className="text-sm text-muted-foreground">
              End time: <span className="font-medium">{endTimeLabel}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-white border-[#3d8f5b] hover:border-[#3d8f5b] hover:bg-[#2d7a4b] disabled:opacity-50"
              style={{ backgroundColor: "#3d8f5b" }}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

