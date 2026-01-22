"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, startOfDay } from "date-fns"
import { CalendarIcon, BookOpen, Clock, UserPen, Link as LinkIcon, FileText, User, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Checkbox } from "@/components/ui/checkbox"
import { SubjectsCombobox } from "@/components/subjects-combobox"
import { TeachersCombobox } from "@/components/teachers-combobox"
import { StudentsCombobox } from "@/components/students-combobox"
import { TimezoneSelect } from "@/components/timezone-select"

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
        duration: z.string().min(1, { message: "Please select a duration" }),
    })),
    classLink: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
    teacherIds: z.array(z.string()).min(1, { message: "Please select at least one teacher" }),
    studentIds: z.array(z.string()).optional(),
    timezone: z.string().min(1, { message: "Please select a timezone" }),
}).refine(
    (data) => {
        if (!data.startDate || !data.endDate) return true
        return startOfDay(data.startDate) <= startOfDay(data.endDate)
    },
    {
        message: "End date must be after or equal to start date",
        path: ["endDate"],
    }
)

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

// Calculate duration in minutes from start and end times
const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute

    // Handle case where end time is next day (past midnight)
    if (endTotalMinutes < startTotalMinutes) {
        return (24 * 60) - startTotalMinutes + endTotalMinutes
    }

    return endTotalMinutes - startTotalMinutes
}


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
            timezone: timezone || 'America/Toronto',
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
            // Filter times to only include selected days and calculate end times from duration
            const classTimes = selectedDays.reduce((acc, day) => {
                const timeSlot = times[day]
                if (timeSlot?.start && timeSlot?.duration) {
                    const durationMinutes = parseInt(timeSlot.duration)
                    const endTime = calculateEndTime(timeSlot.start, durationMinutes)
                    acc[day] = {
                        start: timeSlot.start,
                        end: endTime
                    }
                }
                return acc
            }, {} as Record<string, { start: string; end: string }>)

            if (Object.keys(classTimes).length === 0) {
                setTeacherConflicts({})
                setStudentConflicts({})
                return
            }

            // Use the form's timezone value for conflict checking (or user timezone if not set)
            const classTimezone = form.getValues("timezone") || timezone || 'America/Toronto'

            // Check teacher conflicts
            const teacherConflictsResult = selectedTeacherIds.length > 0
                ? await checkMultipleTeacherConflicts(
                    selectedTeacherIds,
                    classTimes,
                    startDate,
                    endDate,
                    classTimezone,
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
                    classTimezone,
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
                    // Handle new object structure for days_repeated
                    const lowercaseDays: string[] = []
                    const times: Record<string, { start: string; duration: string }> = {}

                    // Get the class timezone (or use current user timezone as fallback)
                    const classTimezone = classDataResult.timezone || timezone || 'America/Toronto'

                    // Process the new object structure
                    // Times in days_repeated are now stored as LOCAL times (not UTC)
                    // So we can use them directly
                    if (classDataResult.days_repeated && typeof classDataResult.days_repeated === 'object') {
                        Object.entries(classDataResult.days_repeated).forEach(([day, timeSlot]) => {
                            if (timeSlot && typeof timeSlot === 'object' && 'start' in timeSlot && 'end' in timeSlot) {
                                // Normalize day key to lowercase to match form expectations
                                const dayKey = day.toLowerCase()
                                lowercaseDays.push(dayKey)

                                // Times are already in local format, use them directly
                                const localStart = timeSlot.start
                                const localEnd = timeSlot.end
                                const durationMinutes = calculateDuration(localStart, localEnd)

                                // Find the closest duration option
                                const closestDuration = DURATION_OPTIONS.reduce((prev, curr) => {
                                    return Math.abs(parseInt(curr.value) - durationMinutes) < Math.abs(parseInt(prev.value) - durationMinutes) ? curr : prev
                                })

                                times[dayKey] = {
                                    start: localStart,
                                    duration: closestDuration.value
                                }
                            }
                        })
                    }

                    form.reset({
                        title: classDataResult.title,
                        subject: classDataResult.subject,
                        description: classDataResult.description || "",
                        startDate: utcToLocal(classDataResult.start_date, classTimezone),
                        endDate: utcToLocal(classDataResult.end_date, classTimezone),
                        daysRepeated: lowercaseDays,
                        times: times,
                        classLink: classDataResult.class_link || "",
                        teacherIds: classDataResult.teachers.map(t => t.teacher_id),
                        studentIds: classDataResult.students.map(s => s.student_id),
                        timezone: classTimezone,
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
                // Calculate end time from start time and duration
                const durationMinutes = parseInt(time.duration)
                const endTime = calculateEndTime(time.start, durationMinutes)

                // For each day, convert the local time to UTC using the form's timezone
                const classTimezone = values.timezone || timezone || 'America/Toronto'
                const startUtc = combineDateTimeToUtc(
                    format(values.startDate, 'yyyy-MM-dd'),
                    time.start + ':00',
                    classTimezone
                );
                const endUtc = combineDateTimeToUtc(
                    format(values.startDate, 'yyyy-MM-dd'),
                    endTime + ':00',
                    classTimezone
                );

                // Convert day key to capital first letter to match session creation logic
                const capitalDay = day.charAt(0).toUpperCase() + day.slice(1);

                acc[capitalDay] = {
                    start: startUtc.toISOString(),
                    end: endUtc.toISOString()
                };
                return acc;
            }, {} as Record<string, { start: string; end: string }>);

            // Store LOCAL times in HH:MM format for days_repeated (not UTC)
            // The timezone is stored separately and will be used when creating sessions
            const daysRepeatedWithTimes: {
                monday?: { start: string; end: string }
                tuesday?: { start: string; end: string }
                wednesday?: { start: string; end: string }
                thursday?: { start: string; end: string }
                friday?: { start: string; end: string }
                saturday?: { start: string; end: string }
                sunday?: { start: string; end: string }
            } = {}

            values.daysRepeated.forEach(day => {
                const timeSlot = values.times[day]
                if (timeSlot?.start && timeSlot?.duration) {
                    // Calculate end time from start time and duration
                    const durationMinutes = parseInt(timeSlot.duration)
                    const endTime = calculateEndTime(timeSlot.start, durationMinutes)

                    // Store local times directly (HH:MM format)
                    // These will be converted to UTC when creating sessions using the stored timezone
                    daysRepeatedWithTimes[day as keyof typeof daysRepeatedWithTimes] = {
                        start: timeSlot.start,
                        end: endTime
                    }
                }
            })

            // Determine class link - use provided link or fallback to first teacher's class_link
            let finalClassLink = values.classLink || null;
            if (!finalClassLink && values.teacherIds.length > 0) {
                const firstTeacher = teachers.find(t => t.teacher_id === values.teacherIds[0]);
                if (firstTeacher?.class_link) {
                    finalClassLink = firstTeacher.class_link;
                }
            }

            // Prepare update data for basic class information (excluding teacher and student assignments)
            // Use the form's timezone value
            const classTimezone = values.timezone || timezone || 'America/Toronto'
            const updateData = {
                classId: classId,
                title: values.title,
                subject: values.subject,
                description: values.description || null,
                start_date: localToUtc(values.startDate, classTimezone).toISOString(),
                end_date: localToUtc(values.endDate, classTimezone).toISOString(),
                days_repeated: daysRepeatedWithTimes,
                class_link: finalClassLink,
                timezone: classTimezone,
                times: timesWithUtc,
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
                                                    <FormControl>
                                                        <SubjectsCombobox
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                            placeholder="Select a subject"
                                                        />
                                                    </FormControl>
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
                                                                classNames={{
                                                                    day_selected: "bg-[#3d8f5b] text-white hover:bg-[#2d7a4b] hover:text-white focus:bg-[#3d8f5b] focus:text-white",
                                                                }}
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
                                                                classNames={{
                                                                    day_selected: "bg-[#3d8f5b] text-white hover:bg-[#2d7a4b] hover:text-white focus:bg-[#3d8f5b] focus:text-white",
                                                                }}
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
                                                                render={({ field }) => {
                                                                    const startFieldValue = field.value as string | undefined
                                                                    return (
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs font-medium text-gray-600">Start Time</FormLabel>
                                                                            <FormControl>
                                                                                <Select
                                                                                    value={startFieldValue}
                                                                                    onValueChange={(value: string) => {
                                                                                        field.onChange(value)
                                                                                        setTimeout(checkConflicts, 300)
                                                                                    }}
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
                                                                    )
                                                                }}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`times.${day}.duration` as keyof z.infer<typeof formSchema>}
                                                                render={({ field }) => {
                                                                    const startValue = form.watch(`times.${day}.start` as const) as string | undefined
                                                                    const durationValue = field.value as string | undefined
                                                                    return (
                                                                        <FormItem>
                                                                            <FormLabel className="text-xs font-medium text-gray-600">Duration</FormLabel>
                                                                            <FormControl>
                                                                                <Select
                                                                                    value={durationValue}
                                                                                    onValueChange={(value: string) => {
                                                                                        field.onChange(value)
                                                                                        setTimeout(checkConflicts, 300)
                                                                                    }}
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
                                                            const startTime = form.watch(`times.${day}.start` as const) as string | undefined
                                                            const duration = form.watch(`times.${day}.duration` as const) as string | undefined
                                                            if (startTime && duration) {
                                                                const endTime = calculateEndTime(startTime, parseInt(duration))
                                                                const [endHour, endMinute] = endTime.split(':').map(Number)
                                                                const endTimeLabel = formatTimeLabel(endHour, endMinute)
                                                                return (
                                                                    <div className="text-xs text-gray-600 mt-1">
                                                                        End time: <span className="font-medium text-gray-900">{endTimeLabel}</span>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="timezone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Timezone</FormLabel>
                                                <FormControl>
                                                    <TimezoneSelect
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        placeholder="Select timezone"
                                                        className="h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator className="my-8" />

                                {/* Teachers Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center">
                                            <UserPen className="w-4 h-4 text-[#3d8f5b]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Assign Teachers</h3>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="teacherIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Select Teachers</FormLabel>
                                                <FormControl>
                                                    <TeachersCombobox
                                                        teachers={teachers}
                                                        selectedTeacherIds={field.value || []}
                                                        onTeacherSelect={(teacherId) => {
                                                            const currentValues = field.value || []
                                                            if (currentValues.includes(teacherId)) {
                                                                // Remove teacher if already selected
                                                                field.onChange(currentValues.filter(id => id !== teacherId))
                                                            } else {
                                                                // Add teacher if not selected
                                                                field.onChange([...currentValues, teacherId])
                                                            }
                                                        }}
                                                        placeholder="Search and select teachers"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

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
                                            <User className="w-4 h-4 text-[#3d8f5b]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">Enroll Students</h3>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="studentIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-gray-700">Select Students (Optional)</FormLabel>
                                                <FormControl>
                                                    <StudentsCombobox
                                                        students={students}
                                                        selectedStudentIds={field.value || []}
                                                        onStudentSelect={(studentId) => {
                                                            const currentValues = field.value || []
                                                            if (currentValues.includes(studentId)) {
                                                                // Remove student if already selected
                                                                field.onChange(currentValues.filter(id => id !== studentId))
                                                            } else {
                                                                // Add student if not selected
                                                                field.onChange([...currentValues, studentId])
                                                            }
                                                        }}
                                                        placeholder="Search and select students"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Conflict Checking Status */}
                                    {checkingConflicts && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-[#3d8f5b]"></div>
                                            <span>Checking conflicts...</span>
                                        </div>
                                    )}

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
                                                        placeholder="https://meet.google.com/... (leave empty to use teacher's default link)"
                                                        className="h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </CardContent>

                    <CardFooter className="flex justify-between px-8 py-6 bg-gray-50/50 border-t">
                        <Button variant="outline" asChild className="h-11 px-6 border-gray-200 hover:border-gray-300">
                            <Link href={`/admin/classes/${classId}`}>Cancel</Link>
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
