"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parse, isAfter, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"
import { getSessionById } from "@/lib/get/get-classes"
import { rescheduleSession } from "@/lib/put/put-classes"
import { useEffect, useState } from "react"
import { ClassSessionType } from "@/types"
import { combineDateTimeToUtc, utcToLocal, formatDateTime } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"

// Time options and duration constants
type TimeOption = {
  value: string
  label: string
}

const TIME_INCREMENT_MINUTES = 15

const formatTimeLabel = (hours: number, minutes: number) => {
  const period = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 === 0 ? 12 : hours % 12
  const minuteString = minutes.toString().padStart(2, "0")
  return `${displayHour}:${minuteString} ${period}`
}

const TIME_OPTIONS: TimeOption[] = Array.from(
  { length: (24 * 60) / TIME_INCREMENT_MINUTES },
  (_, index) => {
    const totalMinutes = index * TIME_INCREMENT_MINUTES
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const value = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    return {
      value,
      label: formatTimeLabel(hours, minutes),
    }
  }
)

// Duration options in minutes
const DURATION_OPTIONS = [
  { value: "15", label: "15 mins" },
  { value: "30", label: "30 mins" },
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

// Calculate duration in minutes from start and end times
const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const startTotalMinutes = startHour * 60 + startMinute
  let endTotalMinutes = endHour * 60 + endMinute

  // Handle case where end time is next day (e.g., 23:00 to 01:00)
  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60
  }

  return endTotalMinutes - startTotalMinutes
}

// Create a schema for form validation
const formSchema = z
  .object({
    date: z
      .date({
        required_error: "Please select a date",
      })
      .refine(
        (date) => {
          const today = startOfDay(new Date())
          return isAfter(date, today) || date.getTime() === today.getTime()
        },
        {
          message: "Date cannot be in the past",
        },
      ),
    start_time: z
      .string({
        required_error: "Please enter a start time",
      })
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Please enter a valid time in 24-hour format (HH:MM)",
      }),
    duration: z
      .string({
        required_error: "Please select a duration",
      })
      .min(1, { message: "Please select a duration" }),
  })
  .refine(
    (data) => {
      const selectedDate = startOfDay(data.date)
      const today = startOfDay(new Date())

      // If the selected date is today, check if the start time is in the future
      if (selectedDate.getTime() === today.getTime()) {
        const currentTime = new Date()
        const startTime = parse(data.start_time, "HH:mm", currentTime)
        return isAfter(startTime, currentTime)
      }
      return true
    },
    {
      message: "Start time must be in the future for today's date",
      path: ["start_time"],
    },
  )

