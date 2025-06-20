"use client"

import { Clock } from "lucide-react"
import { WeeklySchedule } from "@/types"
import { formatTime, getUserTimezone } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { useEffect, useState } from "react"

interface TeacherAvailabilityDisplayProps {
    schedule: WeeklySchedule
    teacherTimezone?: string
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

// Helper function to convert UTC time to local time
function convertUtcTimeToLocal(utcTime: string, teacherTimezone?: string): string {
    try {
        // Create a date object for today with the UTC time
        const today = new Date()
        const [hours, minutes] = utcTime.split(':').map(Number)

        // Create a UTC date object
        const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes))

        // Convert to teacher's timezone or user's timezone
        const targetTimezone = teacherTimezone || getUserTimezone()

        // Format the time in the target timezone with AM/PM format
        return formatTime(utcDate, 'h:mm a', targetTimezone)
    } catch (error) {
        console.error('Error converting time:', error)
        return utcTime // Fallback to original time if conversion fails
    }
}

export function TeacherAvailabilityDisplay({ schedule }: TeacherAvailabilityDisplayProps) {
    const { timezone: userTimezone } = useTimezone()
    const [isClient, setIsClient] = useState(false)
    const hasAvailability = Object.values(schedule).some(day => day.length > 0)

    // Ensure we're on the client side before doing timezone conversions
    useEffect(() => {
        setIsClient(true)   
    }, [])

    if (!hasAvailability) {
        return (
            <div className="p-3 bg-muted/30 rounded-md">
                <span className="text-sm text-muted-foreground">No availability set</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {dayOrder.map((day) => {
                const timeSlots = schedule[day]
                if (timeSlots.length === 0) return null

                return (
                    <div key={day} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-[80px]">
                            <span className="text-sm font-medium capitalize">{dayNames[day]}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {timeSlots.map((slot, index) => {
                                // Only convert times on the client side to prevent hydration mismatch
                                const displayStartTime = isClient
                                    ? convertUtcTimeToLocal(slot.start, userTimezone)
                                    : slot.start
                                const displayEndTime = isClient
                                    ? convertUtcTimeToLocal(slot.end, userTimezone)
                                    : slot.end

                                return (
                                    <div key={index} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md">
                                        <Clock className="h-3 w-3 text-primary" />
                                        <span className="text-xs font-medium">
                                            {displayStartTime} - {displayEndTime}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
} 