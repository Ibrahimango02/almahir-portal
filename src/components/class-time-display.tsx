"use client"

import { useEffect, useState } from 'react'
import { useTimezone } from '@/contexts/TimezoneContext'
import { combineDateTimeToUtc } from '@/lib/utils/timezone'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

interface ClassTimeDisplayProps {
    localTime: string // Local time in HH:MM format (in class timezone)
    classTimezone: string // IANA timezone identifier for the class (e.g., 'America/New_York')
    className?: string
}

export function ClassTimeDisplay({ localTime, classTimezone, className }: ClassTimeDisplayProps) {
    const { timezone: userTimezone } = useTimezone()
    const [mounted, setMounted] = useState(false)
    const [displayTime, setDisplayTime] = useState(localTime)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && userTimezone && classTimezone) {
            try {
                // Get today's date as reference
                const today = new Date()
                const dateStr = format(today, 'yyyy-MM-dd')
                
                // Convert from class timezone to UTC
                const utcDate = combineDateTimeToUtc(
                    dateStr,
                    `${localTime}:00`,
                    classTimezone
                )
                
                // Convert from UTC to user's timezone
                const userTzDate = toZonedTime(utcDate, userTimezone)
                
                // Format as 12-hour time
                const userHours = userTzDate.getHours()
                const userMinutes = userTzDate.getMinutes()
                const hour12 = userHours === 0 ? 12 : userHours > 12 ? userHours - 12 : userHours
                const ampm = userHours >= 12 ? 'PM' : 'AM'
                
                const formattedTime = `${hour12}:${String(userMinutes).padStart(2, '0')} ${ampm}`
                setDisplayTime(formattedTime)
            } catch (error) {
                console.error('Error converting time:', error)
                // Fallback: just format the original time
                const [hours, minutes] = localTime.split(':').map(Number)
                const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
                const ampm = hours >= 12 ? 'PM' : 'AM'
                setDisplayTime(`${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`)
            }
        } else if (mounted) {
            // If timezone is not yet loaded, format the local time
            const [hours, minutes] = localTime.split(':').map(Number)
            const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
            const ampm = hours >= 12 ? 'PM' : 'AM'
            setDisplayTime(`${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`)
        }
    }, [mounted, userTimezone, classTimezone, localTime])

    return <span className={className}>{displayTime}</span>
}

