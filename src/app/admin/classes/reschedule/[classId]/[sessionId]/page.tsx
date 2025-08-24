"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"
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
    end_time: z
      .string({
        required_error: "Please enter an end time",
      })
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: "Please enter a valid time in 24-hour format (HH:MM)",
      }),
  })
  .refine(
    (data) => {
      // Convert times to minutes for comparison
      const [startHour, startMinute] = data.start_time.split(':').map(Number)
      const [endHour, endMinute] = data.end_time.split(':').map(Number)

      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute

      // If end time is earlier in the day than start time, it means the class runs past midnight
      // This is valid (e.g., 11:00 PM to 12:00 AM)
      if (endMinutes <= startMinutes) {
        // Only allow this if the end time is 12:00 AM (00:00)
        return endMinutes === 0
      }

      return true
    },
    {
      message: "End time must be after start time, unless the class runs past midnight (ending at 12:00 AM)",
      path: ["end_time"],
    },
  )
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
        if (!data || (data.status !== "scheduled" && data.status !== "cancelled")) {
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
      end_time: classData ? format(utcToLocal(classData.end_date, timezone), "HH:mm") : "",
    },
  })

  // Update form values when classData is loaded
  useEffect(() => {
    if (classData) {
      const startDateTime = utcToLocal(classData.start_date, timezone)
      const endDateTime = utcToLocal(classData.end_date, timezone)

      form.reset({
        date: parseLocalDate(formatDateTime(startDateTime, 'yyyy-MM-dd', timezone)),
        start_time: format(startDateTime, "HH:mm"),
        end_time: format(endDateTime, "HH:mm"),
      })
    }
  }, [classData, form, timezone])

  // Handle form submission
  async function onSubmit(data: FormValues) {
    try {
      // Convert local date and times to UTC before saving
      const startUtc = combineDateTimeToUtc(
        format(data.date, 'yyyy-MM-dd'),
        data.start_time + ':00',
        timezone
      );
      const endUtc = combineDateTimeToUtc(
        format(data.date, 'yyyy-MM-dd'),
        data.end_time + ':00',
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
  const formattedStartTime = format(startDateTime, "HH:mm")
  const formattedEndTime = format(endDateTime, "HH:mm")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/classes/${classId}/${sessionId}`} label="Back to Class Details" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reschedule Session</CardTitle>
          <CardDescription>Update the schedule for {classData.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted/50 rounded-md">
            <h3 className="font-medium mb-2">Current Schedule</h3>
            <p className="text-sm">Date: {formattedDate}</p>
            <p className="text-sm">
              Time: {formattedStartTime} - {formattedEndTime} (24-hour format)
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
                      <TimePicker
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select start time"
                        className="h-9 text-sm border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <TimePicker
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select end time"
                        className="h-9 text-sm border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
