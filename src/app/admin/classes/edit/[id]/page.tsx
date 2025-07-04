"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, startOfDay } from "date-fns"
import { CalendarIcon, BookOpen, Clock, Users, Link as LinkIcon, FileText, GraduationCap, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getTeachers } from "@/lib/get/get-teachers"
import { getStudents } from "@/lib/get/get-students"
import { getClassById } from "@/lib/get/get-classes"
import { updateClass, updateClassAssignments } from "@/lib/put/put-classes"
import { TeacherType, StudentType, ClassType } from "@/types"
import { localToUtc, utcToLocal, combineDateTimeToUtc } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { checkMultipleTeacherConflicts, checkMultipleStudentConflicts, ConflictInfo } from "@/lib/utils/conflict-checker"
import { TeacherConflictDisplay } from "@/components/teacher-conflict-display"
import { StudentConflictDisplay } from "@/components/student-conflict-display"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

// Form schema for editing class
const formSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    subject: z.string().min(1, { message: "Please select a subject" }),
    description: z.string().optional(),
    startDate: z.date({ required_error: "Please select a start date" }),
    endDate: z.date({ required_error: "Please select an end date" }),
    daysRepeated: z.array(z.string()).min(1, { message: "Please select at least one day" }),
    times: z.record(z.object({
        start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time (HH:MM)" }),
        end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Please enter a valid time (HH:MM)" }),
    })),
    classLink: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    teacherIds: z.array(z.string()).min(1, { message: "Please select at least one teacher" }),
    studentIds: z.array(z.string()).optional(),
}).refine(
    (data) => {
        if (!data.startDate || !data.endDate) return true
        return startOfDay(data.startDate) <= startOfDay(data.endDate)
    },
    {
        message: "End date must be after or equal to start date",
        path: ["endDate"],
    }
).superRefine((data, ctx) => {
    // Check if there are any times defined
    if (!data.times || Object.keys(data.times).length === 0) return

    // Validate each day's times
    for (const [day, timeData] of Object.entries(data.times)) {
        if (timeData.start && timeData.end) {
            // Convert times to minutes for comparison
            const startMinutes = parseInt(timeData.start.split(':')[0]) * 60 + parseInt(timeData.start.split(':')[1])
            const endMinutes = parseInt(timeData.end.split(':')[0]) * 60 + parseInt(timeData.end.split(':')[1])

            if (startMinutes >= endMinutes) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "End time must be after start time",
                    path: ["times", day, "end"]
                })
            }
        }
    }
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
    const [teacherConflicts, setTeacherConflicts] = useState<Record<string, ConflictInfo>>({})
    const [studentConflicts, setStudentConflicts] = useState<Record<string, ConflictInfo>>({})
    const [checkingConflicts, setCheckingConflicts] = useState(false)
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
            times: {},
            classLink: "",
            teacherIds: [],
            studentIds: [],
        },
    })

    // Watch selected days
    const selectedDays = form.watch("daysRepeated")

    // Function to check conflicts for selected teachers and students
    const checkConflicts = useCallback(async () => {
        const selectedTeacherIds = form.getValues("teacherIds")
        const selectedStudentIds = form.getValues("studentIds") || []
        const startDate = form.getValues("startDate")
        const endDate = form.getValues("endDate")
        const times = form.getValues("times")
        const selectedDays = form.getValues("daysRepeated")

        if ((!selectedTeacherIds.length && !selectedStudentIds.length) || !startDate || !endDate || !selectedDays.length) {
            setTeacherConflicts({})
            setStudentConflicts({})
            return
        }

        setCheckingConflicts(true)
        try {
            // Filter times to only include selected days
            const classTimes = selectedDays.reduce((acc, day) => {
                if (times[day]?.start && times[day]?.end) {
                    acc[day] = times[day]
                }
                return acc
            }, {} as Record<string, { start: string; end: string }>)

            if (Object.keys(classTimes).length === 0) {
                setTeacherConflicts({})
                setStudentConflicts({})
                return
            }

            // Check teacher conflicts
            const teacherConflictsResult = selectedTeacherIds.length > 0
                ? await checkMultipleTeacherConflicts(
                    selectedTeacherIds,
                    classTimes,
                    startDate,
                    endDate,
                    timezone,
                    classId
                )
                : {}

            // Check student conflicts
            const studentConflictsResult = selectedStudentIds.length > 0
                ? await checkMultipleStudentConflicts(
                    selectedStudentIds,
                    classTimes,
                    startDate,
                    endDate,
                    timezone,
                    classId
                )
                : {}

            setTeacherConflicts(teacherConflictsResult)
            setStudentConflicts(studentConflictsResult)

        } catch (error) {
            console.error("Error checking conflicts:", error)
            toast({
                title: "Error",
                description: "Failed to check conflicts. Please try again.",
                variant: "destructive",
            })
        } finally {
            setCheckingConflicts(false)
        }
    }, [form, timezone, toast, classId])

    // Check conflicts when relevant form fields change
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            // Check if the change is related to times, dates, participants, or days
            const shouldCheckConflicts = name && (
                name === 'teacherIds' ||
                name === 'studentIds' ||
                name === 'startDate' ||
                name === 'endDate' ||
                name === 'daysRepeated' ||
                name === 'times' ||
                name.startsWith('times.')
            )

            if (shouldCheckConflicts) {
                // Debounce the conflict check
                const timeoutId = setTimeout(checkConflicts, 500)
                return () => clearTimeout(timeoutId)
            }
        })
        return () => subscription.unsubscribe()
    }, [form, checkConflicts])

    // Function to remove teacher with conflicts
    const removeTeacherWithConflict = (teacherId: string) => {
        const currentTeacherIds = form.getValues("teacherIds")
        form.setValue("teacherIds", currentTeacherIds.filter(id => id !== teacherId))
    }

    // Function to remove student with conflicts
    const removeStudentWithConflict = (studentId: string) => {
        const currentStudentIds = form.getValues("studentIds") || []
        form.setValue("studentIds", currentStudentIds.filter(id => id !== studentId))
    }

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
                    // Convert capital day names back to lowercase for form compatibility
                    const lowercaseDays = classDataResult.days_repeated.map(day => day.toLowerCase())

                    // Convert times from UTC to local format for display
                    const times = lowercaseDays.reduce((acc, day) => {
                        const dayKey = day.charAt(0).toUpperCase() + day.slice(1)
                        const classTime = classDataResult.times?.[dayKey]
                        if (classTime) {
                            // Convert UTC times to local times for display
                            const startDate = new Date(classTime.start)
                            const endDate = new Date(classTime.end)
                            const startLocal = format(startDate, 'HH:mm')
                            const endLocal = format(endDate, 'HH:mm')
                            acc[day] = { start: startLocal, end: endLocal }
                        }
                        return acc
                    }, {} as Record<string, { start: string; end: string }>)

                    form.reset({
                        title: classDataResult.title,
                        subject: classDataResult.subject,
                        description: classDataResult.description || "",
                        startDate: utcToLocal(classDataResult.start_date, timezone),
                        endDate: utcToLocal(classDataResult.end_date, timezone),
                        daysRepeated: lowercaseDays,
                        times: times,
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
    }, [classId, form, timezone, toast])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)

        try {
            // Check for conflicts before updating the class
            const hasTeacherConflicts = Object.values(teacherConflicts).some(conflict => conflict.hasConflict)
            const hasStudentConflicts = Object.values(studentConflicts).some(conflict => conflict.hasConflict)

            if (hasTeacherConflicts || hasStudentConflicts) {
                const conflictMessages = []
                if (hasTeacherConflicts) conflictMessages.push("teachers have schedule or availability conflicts")
                if (hasStudentConflicts) conflictMessages.push("students have schedule conflicts")

                const confirmed = window.confirm(
                    `Some selected ${conflictMessages.join(" and ")}. Do you want to proceed with updating the class anyway?`
                )
                if (!confirmed) {
                    setIsSubmitting(false)
                    return
                }
            }

            // Convert local times to UTC before saving
            const timesWithUtc = Object.entries(values.times).reduce((acc, [day, time]) => {
                // For each day, convert the local time to UTC
                const startUtc = combineDateTimeToUtc(
                    format(values.startDate, 'yyyy-MM-dd'),
                    time.start + ':00',
                    timezone
                );
                const endUtc = combineDateTimeToUtc(
                    format(values.startDate, 'yyyy-MM-dd'),
                    time.end + ':00',
                    timezone
                );

                // Convert day key to capital first letter to match session creation logic
                const capitalDay = day.charAt(0).toUpperCase() + day.slice(1);

                acc[capitalDay] = {
                    start: startUtc.toISOString(),
                    end: endUtc.toISOString()
                };
                return acc;
            }, {} as Record<string, { start: string; end: string }>);

            // Prepare update data for basic class information (excluding teacher and student assignments)
            const updateData = {
                classId: classId,
                title: values.title,
                subject: values.subject,
                description: values.description || null,
                start_date: localToUtc(values.startDate, timezone).toISOString(),
                end_date: localToUtc(values.endDate, timezone).toISOString(),
                days_repeated: values.daysRepeated.map(day => day.charAt(0).toUpperCase() + day.slice(1)),
                class_link: values.classLink || null,
                times: timesWithUtc,
                // Don't include teacher_ids and student_ids here as we'll handle them separately
            }

            // Update class basic information first
            const result = await updateClass(updateData)

            if (!result.success) {
                throw new Error(result.error?.message || "Failed to update class")
            }

            // Handle teacher and student assignments using the new function that populates teacher_students
            try {
                await updateClassAssignments({
                    classId: classId,
                    teacher_ids: values.teacherIds || [],
                    student_ids: values.studentIds || []
                })
            } catch (error) {
                console.error("Error updating class assignments:", error)
                // Continue with the process even if assignment fails
            }

            toast({
                title: "Class updated successfully",
                description: `${values.title} has been updated with the new information`,
            })
            router.push(`/admin/classes/${classId}`)
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
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d8f5b]"></div>
                    <p className="text-muted-foreground">Loading class information...</p>
                </div>
            </div>
        )
    }

    if (!classData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-lg font-semibold mb-2">Class not found</p>
                    <p className="text-muted-foreground mb-4">The class you&apos;re looking for doesn&apos;t exist.</p>
                    <Button asChild>
                        <Link href="/admin/classes">Back to Classes</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <BackButton href="/admin/classes" label="Back to Classes" />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-8">
                        <div className="mx-auto w-16 h-16 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-[#3d8f5b]" />
                        </div>
                        <CardTitle className="text-2xl font-semibold text-gray-900">Edit Class</CardTitle>
                        <CardDescription className="text-base text-gray-600">
                            Update the class information, assign teachers, and enroll students
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} id="edit-class-form" className="space-y-8">
                                {/* Basic Information Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-[#3d8f5b]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-medium text-gray-700">Class Title</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Advanced Quran Recitation"
                                                            className="h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                                                            {...field}
                                                        />
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
                                                    <FormLabel className="text-sm font-medium text-gray-700">Subject</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20">
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
                                                <FormLabel className="text-sm font-medium text-gray-700">Description (Optional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Brief description of the class content and objectives"
                                                        className="min-h-[100px] border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20 resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator className="my-8" />

                                {/* Schedule Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-[#3d8f5b]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Schedule & Duration</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel className="text-sm font-medium text-gray-700">Start Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full h-11 pl-3 text-left font-normal border-gray-200 hover:border-[#3d8f5b] focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20",
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
                                                                disabled={(date) => startOfDay(date) < startOfDay(new Date())}
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
                                                    <FormLabel className="text-sm font-medium text-gray-700">End Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full h-11 pl-3 text-left font-normal border-gray-200 hover:border-[#3d8f5b] focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20",
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
                                                                    return startDate && startOfDay(date) < startOfDay(startDate)
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
                                        name="daysRepeated"
                                        render={() => (
                                            <FormItem>
                                                <div className="mb-4">
                                                    <FormLabel className="text-sm font-medium text-gray-700">Days of Week</FormLabel>
                                                    <FormDescription className="text-sm text-gray-600">Select the days when this class will occur</FormDescription>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {daysOfWeek.map((day) => (
                                                        <FormField
                                                            key={day.id}
                                                            control={form.control}
                                                            name="daysRepeated"
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
                                                                                className="data-[state=checked]:bg-[#3d8f5b] data-[state=checked]:border-[#3d8f5b]"
                                                                            />
                                                                        </FormControl>
                                                                        <FormLabel className="font-normal text-sm text-gray-700">{day.label}</FormLabel>
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

                                    {/* Per-day time fields */}
                                    {selectedDays && selectedDays.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-4">Class Times</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedDays.map((day: string) => (
                                                    <div key={day} className="flex flex-col gap-3 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                                        <div className="font-medium text-sm text-gray-900 mb-2">
                                                            {daysOfWeek.find((d) => d.id === day)?.label} Time
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <FormField
                                                                control={form.control}
                                                                name={`times.${day}.start` as keyof z.infer<typeof formSchema>}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs font-medium text-gray-600">Start Time</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="14:30"
                                                                                className="h-9 text-sm border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                                                                                {...field}
                                                                                value={String(field.value || "")}
                                                                                onChange={(e) => {
                                                                                    field.onChange(e.target.value)
                                                                                    // Trigger conflict check after a short delay
                                                                                    setTimeout(checkConflicts, 300)
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormDescription className="text-xs">24h format</FormDescription>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`times.${day}.end` as keyof z.infer<typeof formSchema>}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs font-medium text-gray-600">End Time</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="16:00"
                                                                                className="h-9 text-sm border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                                                                                {...field}
                                                                                value={String(field.value || "")}
                                                                                onChange={(e) => {
                                                                                    field.onChange(e.target.value)
                                                                                    // Trigger conflict check after a short delay
                                                                                    setTimeout(checkConflicts, 300)
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <FormDescription className="text-xs">24h format</FormDescription>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-8" />

                                {/* Teachers Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center">
                                            <Users className="w-4 h-4 text-[#3d8f5b]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Assign Teachers</h3>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="teacherIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Select Teachers</FormLabel>
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
                                                        <SelectTrigger className="h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20">
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
                                                                {teacher.first_name} {teacher.last_name} {teacher.specialization ? `(${teacher.specialization})` : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="mt-3">
                                                    {field.value && field.value.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {field.value.map((teacherId) => {
                                                                const teacher = teachers.find(t => t.teacher_id === teacherId);
                                                                return teacher ? (
                                                                    <div
                                                                        key={teacherId}
                                                                        className="flex items-center gap-2 bg-[#3d8f5b]/10 border border-[#3d8f5b]/20 px-3 py-2 rounded-lg text-sm"
                                                                    >
                                                                        <span className="text-[#3d8f5b] font-medium">{teacher.first_name} {teacher.last_name}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                field.onChange(field.value.filter(id => id !== teacherId));
                                                                            }}
                                                                            className="text-[#3d8f5b] hover:text-[#3d8f5b]/70 transition-colors"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <FormDescription className="text-sm text-gray-600">Select one or more teachers for this class</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Conflict Checking Status */}
                                    {checkingConflicts && (
                                        <Alert className="border-blue-200 bg-blue-50">
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                <AlertDescription className="text-blue-800">
                                                    Checking teacher and student conflicts...
                                                </AlertDescription>
                                            </div>
                                        </Alert>
                                    )}

                                    {/* Teacher Conflicts Display */}
                                    {Object.values(teacherConflicts).some(conflict => conflict.hasConflict) && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                                <h4 className="text-sm font-medium text-gray-900">Teacher Conflicts Found</h4>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                                                {Object.entries(teacherConflicts).map(([teacherId, conflictInfo]) => {
                                                    const teacher = teachers.find(t => t.teacher_id === teacherId);
                                                    if (!teacher) return null;

                                                    return (
                                                        <TeacherConflictDisplay
                                                            key={teacherId}
                                                            teacher={teacher}
                                                            conflictInfo={conflictInfo}
                                                            onRemoveTeacher={removeTeacherWithConflict}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-8" />

                                {/* Students Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center">
                                            <GraduationCap className="w-4 h-4 text-[#3d8f5b]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Enroll Students</h3>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="studentIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Select Students (Optional)</FormLabel>
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
                                                        <SelectTrigger className="h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20">
                                                            <SelectValue placeholder="Select student" />
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
                                                <div className="mt-3">
                                                    {field.value && field.value.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {field.value.map((studentId) => {
                                                                const student = students.find(s => s.student_id === studentId);
                                                                return student ? (
                                                                    <div
                                                                        key={studentId}
                                                                        className="flex items-center gap-2 bg-[#3d8f5b]/10 border border-[#3d8f5b]/20 px-3 py-2 rounded-lg text-sm"
                                                                    >
                                                                        <span className="text-[#3d8f5b] font-medium">{student.first_name} {student.last_name}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                field.onChange(field.value?.filter(id => id !== studentId));
                                                                            }}
                                                                            className="text-[#3d8f5b] hover:text-[#3d8f5b]/70 transition-colors"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <FormDescription className="text-sm text-gray-600">Select students to enroll in this class</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Student Conflicts Display */}
                                    {Object.values(studentConflicts).some(conflict => conflict.hasConflict) && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                                <h4 className="text-sm font-medium text-gray-900">Student Conflicts Found</h4>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                                                {Object.entries(studentConflicts).map(([studentId, conflictInfo]) => {
                                                    const student = students.find(s => s.student_id === studentId);
                                                    if (!student) return null;

                                                    return (
                                                        <StudentConflictDisplay
                                                            key={studentId}
                                                            student={student}
                                                            conflictInfo={conflictInfo}
                                                            onRemoveStudent={removeStudentWithConflict}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-8" />

                                {/* Additional Settings Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center">
                                            <LinkIcon className="w-4 h-4 text-[#3d8f5b]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="classLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Class Link (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://meet.google.com/..."
                                                        className="h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-sm text-gray-600">
                                                    Meeting link for online classes
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </CardContent>

                    <CardFooter className="flex justify-between px-8 py-6 bg-gray-50/50 border-t">
                        <Button variant="outline" asChild className="h-11 px-6 border-gray-200 hover:border-gray-300">
                            <Link href="/admin/classes">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            form="edit-class-form"
                            disabled={isSubmitting}
                            className="h-11 px-8 bg-[#3d8f5b] hover:bg-[#3d8f5b]/90 text-white font-medium transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating...
                                </div>
                            ) : (
                                "Update Class"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