type FormValues = z.infer<typeof formSchema>

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export default function ReschedulePage() {
  const params = useParams()
  const { classId, sessionId } = params as { classId: string, sessionId: string }
  const router = useRouter()
  const { toast } = useToast()
  const { timezone } = useTimezone()
  const [classData, setClassData] = useState<ClassSessionType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchClassData() {
      try {
        const data = await getSessionById(sessionId)
        if (!data || (data.status !== "scheduled" && data.status !== "rescheduled" && data.status !== "cancelled" && data.status !== "absence")) {
          notFound()
        }
        setClassData(data)
      } catch (error) {
        console.error("Error fetching class data:", error)
        notFound()
      } finally {
        setIsLoading(false)
      }
    }

    fetchClassData()
  }, [sessionId])



  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: classData ? parseLocalDate(formatDateTime(utcToLocal(classData.start_date, timezone), 'yyyy-MM-dd', timezone)) : new Date(),
      start_time: classData ? format(utcToLocal(classData.start_date, timezone), "HH:mm") : "",
      duration: "",
    },
  })

  // Update form values when classData is loaded
  useEffect(() => {
    if (classData) {
      const startDateTime = utcToLocal(classData.start_date, timezone)
      const endDateTime = utcToLocal(classData.end_date, timezone)
      const startTime = format(startDateTime, "HH:mm")
      const endTime = format(endDateTime, "HH:mm")
      const durationMinutes = calculateDuration(startTime, endTime)

      // Find the closest duration option
      const durationOption = DURATION_OPTIONS.find(opt => parseInt(opt.value) === durationMinutes)
        || DURATION_OPTIONS.find(opt => parseInt(opt.value) >= durationMinutes)
        || DURATION_OPTIONS[DURATION_OPTIONS.length - 1]

      form.reset({
        date: parseLocalDate(formatDateTime(startDateTime, 'yyyy-MM-dd', timezone)),
        start_time: startTime,
        duration: durationOption.value,
      })
    }
  }, [classData, form, timezone])

  // Handle form submission
  async function onSubmit(data: FormValues) {
    try {
      // Calculate end time from start time and duration
      const durationMinutes = parseInt(data.duration)
      const endTime = calculateEndTime(data.start_time, durationMinutes)

      // Determine if end time is on the next day (when end time is earlier than or equal to start time)
      const [startHour, startMinute] = data.start_time.split(':').map(Number)
      const [endHour, endMinute] = endTime.split(':').map(Number)
      const startTotalMinutes = startHour * 60 + startMinute
      const endTotalMinutes = endHour * 60 + endMinute
      const isNextDay = endTotalMinutes <= startTotalMinutes

      // Calculate end date - add one day if end time crosses midnight
      const endDate = new Date(data.date)
      if (isNextDay) {
        endDate.setDate(endDate.getDate() + 1)
      }

      // Convert local date and times to UTC before saving
      const startUtc = combineDateTimeToUtc(
        format(data.date, 'yyyy-MM-dd'),
        data.start_time + ':00',
        timezone
      );
      const endUtc = combineDateTimeToUtc(
        format(endDate, 'yyyy-MM-dd'),
        endTime + ':00',
        timezone
      );

      const result = await rescheduleSession({
        sessionId: sessionId,
        newStartDate: startUtc.toISOString(),
        newEndDate: endUtc.toISOString(),
      })

      if (!result.success) {
        throw new Error('Failed to reschedule class')
      }

      // Show success toast
      toast({
        title: "Class rescheduled",
        description: `The class has been rescheduled to ${formatDateTime(data.date, "MMMM d, yyyy", timezone)} at ${data.start_time}`,
      })

      // Redirect back to class details page
      setTimeout(() => {
        router.push(`/admin/classes/${classId}`)
      }, 1500)
    } catch {
      toast({
        title: "Error",
        description: "Failed to reschedule class. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!classData) {
    return notFound()
  }

  const startDateTime = utcToLocal(classData.start_date, timezone)
  const endDateTime = utcToLocal(classData.end_date, timezone)
  const formattedDate = formatDateTime(startDateTime, "MMMM d, yyyy", timezone)
  const formattedStartTime = format(startDateTime, "h:mm a")
  const formattedEndTime = format(endDateTime, "h:mm a")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/classes/${classId}/${sessionId}`} label="Back to Class Details" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reschedule Session</CardTitle>
          <CardDescription>{classData.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted/50 rounded-md">
            <h3 className="font-medium mb-2">Current Schedule</h3>
            <p className="text-sm">Date: {formattedDate}</p>
            <p className="text-sm">
              Time: {formattedStartTime} - {formattedEndTime}
            </p>
            <p className="text-sm">
              Teacher: {classData.teachers[0]?.first_name} {classData.teachers[0]?.last_name}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      New Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const today = startOfDay(new Date())
                            return date < today
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Select the new date for this class</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-9 text-sm border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20">
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => {
                    const startValue = form.watch("start_time")
                    return (
                      <FormItem>
                        <FormLabel>
                          Duration <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!startValue}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20 disabled:opacity-80">
                              <SelectValue placeholder={startValue ? "Select duration" : "Pick start time first"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {DURATION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              {/* Display calculated end time */}
              {(() => {
                const startTime = form.watch("start_time")
                const duration = form.watch("duration")
                if (startTime && duration) {
                  const endTime = calculateEndTime(startTime, parseInt(duration))
                  const [endHour, endMinute] = endTime.split(':').map(Number)
                  const endTimeLabel = formatTimeLabel(endHour, endMinute)
                  return (
                    <div className="text-sm text-gray-600">
                      End time: <span className="font-medium text-gray-900">{endTimeLabel}</span>
                    </div>
                  )
                }
                return null
              })()}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" asChild>
                  <Link href={`/admin/classes/${classId}/${sessionId}`}>Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  style={{
                    backgroundColor: "#3d8f5b",
                    color: "white",
                  }}
                >
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
