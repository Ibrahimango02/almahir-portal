"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, Plus, X, Save, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { WeeklySchedule, TimeSlot } from "@/types"
import { getTeacherAvailability } from "@/lib/get/get-teachers"
import { updateTeacherAvailability } from "@/lib/put/put-teachers"
import { useToast } from "@/hooks/use-toast"
import { useTimezone } from "@/contexts/TimezoneContext"
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

interface TeacherAvailabilityEditorProps {
    teacherId: string
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const dayNames = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday"
}

const dayColors = {
    monday: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    tuesday: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    wednesday: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    thursday: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    friday: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    saturday: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    sunday: "bg-gray-50 border-gray-200 hover:bg-gray-100"
}

const defaultSchedule: WeeklySchedule = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
}

// Helper function to convert local time to UTC
function localTimeToUtc(localTime: string, timezone: string): string {
    try {
        // Create a date object for today with the local time
        const today = new Date()
        const [hours, minutes] = localTime.split(':').map(Number)

        // Create a date in the user's timezone by treating the time as if it's in that timezone
        const year = today.getFullYear()
        const month = today.getMonth()
        const date = today.getDate()

        // Create a date string and parse it as if it's in the specified timezone
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

        // Parse the date as if it's in the specified timezone, then get UTC equivalent
        const localDate = new Date(dateString)

        // Get the timezone offset for the specified timezone at this date
        const tempDate = new Date(localDate.toLocaleString("en-US", { timeZone: timezone }))
        const utcDate = new Date(localDate.toLocaleString("en-US", { timeZone: "UTC" }))
        const timezoneOffset = tempDate.getTime() - utcDate.getTime()

        // Apply the timezone offset to get the correct UTC time
        const correctedUtcDate = new Date(localDate.getTime() - timezoneOffset)

        // Format as HH:mm
        const utcTime = format(correctedUtcDate, 'HH:mm')

        return utcTime
    } catch (error) {
        console.error('Error converting local time to UTC:', error)
        return localTime // Fallback to original time
    }
}

// Helper function to convert UTC time to local time
function utcTimeToLocal(utcTime: string, timezone: string): string {
    try {
        // Create a date object for today with the UTC time
        const today = new Date()
        const [hours, minutes] = utcTime.split(':').map(Number)

        // Create a UTC date object
        const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes))

        // Convert to local timezone
        const localDate = toZonedTime(utcDate, timezone)

        return format(localDate, 'HH:mm')
    } catch (error) {
        console.error('Error converting UTC time to local:', error)
        return utcTime // Fallback to original time
    }
}

