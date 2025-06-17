"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { format, parse, isAfter, startOfDay } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"
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
import { useEffect, useState } from "react"
import { ClassSessionType } from "@/types"
import { updateClassSession } from "@/lib/put/put-classes"

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
      const startTime = parse(data.start_time, "HH:mm", new Date())
      const endTime = parse(data.end_time, "HH:mm", new Date())
      return isAfter(endTime, startTime)
    },
    {
      message: "End time must be after start time",
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
  const { id } = params as { id: string }
  const router = useRouter()
  const { toast } = useToast()
  const [classData, setClassData] = useState<ClassSessionType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchClassData() {
      try {
        const data = await getSessionById(id)
        if (!data || data.status !== "scheduled") {
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
  }, [id])

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: classData ? parseLocalDate(classData.date) : new Date(),
      start_time: classData ? format(new Date(`${classData.date}T${classData.start_time}`), "HH:mm") : "",
      end_time: classData ? format(new Date(`${classData.date}T${classData.end_time}`), "HH:mm") : "",
    },
  })

  // Update form values when classData is loaded
  useEffect(() => {
    if (classData) {
      const newDate = new Date(classData.date)
      const startTime = new Date(`${classData.date}T${classData.start_time}`)
      const endTime = new Date(`${classData.date}T${classData.end_time}`)

      form.reset({
        date: parseLocalDate(classData.date),
        start_time: format(startTime, "HH:mm"),
        end_time: format(endTime, "HH:mm"),
      })
    }
  }, [classData, form])

  // Handle form submission
  async function onSubmit(data: FormValues) {
    try {
      const result = await updateClassSession({
        sessionId: id,
        action: 'reschedule',
        newDate: format(data.date, "yyyy-MM-dd"),
        newStartTime: data.start_time,
        newEndTime: data.end_time,
      })

      if (!result.success) {
        throw new Error('Failed to reschedule class')
      }

      // Show success toast
      toast({
        title: "Class rescheduled",
        description: `The class has been rescheduled to ${format(data.date, "MMMM d, yyyy")} at ${data.start_time}`,
      })

      // Redirect back to class details page
      setTimeout(() => {
        router.push(`/admin/schedule/${id}`)
      }, 1500)
    } catch (error) {
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

  const [year, month, day] = classData.date.split("-");
  const localDate = new Date(Number(year), Number(month) - 1, Number(day));
  const formattedDate = format(localDate, "MMMM d, yyyy");
  const formattedStartTime = format(new Date(`${classData.date}T${classData.start_time}`), "HH:mm")
  const formattedEndTime = format(new Date(`${classData.date}T${classData.end_time}`), "HH:mm")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/schedule/${id}`} label="Back to Class Details" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reschedule Class</CardTitle>
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
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="HH:MM" {...field} type="time" />
                        </FormControl>
                      </div>
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
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="HH:MM" {...field} type="time" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" asChild>
                  <Link href={`/admin/schedule/${id}`}>Cancel</Link>
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
