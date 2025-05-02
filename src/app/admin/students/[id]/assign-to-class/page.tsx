"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BackButton } from "@/components/back-button"

// Define the form schema with validation
const formSchema = z.object({
  classIds: z.array(z.string()).min(1, { message: "Please select at least one class" }),
})

// Mock data for students - in a real app, this would come from your database
const students = [
  {
    id: "S001",
    first_name: "Emma",
    last_name: "Smith",
    grade_level: "10th",
    age: 16,
    parent: "John Smith",
    email: "emma.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Physics", "English"],
    created_at: "2021-09-01T00:00:00",
  },
  {
    id: "S002",
    first_name: "Noah",
    last_name: "Smith",
    grade_level: "8th",
    age: 14,
    parent: "John Smith",
    email: "noah.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Biology", "History"],
    created_at: "2021-09-01T00:00:00",
  },
  // Other students...
]

// Mock data for active classes
const activeClasses = [
  {
    id: "C001",
    title: "Mathematics 101",
    subject: "Mathematics",
    teacher: {
      id: "T001",
      first_name: "Sarah",
      last_name: "Johnson",
    },
    schedule: "Mon, Wed, Fri 10:00 - 11:30",
    start_date: "2023-09-01",
    end_date: "2023-12-15",
    max_students: 15,
    enrolled_students: 12,
    status: "active",
  },
  {
    id: "C002",
    title: "Physics Fundamentals",
    subject: "Physics",
    teacher: {
      id: "T002",
      first_name: "Michael",
      last_name: "Chen",
    },
    schedule: "Tue, Thu 13:00 - 14:30",
    start_date: "2023-09-02",
    end_date: "2023-12-16",
    max_students: 12,
    enrolled_students: 8,
    status: "active",
  },
  {
    id: "C003",
    title: "English Literature",
    subject: "English",
    teacher: {
      id: "T003",
      first_name: "Emily",
      last_name: "Davis",
    },
    schedule: "Mon, Wed 14:30 - 16:00",
    start_date: "2023-09-01",
    end_date: "2023-12-15",
    max_students: 20,
    enrolled_students: 15,
    status: "active",
  },
  {
    id: "C004",
    title: "Chemistry Basics",
    subject: "Chemistry",
    teacher: {
      id: "T004",
      first_name: "Robert",
      last_name: "Wilson",
    },
    schedule: "Tue, Thu 09:00 - 10:30",
    start_date: "2023-09-02",
    end_date: "2023-12-16",
    max_students: 15,
    enrolled_students: 10,
    status: "active",
  },
  {
    id: "C005",
    title: "Biology 101",
    subject: "Biology",
    teacher: {
      id: "T005",
      first_name: "Jennifer",
      last_name: "Lee",
    },
    schedule: "Mon, Wed, Fri 08:00 - 09:30",
    start_date: "2023-09-01",
    end_date: "2023-12-15",
    max_students: 18,
    enrolled_students: 14,
    status: "active",
  },
  {
    id: "C006",
    title: "World History",
    subject: "History",
    teacher: {
      id: "T006",
      first_name: "David",
      last_name: "Brown",
    },
    schedule: "Tue, Thu 11:00 - 12:30",
    start_date: "2023-09-02",
    end_date: "2023-12-16",
    max_students: 25,
    enrolled_students: 18,
    status: "active",
  },
  {
    id: "C007",
    title: "Computer Science",
    subject: "Computer Science",
    teacher: {
      id: "T002",
      first_name: "Michael",
      last_name: "Chen",
    },
    schedule: "Mon, Wed 16:00 - 17:30",
    start_date: "2023-09-01",
    end_date: "2023-12-15",
    max_students: 15,
    enrolled_students: 10,
    status: "active",
  },
]

export default function AssignToClassPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Find the student by ID
  const student = students.find((s) => s.id === params.id)

  // Filter classes based on search query
  const filteredClasses = activeClasses.filter(
    (cls) =>
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${cls.teacher.first_name} ${cls.teacher.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classIds: [],
    },
  })

  if (!student) {
    // Handle case where student is not found
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
        <p className="text-muted-foreground mb-6">The student you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/admin/students">Return to Students List</Link>
        </Button>
      </div>
    )
  }

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // In a real application, this would send data to your backend
      console.log({
        studentId: student.id,
        classIds: values.classIds,
      })

      // Get the class names for the toast message
      const selectedClasses = activeClasses.filter((cls) => values.classIds.includes(cls.id))
      const classNames = selectedClasses.map((cls) => cls.title).join(", ")

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      toast({
        title: "Student assigned to classes successfully",
        description: `${student.first_name} ${student.last_name} has been assigned to: ${classNames}`,
      })

      // Navigate back to the student's page
      router.push(`/admin/students/${student.id}`)
    } catch (error) {
      console.error("Error assigning student to classes:", error)
      toast({
        title: "Error",
        description: "There was a problem assigning the student to classes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/students/${params.id}`} label="Back to Student" />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            Assign {student.first_name} {student.last_name} to Classes
          </CardTitle>
          <CardDescription>Select one or more classes to assign this student to.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="assign-to-class-form" className="space-y-6">
              <div className="relative mb-6">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search classes by title, subject, or teacher..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <FormField
                control={form.control}
                name="classIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Available Classes</FormLabel>
                      <FormDescription>
                        Select the classes you want to assign to {student.first_name} {student.last_name}
                      </FormDescription>
                    </div>
                    <div className="space-y-4">
                      {filteredClasses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No classes found matching your search criteria
                        </div>
                      ) : (
                        filteredClasses.map((cls) => (
                          <FormField
                            key={cls.id}
                            control={form.control}
                            name="classIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={cls.id}
                                  className={cn(
                                    "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4",
                                    field.value?.includes(cls.id) ? "border-primary" : "border-input",
                                  )}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(cls.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, cls.id])
                                          : field.onChange(field.value?.filter((value) => value !== cls.id))
                                      }}
                                    />
                                  </FormControl>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium leading-none">{cls.title}</p>
                                        <p className="text-sm text-muted-foreground">{cls.subject}</p>
                                      </div>
                                      <Badge variant="outline" className="ml-2">
                                        {cls.enrolled_students}/{cls.max_students} students
                                      </Badge>
                                    </div>
                                    <div className="flex items-center mt-2">
                                      <Avatar className="h-6 w-6 mr-2">
                                        <AvatarFallback className="text-xs">
                                          {cls.teacher.first_name[0]}
                                          {cls.teacher.last_name[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <p className="text-sm">
                                        {cls.teacher.first_name} {cls.teacher.last_name}
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <div>{cls.schedule}</div>
                                      <div className="hidden sm:block">•</div>
                                      <div>
                                        {format(new Date(cls.start_date), "MMM d, yyyy")} -{" "}
                                        {format(new Date(cls.end_date), "MMM d, yyyy")}
                                      </div>
                                    </div>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/admin/students/${student.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" form="assign-to-class-form" disabled={isSubmitting || filteredClasses.length === 0}>
            {isSubmitting ? "Assigning..." : "Assign to Selected Classes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