export function TeacherAvailabilityEditor({ teacherId }: TeacherAvailabilityEditorProps) {
    const [schedule, setSchedule] = useState<WeeklySchedule>(defaultSchedule)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()
    const { timezone } = useTimezone()

    const loadAvailability = useCallback(async () => {
        try {
            setIsLoading(true)
            const availability = await getTeacherAvailability(teacherId)
            if (availability) {
                // Convert UTC times to local times for display
                const localSchedule: WeeklySchedule = {
                    monday: availability.weekly_schedule.monday.map(slot => ({
                        start: utcTimeToLocal(slot.start, timezone),
                        end: utcTimeToLocal(slot.end, timezone)
                    })),
                    tuesday: availability.weekly_schedule.tuesday.map(slot => ({
                        start: utcTimeToLocal(slot.start, timezone),
                        end: utcTimeToLocal(slot.end, timezone)
                    })),
                    wednesday: availability.weekly_schedule.wednesday.map(slot => ({
                        start: utcTimeToLocal(slot.start, timezone),
                        end: utcTimeToLocal(slot.end, timezone)
                    })),
                    thursday: availability.weekly_schedule.thursday.map(slot => ({
                        start: utcTimeToLocal(slot.start, timezone),
                        end: utcTimeToLocal(slot.end, timezone)
                    })),
                    friday: availability.weekly_schedule.friday.map(slot => ({
                        start: utcTimeToLocal(slot.start, timezone),
                        end: utcTimeToLocal(slot.end, timezone)
                    })),
                    saturday: availability.weekly_schedule.saturday.map(slot => ({
                        start: utcTimeToLocal(slot.start, timezone),
                        end: utcTimeToLocal(slot.end, timezone)
                    })),
                    sunday: availability.weekly_schedule.sunday.map(slot => ({
                        start: utcTimeToLocal(slot.start, timezone),
                        end: utcTimeToLocal(slot.end, timezone)
                    }))
                }
                setSchedule(localSchedule)
            }
        } catch (error) {
            console.error('Error loading availability:', error)
            toast({
                title: "Error",
                description: "Failed to load availability settings",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }, [teacherId, timezone, toast])

    useEffect(() => {
        loadAvailability()
    }, [loadAvailability])

    const addTimeSlot = (day: keyof WeeklySchedule) => {
        setSchedule(prev => ({
            ...prev,
            [day]: [...prev[day], { start: "09:00", end: "10:00" }]
        }))
    }

    const removeTimeSlot = (day: keyof WeeklySchedule, index: number) => {
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].filter((_, i) => i !== index)
        }))
    }

    const updateTimeSlot = (day: keyof WeeklySchedule, index: number, field: 'start' | 'end', value: string) => {
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].map((slot, i) =>
                i === index ? { ...slot, [field]: value } : slot
            )
        }))
    }

    const validateTimeSlot = (slot: TimeSlot): boolean => {
        const start = slot.start
        const end = slot.end

        // Basic time format validation (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(start) || !timeRegex.test(end)) {
            return false
        }

        // Check if end time is after start time
        const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1])
        const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1])

        // If end time is earlier in the day than start time, it means the slot runs past midnight
        // This is valid (e.g., 11:00 PM to 12:00 AM)
        if (endMinutes <= startMinutes) {
            // Only allow this if the end time is 12:00 AM (00:00)
            return endMinutes === 0
        }

        return true
    }

    // Helper function to convert time string to minutes for comparison
    const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }

    // Function to check if two time slots overlap
    const doTimeSlotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
        const start1 = timeToMinutes(slot1.start)
        const end1 = timeToMinutes(slot1.end)
        const start2 = timeToMinutes(slot2.start)
        const end2 = timeToMinutes(slot2.end)

        // Two slots overlap if one starts before the other ends and ends after the other starts
        return start1 < end2 && start2 < end1
    }

    // Function to check for overlapping time slots in a day
    const hasOverlappingSlots = (day: keyof WeeklySchedule): boolean => {
        const slots = schedule[day]
        for (let i = 0; i < slots.length; i++) {
            for (let j = i + 1; j < slots.length; j++) {
                if (doTimeSlotsOverlap(slots[i], slots[j])) {
                    return true
                }
            }
        }
        return false
    }

    // Function to validate a specific time slot against others in the same day
    const validateTimeSlotAgainstOthers = (day: keyof WeeklySchedule, slotIndex: number): boolean => {
        const slots = schedule[day]
        const currentSlot = slots[slotIndex]

        for (let i = 0; i < slots.length; i++) {
            if (i !== slotIndex && doTimeSlotsOverlap(currentSlot, slots[i])) {
                return false
            }
        }
        return true
    }

    const validateSchedule = (): boolean => {
        for (const day of dayOrder) {
            // Check individual time slots
            for (const slot of schedule[day]) {
                if (!validateTimeSlot(slot)) {
                    return false
                }
            }
            // Check for overlapping slots
            if (hasOverlappingSlots(day)) {
                return false
            }
        }
        return true
    }

    const handleSave = async () => {
        if (!validateSchedule()) {
            // Check for specific validation issues
            let hasOverlaps = false
            let hasInvalidSlots = false

            for (const day of dayOrder) {
                for (const slot of schedule[day]) {
                    if (!validateTimeSlot(slot)) {
                        hasInvalidSlots = true
                    }
                }
                if (hasOverlappingSlots(day)) {
                    hasOverlaps = true
                }
            }

            let errorMessage = "Please fix the following issues:"
            if (hasInvalidSlots) {
                errorMessage += " Invalid time slots (end time must be after start time, unless the slot runs past midnight ending at 12:00 AM)"
            }
            if (hasOverlaps) {
                errorMessage += hasInvalidSlots ? ", overlapping time slots" : " Overlapping time slots"
            }

            toast({
                title: "Invalid Schedule",
                description: errorMessage,
                variant: "destructive"
            })
            return
        }

        try {
            setIsSaving(true)

            // Convert local times to UTC before saving
            const utcSchedule: WeeklySchedule = {
                monday: schedule.monday.map(slot => ({
                    start: localTimeToUtc(slot.start, timezone),
                    end: localTimeToUtc(slot.end, timezone)
                })),
                tuesday: schedule.tuesday.map(slot => ({
                    start: localTimeToUtc(slot.start, timezone),
                    end: localTimeToUtc(slot.end, timezone)
                })),
                wednesday: schedule.wednesday.map(slot => ({
                    start: localTimeToUtc(slot.start, timezone),
                    end: localTimeToUtc(slot.end, timezone)
                })),
                thursday: schedule.thursday.map(slot => ({
                    start: localTimeToUtc(slot.start, timezone),
                    end: localTimeToUtc(slot.end, timezone)
                })),
                friday: schedule.friday.map(slot => ({
                    start: localTimeToUtc(slot.start, timezone),
                    end: localTimeToUtc(slot.end, timezone)
                })),
                saturday: schedule.saturday.map(slot => ({
                    start: localTimeToUtc(slot.start, timezone),
                    end: localTimeToUtc(slot.end, timezone)
                })),
                sunday: schedule.sunday.map(slot => ({
                    start: localTimeToUtc(slot.start, timezone),
                    end: localTimeToUtc(slot.end, timezone)
                }))
            }

            const result = await updateTeacherAvailability(teacherId, utcSchedule)

            toast({
                title: "Success",
                description: result.message
            })
        } catch (error) {
            console.error('Error saving availability:', error)
            toast({
                title: "Error",
                description: "Failed to save availability settings",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-semibold text-gray-900">Availability Settings</CardTitle>
                            <CardDescription className="text-gray-600">Loading your availability settings...</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-semibold text-gray-900">Weekly Availability</CardTitle>
                            <CardDescription className="text-gray-600">
                                Set your teaching schedule for each day of the week
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white">
                            <Clock className="h-3 w-3 mr-1" />
                            {timezone}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                <div className="grid gap-4">
                    {dayOrder.map((day) => (
                        <div key={day} className="group">
                            <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${dayColors[day]} ${schedule[day].length > 0 ? 'border-gray-300 bg-gray-50' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold capitalize text-gray-900">{dayNames[day]}</h3>
                                        {schedule[day].length > 0 && (
                                            <Badge variant="secondary" className="bg-white">
                                                {schedule[day].length} slot{schedule[day].length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                        {schedule[day].length > 0 && hasOverlappingSlots(day) && (
                                            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                Overlapping
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addTimeSlot(day)}
                                        className="bg-white hover:bg-gray-50 transition-colors"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Time
                                    </Button>
                                </div>

                                {schedule[day].length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No time slots set for {dayNames[day]}</p>
                                        <p className="text-xs mt-1">Click &quot;Add Time&quot; to set your availability</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {schedule[day].map((slot, index) => (
                                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-gray-500" />
                                                            <Label className="text-sm font-medium text-gray-700">Start:</Label>
                                                            <Input
                                                                type="time"
                                                                value={slot.start}
                                                                onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                                                                className="w-32 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-sm font-medium text-gray-700">End:</Label>
                                                            <Input
                                                                type="time"
                                                                value={slot.end}
                                                                onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                                                                className="w-32 border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {validateTimeSlot(slot) && validateTimeSlotAgainstOthers(day, index) ? (
                                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeTimeSlot(day, index)}
                                                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {!validateTimeSlot(slot) && (
                                                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Invalid time range - end time must be after start time, unless the slot runs past midnight ending at 12:00 AM
                                                    </div>
                                                )}
                                                {validateTimeSlot(slot) && !validateTimeSlotAgainstOthers(day, index) && (
                                                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        This time slot overlaps with another slot on {dayNames[day]}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <Separator className="my-6" />

                <div className="flex items-center justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !validateSchedule()}
                        className="min-w-[140px]"
                        style={{
                            backgroundColor: "#3d8f5b",
                            color: "white",
                        }}
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Schedule
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}