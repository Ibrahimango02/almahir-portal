"use client"

import { useState, useEffect } from "react"
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
import { createClient } from "@/utils/supabase/client"
import { StudentType, ClassType } from "@/types"
import { getActiveClasses, getClassStudentCount } from "@/lib/get-classes"


// Define the form schema with validation
const formSchema = z.object({
  classIds: z.array(z.string()).min(1, { message: "Please select at least one class" }),
})


export default function AssignToClassPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [student, setStudent] = useState<StudentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})

  // Fetch student data and classes on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = await createClient()

        // Get the student's profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, phone, status, created_at')
          .eq('id', id)
          .eq('role', 'student')
          .single()

        const { data: studentData } = await supabase
          .from('students')
          .select('profile_id, birth_date, grade_level, notes')
          .eq('profile_id', id)
          .single()

        if (profile) {
          setStudent({
            student_id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            age: studentData?.birth_date ? calculateAge(studentData.birth_date) : 0,
            grade_level: studentData?.grade_level || "",
            notes: studentData?.notes || "",
            status: profile.status,
            created_at: profile.created_at
          })
        }

        // Fetch active classes
        const activeClasses = await getActiveClasses()
        setClasses(activeClasses)

        // Fetch student counts for each class
        const counts: Record<string, number> = {}
        for (const cls of activeClasses) {
          counts[cls.class_id] = await getClassStudentCount(cls.class_id) || 0
        }
        setStudentCounts(counts)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Calculate age helper function
  function calculateAge(birthDate: string) {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Filter classes based on search query
  const filteredClasses = classes.filter(
    (cls) =>
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${cls.teachers[0]?.first_name} ${cls.teachers[0]?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classIds: [],
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading student information...</p>
      </div>
    )
  }

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
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // In a real application, this would send data to your backend
      console.log({
        studentId: student?.student_id,
        classIds: values.classIds,
      })

      // Get the class names for the toast message
      const selectedClasses = classes.filter((cls) => values.classIds.includes(cls.class_id))
      const classNames = selectedClasses.map((cls) => cls.title).join(", ")

      // Simulate API call
      setTimeout(() => {
        // Show success message
        toast({
          title: "Student assigned to classes successfully",
          description: `${student?.first_name} ${student?.last_name} has been assigned to: ${classNames}`,
        })

        // Navigate back to the student's page
        router.push(`/admin/students/${student?.student_id}`)
        setIsSubmitting(false)
      }, 1000)
    } catch (error) {
      console.error("Error assigning student to classes:", error)
      toast({
        title: "Error",
        description: "There was a problem assigning the student to classes. Please try again.",
        variant: "destructive",
      })
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
                            key={cls.class_id}
                            control={form.control}
                            name="classIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={cls.class_id}
                                  className={cn(
                                    "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4",
                                    field.value?.includes(cls.class_id) ? "border-primary" : "border-input",
                                  )}
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(cls.class_id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, cls.class_id])
                                          : field.onChange(field.value?.filter((value) => value !== cls.class_id))
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
                                        {studentCounts[cls.class_id] || 0} students
                                      </Badge>
                                    </div>
                                    <div className="flex items-center mt-2">
                                      <Avatar className="h-6 w-6 mr-2">
                                        <AvatarFallback className="text-xs">
                                          {cls.teachers[0]?.first_name?.[0] || "?"}
                                          {cls.teachers[0]?.last_name?.[0] || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <p className="text-sm">
                                        {cls.teachers[0]?.first_name || "Unknown"} {cls.teachers[0]?.last_name || "Teacher"}
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <div>{cls.days_repeated?.join(", ") || "Schedule N/A"}</div>
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
            <Link href={`/admin/students/${student?.student_id}`}>Cancel</Link>
          </Button>
          <Button type="submit" form="assign-to-class-form" disabled={isSubmitting || filteredClasses.length === 0}>
            {isSubmitting ? "Assigning..." : "Assign to Selected Classes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
