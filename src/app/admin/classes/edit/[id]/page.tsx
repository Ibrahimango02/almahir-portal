"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, parse } from "date-fns"
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
import { getTeachers } from "@/lib/get/get-teachers"
import { getStudents } from "@/lib/get/get-students"
import { getClassById } from "@/lib/get/get-classes"
import { updateClass } from "@/lib/put/put-classes"
import { TeacherType, StudentType, ClassType } from "@/types"
import { localToUtc, utcToLocal } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { useToast } from "@/hooks/use-toast"

// Form schema for editing class
const formSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    subject: z.string().min(1, { message: "Please select a subject" }),
    description: z.string().optional(),
    startDate: z.date({ required_error: "Please select a start date" }),
    endDate: z.date({ required_error: "Please select an end date" }),
    daysRepeated: z.array(z.string()).min(1, { message: "Please select at least one day" }),
    classLink: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    teacherIds: z.array(z.string()).min(1, { message: "Please select at least one teacher" }),
    studentIds: z.array(z.string()).optional(),
})

// Days of the week array
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
    "Quran",
    "Arabic",
    "Tafseer",
    "Fiqh",
    "Hadith",
    "Imaan",
    "Aqidah",
    "Islamic Studies",
    "Islamic History",
    "Islamic Geography",
    "Islamic Culture",
    "Islamic Law",
    "Islamic Ethics",
]

export default function EditClassPage() {
    const router = useRouter()
    const params = useParams()
    const classId = params.id as string
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [classData, setClassData] = useState<ClassType | null>(null)
    const [teachers, setTeachers] = useState<TeacherType[]>([])
    const [students, setStudents] = useState<StudentType[]>([])
    const { timezone } = useTimezone()

    // Initialize form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            subject: "",
            description: "",
            startDate: undefined,
            endDate: undefined,
            daysRepeated: [],
            classLink: "",
            teacherIds: [],
            studentIds: [],
        },
    })

    // Watch selected days
    const selectedDays = form.watch("daysRepeated")

    // Fetch data on mount
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch teachers and students in parallel
                const [teachersData, studentsData, classDataResult] = await Promise.all([
                    getTeachers(),
                    getStudents(),
                    getClassById(classId)
                ])

                setTeachers(teachersData)
                setStudents(studentsData)
                setClassData(classDataResult)

                if (classDataResult) {
                    // Populate form with existing class data
                    // Convert capital day names back to lowercase for form compatibility
                    const lowercaseDays = classDataResult.days_repeated.map(day => day.toLowerCase())

                    form.reset({
                        title: classDataResult.title,
                        subject: classDataResult.subject,
                        description: classDataResult.description || "",
                        startDate: utcToLocal(classDataResult.start_date, timezone),
                        endDate: utcToLocal(classDataResult.end_date, timezone),
                        daysRepeated: lowercaseDays,
                        classLink: classDataResult.class_link || "",
                        teacherIds: classDataResult.teachers.map(t => t.teacher_id),
                        studentIds: classDataResult.enrolled_students.map(s => s.student_id),
                    })
                }
            } catch (error) {
                console.error("Error fetching data:", error)
                toast({
                    title: "Error",
                    description: "Failed to load class data. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [classId, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)

        try {
            // Prepare update data
            const updateData = {
                classId: classId,
                title: values.title,
                subject: values.subject,
                description: values.description || null,
                start_date: localToUtc(values.startDate, timezone).toISOString(),
                end_date: localToUtc(values.endDate, timezone).toISOString(),
                days_repeated: values.daysRepeated.map(day => day.charAt(0).toUpperCase() + day.slice(1)),
                class_link: values.classLink || null,
                teacher_ids: values.teacherIds,
                student_ids: values.studentIds || [],
            }

            // Update class in database
            const result = await updateClass(updateData)

            if (result.success) {
                toast({
                    title: "Class updated successfully",
                    description: `${values.title} has been updated with the new information`,
                })
                router.push("/admin/classes")
            } else {
                throw new Error(result.error?.message || "Failed to update class")
            }
        } catch (error) {
            console.error("Error updating class:", error)
            toast({
                title: "Error",
                description: "There was a problem updating the class. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p>Loading class information...</p>
            </div>
        )
    }

    if (!classData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-lg font-semibold mb-2">Class not found</p>
                    <p className="text-muted-foreground mb-4">The class you're looking for doesn't exist.</p>
                    <Button asChild>
                        <Link href="/admin/classes">Back to Classes</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href="/admin/classes" label="Back to Classes" />
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Edit Class</CardTitle>
                    <CardDescription>
                        Update the class information, assign teachers, and enroll students.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} id="edit-class-form" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Class Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Advanced Quran Recitation" {...field} />
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
                                            <Select onValueChange={field.onChange} value={field.value}>
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
                                        <FormLabel>Description (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Brief description of the class content and objectives"
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                            return startDate && date < startDate
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="teacherIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assign Teachers</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                const currentValues = field.value || [];
                                                if (!currentValues.includes(value)) {
                                                    field.onChange([...currentValues, value]);
                                                }
                                            }}
                                            value={field.value?.[field.value.length - 1] || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select teachers" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {teachers.map((teacher) => (
                                                    <SelectItem
                                                        key={teacher.teacher_id}
                                                        value={teacher.teacher_id}
                                                        disabled={field.value?.includes(teacher.teacher_id)}
                                                    >
                                                        {teacher.first_name} {teacher.last_name} ({teacher.specialization || "No specialization"})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="mt-2">
                                            {field.value && field.value.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {field.value.map((teacherId) => {
                                                        const teacher = teachers.find(t => t.teacher_id === teacherId);
                                                        return teacher ? (
                                                            <div
                                                                key={teacherId}
                                                                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                                                            >
                                                                <span>{teacher.first_name} {teacher.last_name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        field.onChange(field.value.filter(id => id !== teacherId));
                                                                    }}
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <FormDescription>Select one or more teachers for this class</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="studentIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Enroll Students (Optional)</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                const currentValues = field.value || [];
                                                if (!currentValues.includes(value)) {
                                                    field.onChange([...currentValues, value]);
                                                }
                                            }}
                                            value={field.value?.[field.value.length - 1] || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select students" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {students.map((student) => (
                                                    <SelectItem
                                                        key={student.student_id}
                                                        value={student.student_id}
                                                        disabled={field.value?.includes(student.student_id)}
                                                    >
                                                        {student.first_name} {student.last_name} (Age: {student.age}, Grade: {student.grade_level || "N/A"})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="mt-2">
                                            {field.value && field.value.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {field.value.map((studentId) => {
                                                        const student = students.find(s => s.student_id === studentId);
                                                        return student ? (
                                                            <div
                                                                key={studentId}
                                                                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                                                            >
                                                                <span>{student.first_name} {student.last_name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        field.onChange(field.value?.filter(id => id !== studentId));
                                                                    }}
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <FormDescription>Select students to enroll in this class</FormDescription>
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
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                        <Link href="/admin/classes">Cancel</Link>
                    </Button>
                    <Button
                        type="submit"
                        form="edit-class-form"
                        disabled={isSubmitting}
                        style={{ backgroundColor: "#3d8f5b", color: "white" }}
                    >
                        {isSubmitting ? "Updating..." : "Update Class"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
