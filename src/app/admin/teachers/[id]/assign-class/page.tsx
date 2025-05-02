"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { BackButton } from "@/components/back-button"

// Update the form schema to include end date and days of week
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  subject: z.string().min(1, { message: "Please select a subject" }),
  startDate: z.date({ required_error: "Please select a start date" }),
  endDate: z.date({ required_error: "Please select an end date" }),
  daysOfWeek: z.array(z.string()).min(1, { message: "Please select at least one day" }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time (HH:MM)" }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time (HH:MM)" }),
  maxStudents: z.coerce.number().int().min(1, { message: "At least 1 student is required" }).max(50),
  classLink: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
})

// Add days of the week array
const daysOfWeek = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
]

// Define the subjects available for selection
const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Art",
  "Music",
  "Physical Education",
  "Spanish",
  "French",
  "Economics",
  "Psychology",
]

// Mock data for teachers - in a real app, this would come from your database
const teachers = [
  {
    id: "T001",
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.johnson@almahir.edu",
    subjects: ["Mathematics"],
  },
  {
    id: "T002",
    first_name: "Michael",
    last_name: "Chen",
    email: "michael.chen@almahir.edu",
    subjects: ["Physics", "Computer Science"],
  },
  {
    id: "T003",
    first_name: "Emily",
    last_name: "Davis",
    email: "emily.davis@almahir.edu",
    subjects: ["English", "Art"],
  },
  {
    id: "T004",
    first_name: "Robert",
    last_name: "Wilson",
    email: "robert.wilson@almahir.edu",
    subjects: ["Chemistry"],
  },
  {
    id: "T005",
    first_name: "Jennifer",
    last_name: "Lee",
    email: "jennifer.lee@almahir.edu",
    subjects: ["Biology", "Music"],
  },
  {
    id: "T006",
    first_name: "David",
    last_name: "Brown",
    email: "david.brown@almahir.edu",
    subjects: ["History", "Physical Education"],
  },
  {
    id: "T007",
    first_name: "Maria",
    last_name: "Rodriguez",
    email: "maria.rodriguez@almahir.edu",
    subjects: ["Spanish"],
  },
]

export default function AssignClassPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Find the teacher by ID
  const teacher = teachers.find((t) => t.id === params.id)

  // Update the form initialization with new default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      startDate: undefined,
      endDate: undefined,
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      maxStudents: 15,
      classLink: "",
    },
  })

  if (!teacher) {
    // Handle case where teacher is not found
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Teacher Not Found</h2>
        <p className="text-muted-foreground mb-6">The teacher you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/admin/teachers">Return to Teachers List</Link>
        </Button>
      </div>
    )
  }

  // Update the onSubmit function to include the new fields
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // In a real application, this would send data to your backend
      console.log({
        ...values,
        teacherId: teacher.id,
        // Combine date and time for start and end times
        startTime: new Date(`${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}`),
        endTime: new Date(`${format(values.startDate, "yyyy-MM-dd")}T${values.endTime}`),
        // Include the recurring schedule information
        recurrence: {
          startDate: values.startDate,
          endDate: values.endDate,
          daysOfWeek: values.daysOfWeek,
        },
      })

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      toast({
        title: "Class assigned successfully",
        description: `${values.title} has been assigned to ${teacher.first_name} ${teacher.last_name}`,
      })

      // Navigate back to the teacher's page
      router.push(`/teachers/${teacher.id}`)
    } catch (error) {
      console.error("Error assigning class:", error)
      toast({
        title: "Error",
        description: "There was a problem assigning the class. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/teachers/${params.id}`} label="Back to Teacher" />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            Assign Class to {teacher.first_name} {teacher.last_name}
          </CardTitle>
          <CardDescription>Fill in the details below to assign a new class to this teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="assign-class-form" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mathematics 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the class content and objectives"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
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
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
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
                              const startDate = form.getValues("startDate")
                              return date < new Date() || (startDate && date < startDate)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-3">
                  <FormField
                    control={form.control}
                    name="daysOfWeek"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Days of Week</FormLabel>
                          <FormDescription>Select the days when this class will occur</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {daysOfWeek.map((day) => (
                            <FormField
                              key={day.id}
                              control={form.control}
                              name="daysOfWeek"
                              render={({ field }) => {
                                return (
                                  <FormItem key={day.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(day.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, day.id])
                                            : field.onChange(field.value?.filter((value) => value !== day.id))
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">{day.label}</FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM (24h)" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Format: 14:30</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input placeholder="HH:MM (24h)" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Format: 16:00</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Students</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={50} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Link (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://meet.google.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/admin/teachers/${teacher.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" form="assign-class-form" disabled={isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign Class"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
