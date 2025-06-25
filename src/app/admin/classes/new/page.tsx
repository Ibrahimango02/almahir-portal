"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, startOfDay } from "date-fns"
import { CalendarIcon, BookOpen, Clock, Users, Link as LinkIcon, FileText } from "lucide-react"

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
import { TeacherType } from "@/types"
import { createClass } from "@/lib/post/post-classes"
import { combineDateTimeToUtc } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { localToUtc } from "@/lib/utils/timezone"
import { Separator } from "@/components/ui/separator"

// Update the form schema to include teacher selection
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

export default function CreateClassPage() {
    const router = useRouter()
    const { timezone } = useTimezone()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [teachers, setTeachers] = useState<TeacherType[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch teachers data on mount
    useEffect(() => {
        async function fetchTeachers() {
            const t = await getTeachers()
            setTeachers(t)
            setLoading(false)
        }
        fetchTeachers()
    }, [])

    // Initialize form with default values
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
        },
    })

    // Watch selected days
    const selectedDays = form.watch("daysRepeated")

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d8f5b]"></div>
                    <p className="text-muted-foreground">Loading teachers information...</p>
                </div>
            </div>
        )
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)

        try {
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

            // Transform form data to match ClassData type
            const classData = {
                title: values.title,
                subject: values.subject,
                description: values.description || null,
                start_date: localToUtc(values.startDate, timezone).toISOString(),
                end_date: localToUtc(values.endDate, timezone).toISOString(),
                days_repeated: values.daysRepeated.map(day => day.charAt(0).toUpperCase() + day.slice(1)),
                status: "active",
                class_link: values.classLink || null,
                times: timesWithUtc,
                teacher_id: values.teacherIds
            }

            // Create class and sessions in database
            await createClass(classData)

            // Show success message
            toast({
                title: "Class created successfully",
                description: `${values.title} has been created and assigned to selected teachers`,
            })

            // Navigate back to the classes list
            router.push("/admin/classes")
        } catch (error) {
            console.error("Error creating class:", error)
            toast({
                title: "Error",
                description: "There was a problem creating the class. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen py-8">
            <BackButton href="/admin/classes" label="Back to Classes" />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="mt-6 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Class</h1>
                    </div>
                </div>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-8">
                        <div className="mx-auto w-16 h-16 bg-[#3d8f5b]/10 rounded-full flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-[#3d8f5b]" />
                        </div>
                        <CardTitle className="text-2xl font-semibold text-gray-900">Class Information</CardTitle>
                        <CardDescription className="text-base text-gray-600">
                            Fill in the details below to create a new class and assign teachers
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} id="create-class-form" className="space-y-8">
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                                    <div className="grid grid-cols-5 md:grid-cols-2 gap-6">
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
                                                                    return startOfDay(date) < startOfDay(new Date()) || (startDate && startOfDay(date) < startOfDay(startDate))
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
                            form="create-class-form"
                            disabled={isSubmitting}
                            className="h-11 px-8 bg-[#3d8f5b] hover:bg-[#3d8f5b]/90 text-white font-medium transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creating...
                                </div>
                            ) : (
                                "Create Class"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
