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
import { useRouter } from "next/navigation"
import { notFound } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"

// Mock data based on the database schema
const classes = [
  {
    id: 1,
    teacher_id: 1,
    title: "Mathematics 101",
    description:
      "Introduction to algebra and geometry. This course covers fundamental concepts in algebra including equations, inequalities, and functions, as well as basic geometric principles such as points, lines, angles, and polygons. Students will learn problem-solving techniques and develop critical thinking skills through mathematical reasoning.",
    subject: "Mathematics",
    start_time: "2023-04-17T08:00:00",
    end_time: "2023-04-17T09:30:00",
    status: "scheduled",
    max_students: 15,
    class_link: "https://meet.google.com/abc-defg-hij",
    teacher: { id: 1, first_name: "Sarah", last_name: "Johnson" },
    enrolled_students: [
      { id: 1, first_name: "John", last_name: "Doe" },
      { id: 2, first_name: "Jane", last_name: "Smith" },
      { id: 3, first_name: "Alex", last_name: "Johnson" },
    ],
  },
  {
    id: 2,
    teacher_id: 2,
    title: "Physics Fundamentals",
    description:
      "Basic principles of physics including mechanics, energy, and motion. Students will explore Newton's laws, conservation of energy, and simple machines. The course includes both theoretical concepts and practical applications through demonstrations and problem-solving exercises.",
    subject: "Physics",
    start_time: "2023-04-17T11:00:00",
    end_time: "2023-04-17T12:30:00",
    status: "scheduled",
    max_students: 12,
    class_link: "https://meet.google.com/jkl-mnop-qrs",
    teacher: { id: 2, first_name: "Michael", last_name: "Chen" },
    enrolled_students: [
      { id: 4, first_name: "Emily", last_name: "Wilson" },
      { id: 5, first_name: "David", last_name: "Brown" },
      { id: 6, first_name: "Sophia", last_name: "Garcia" },
      { id: 7, first_name: "James", last_name: "Miller" },
    ],
  },
  {
    id: 3,
    teacher_id: 3,
    title: "English Literature",
    description:
      "Analysis of classic literature from various periods and genres. Students will read and discuss works by Shakespeare, Austen, Dickens, and other influential authors. The course focuses on literary analysis, critical thinking, and effective written and verbal communication.",
    subject: "English",
    start_time: "2023-04-17T14:30:00",
    end_time: "2023-04-17T16:00:00",
    status: "scheduled",
    max_students: 20,
    class_link: "https://meet.google.com/tuv-wxyz-123",
    teacher: { id: 3, first_name: "Emily", last_name: "Davis" },
    enrolled_students: [
      { id: 8, first_name: "Olivia", last_name: "Martinez" },
      { id: 9, first_name: "Ethan", last_name: "Taylor" },
      { id: 10, first_name: "Ava", last_name: "Anderson" },
    ],
  },
]

// Create a schema for form validation
const formSchema = z
  .object({
    date: z
      .date({
        required_error: "Please select a date",
      })
      .refine(
        (date) => {
          return isAfter(date, startOfDay(new Date()))
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
    reason: z
      .string({
        required_error: "Please provide a reason for rescheduling",
      })
      .min(5, {
        message: "Reason must be at least 5 characters",
      }),
    notify_participants: z.boolean().default(true),
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

type FormValues = z.infer<typeof formSchema>

export default function ReschedulePage({ params }: { params: { id: string } }) {
  const classId = Number.parseInt(params.id)
  const router = useRouter()
  const { toast } = useToast()

  // Find the class with the matching ID
  const classData = classes.find((c) => c.id === classId)

  // If class not found or not in scheduled status, show 404 page
  if (!classData || classData.status !== "scheduled") {
    notFound()
  }

  const formattedDate = format(new Date(classData.start_time), "MMMM d, yyyy")
  const formattedStartTime = format(new Date(classData.start_time), "HH:mm")
  const formattedEndTime = format(new Date(classData.end_time), "HH:mm")

  // Get current date and times for default values
  const currentDate = new Date(classData.start_time)
  const currentStartTime = format(new Date(classData.start_time), "HH:mm")
  const currentEndTime = format(new Date(classData.end_time), "HH:mm")

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: currentDate,
      start_time: currentStartTime,
      end_time: currentEndTime,
      reason: "",
      notify_participants: true,
    },
  })

  // Handle form submission
  function onSubmit(data: FormValues) {
    // In a real app, this would send data to an API
    console.log("Form submitted:", data)

    // Show success toast
    toast({
      title: "Class rescheduled",
      description: `The class has been rescheduled to ${format(data.date, "MMMM d, yyyy")} at ${data.start_time}`,
    })

    // Redirect back to class details page
    setTimeout(() => {
      router.push(`/admin/schedule/${classId}`)
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/schedule/${classId}`} label="Back to Class Details" />
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
              Teacher: {classData.teacher.first_name} {classData.teacher.last_name}
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
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Reason for Rescheduling <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for rescheduling this class"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This information will be included in notifications to participants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notify_participants"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input type="checkbox" className="h-4 w-4 mt-1" checked={field.value} onChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Notify Participants</FormLabel>
                      <FormDescription>
                        Send notifications to all students and the teacher about this schedule change
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" asChild>
                  <Link href={`/admin/schedule/${classId}`}>Cancel</Link>
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
