"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, startOfDay } from "date-fns"
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
import { TeacherType } from "@/types"
import { createClass } from "@/lib/post/post-classes"
import { combineDateTimeToUtc } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { localToUtc } from "@/lib/utils/timezone"

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
                <p>Loading teachers information...</p>
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
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href="/admin/classes" label="Back to Classes" />
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Create New Class</CardTitle>
                    <CardDescription>Fill in the details below to create a new class and assign teachers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} id="create-class-form" className="space-y-6">
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
                                            <FormLabel>Days of Week</FormLabel>
                                            <FormDescription>Select the days when this class will occur</FormDescription>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                                                                        style={{
                                                                            backgroundColor: field.value?.includes(day.id) ? "#3d8f5b" : "white",
                                                                            color: "white",
                                                                            borderColor: "#3d8f5b"
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

                            {/* Per-day time fields */}
                            {selectedDays && selectedDays.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {selectedDays.map((day: string) => (
                                        <div key={day} className="flex flex-col gap-2 border rounded-md p-4">
                                            <div className="font-semibold mb-2">{daysOfWeek.find((d) => d.id === day)?.label} Time</div>
                                            <FormField
                                                control={form.control}
                                                name={`times.${day}.start` as keyof z.infer<typeof formSchema>}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Start Time</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="HH:MM (24h)" {...field} value={String(field.value || "")} />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">Format: 14:30</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`times.${day}.end` as keyof z.infer<typeof formSchema>}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Time</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="HH:MM (24h)" {...field} value={String(field.value || "")} />
                                                        </FormControl>
                                                        <FormDescription className="text-xs">Format: 16:00</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

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
                                                        {teacher.first_name} {teacher.last_name} {teacher.specialization ? `(${teacher.specialization})` : ""}
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
                    <Button type="submit" form="create-class-form" disabled={isSubmitting} style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                        {isSubmitting ? "Creating..." : "Create Class"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
