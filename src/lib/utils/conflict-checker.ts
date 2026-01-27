import { TimeSlot, WeeklySchedule } from '@/types'
import { getSessionsByTeacherId, getSessionsByStudentId } from '@/lib/get/get-classes'
import { getTeacherAvailability } from '@/lib/get/get-teachers'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'

export interface ConflictInfo {
    hasConflict: boolean
    conflicts: Array<{
        type: 'schedule' | 'availability'
        day: string
        message: string
        existingTime?: string
        newTime?: string
    }>
}

/**
 * Convert UTC time to local time in HH:mm format for comparison
 * Used for teacher availability which is stored in UTC
 */
function convertUtcTimeToLocalForComparison(utcTime: string, timezone: string): string {
    try {
        // Create a date object for today with the UTC time
        const today = new Date()
        const [hours, minutes] = utcTime.split(':').map(Number)

        // Create a UTC date object
        const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes))

        // Convert to target timezone and format as HH:mm
        return formatInTimeZone(utcDate, timezone, 'HH:mm')
    } catch (error) {
        console.error('Error converting UTC time to local for comparison:', error)
        return utcTime // Fallback to original time if conversion fails
    }
}

/**
 * Convert a local time from one timezone to another timezone
 * This is used for comparing class times that are stored in local format
 * @param localTime - Time in HH:mm format in sourceTimezone
 * @param sourceTimezone - IANA timezone of the source time
 * @param targetTimezone - IANA timezone to convert to
 * @returns Time in HH:mm format in targetTimezone
 */
function convertLocalTimeBetweenTimezones(
    localTime: string,
    sourceTimezone: string,
    targetTimezone: string
): string {
    try {
        // If timezones are the same, no conversion needed
        if (sourceTimezone === targetTimezone) {
            return localTime
        }

        // Create a date object for today with the local time in the source timezone
        const today = new Date()
        const [hours, minutes] = localTime.split(':').map(Number)

        // Create a date object for today with the local time
        const dateString = format(today, 'yyyy-MM-dd')
        const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
        const dateTimeString = `${dateString}T${timeString}`

        // Parse the date string and treat it as if it's in the source timezone
        const localDate = new Date(dateTimeString)

        // Convert from source timezone to UTC (treating localDate as if it's in sourceTimezone)
        const utcDate = fromZonedTime(localDate, sourceTimezone)

        // Format in target timezone as HH:mm
        return formatInTimeZone(utcDate, targetTimezone, 'HH:mm')
    } catch (error) {
        console.error('Error converting local time between timezones:', error)
        return localTime // Fallback to original time if conversion fails
    }
}

/**
 * Convert time string (HH:MM) to minutes for comparison
 */
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Check if two time slots overlap
 */
function doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    const start1 = timeToMinutes(slot1.start)
    const end1 = timeToMinutes(slot1.end)
    const start2 = timeToMinutes(slot2.start)
    const end2 = timeToMinutes(slot2.end)

    // Two slots overlap if one starts before the other ends and ends after the other starts
    return start1 < end2 && start2 < end1
}

/**
 * Convert day name to lowercase for consistency
 */
function normalizeDayName(day: string): string {
    return day.toLowerCase()
}

/**
 * Get the day name from a date in UTC
 */
function getDayFromDate(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    // Use UTC methods to get the day, since session dates are stored in UTC
    return days[date.getUTCDay()]
}

/**
 * Check if a teacher has schedule conflicts with the proposed class sessions
 */
export async function checkTeacherScheduleConflicts(
    teacherId: string,
    classTimes: Record<string, { start: string; end: string }>,
    startDate: Date,
    endDate: Date,
    timezone: string,
    excludeClassId?: string
): Promise<ConflictInfo> {
    const conflicts: ConflictInfo['conflicts'] = []

    try {
        // Get teacher's existing sessions
        const existingSessions = await getSessionsByTeacherId(teacherId)

        // Get unique class IDs from sessions to fetch class data
        const classIds = [...new Set(existingSessions.map(s => s.class_id))]
        const supabase = createClient()
        const { data: classes } = await supabase
            .from('classes')
            .select('id, days_repeated, timezone')
            .in('id', classIds)

        // Create a map of class_id to days_repeated and timezone for quick lookup
        const classDaysRepeatedMap = new Map(
            classes?.map(c => [c.id, c.days_repeated]) || []
        )
        const classTimezoneMap = new Map(
            classes?.map(c => [c.id, c.timezone || 'America/Toronto']) || []
        )

        // Check each day of the new class
        for (const [day, time] of Object.entries(classTimes)) {
            const normalizedDay = normalizeDayName(day)

            // Check existing sessions for conflicts on this day
            for (const session of existingSessions) {
                // Skip sessions from the class being edited
                if (excludeClassId && session.class_id === excludeClassId) {
                    continue
                }

                const sessionDate = new Date(session.start_date)
                const sessionEndDate = new Date(session.end_date)
                const now = new Date()

                // Skip past sessions - only check future sessions
                if (sessionEndDate < now) {
                    continue
                }

                const sessionDay = getDayFromDate(sessionDate)

                // Only check sessions that fall within the class date range
                if (sessionDay === normalizedDay &&
                    sessionDate >= startDate &&
                    sessionDate <= endDate) {

                    // Get the class's days_repeated to find the recurring time for this day
                    const daysRepeated = classDaysRepeatedMap.get(session.class_id)
                    let existingStartTime: string
                    let existingEndTime: string

                    if (daysRepeated && typeof daysRepeated === 'object') {
                        // Get the time slot for this day from days_repeated
                        const dayTimeSlot = (daysRepeated as Record<string, { start: string; end: string }>)[normalizedDay]

                        if (dayTimeSlot && dayTimeSlot.start && dayTimeSlot.end) {
                            // days_repeated times are stored in LOCAL format (not UTC)
                            // Get the existing class's timezone
                            const existingClassTimezone = classTimezoneMap.get(session.class_id) || 'America/Toronto'

                            // Convert the existing class's local time to the new class's timezone for comparison
                            existingStartTime = convertLocalTimeBetweenTimezones(
                                dayTimeSlot.start,
                                existingClassTimezone,
                                timezone
                            )
                            existingEndTime = convertLocalTimeBetweenTimezones(
                                dayTimeSlot.end,
                                existingClassTimezone,
                                timezone
                            )
                        } else {
                            // Fallback to session timestamp if days_repeated doesn't have this day
                            existingStartTime = formatInTimeZone(sessionDate, timezone, 'HH:mm')
                            const sessionEndDate = new Date(session.end_date)
                            existingEndTime = formatInTimeZone(sessionEndDate, timezone, 'HH:mm')
                        }
                    } else {
                        // Fallback to session timestamp if days_repeated is not available
                        existingStartTime = formatInTimeZone(sessionDate, timezone, 'HH:mm')
                        const sessionEndDate = new Date(session.end_date)
                        existingEndTime = formatInTimeZone(sessionEndDate, timezone, 'HH:mm')
                    }

                    // Check for overlap
                    const newSlot: TimeSlot = { start: time.start, end: time.end }
                    const existingSlot: TimeSlot = { start: existingStartTime, end: existingEndTime }

                    if (doTimeSlotsOverlap(newSlot, existingSlot)) {
                        conflicts.push({
                            type: 'schedule',
                            day: day.charAt(0).toUpperCase() + day.slice(1),
                            message: `Conflicts with existing class "${session.title}"`,
                            existingTime: `${existingStartTime} - ${existingEndTime}`,
                            newTime: `${time.start} - ${time.end}`
                        })
                    }
                }
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts
        }
    } catch (error) {
        console.error('Error checking teacher schedule conflicts:', error)
        return {
            hasConflict: false,
            conflicts: []
        }
    }
}

/**
 * Check if a teacher has availability conflicts with the proposed class sessions
 */
export async function checkTeacherAvailabilityConflicts(
    teacherId: string,
    classTimes: Record<string, { start: string; end: string }>,
    timezone: string
): Promise<ConflictInfo> {
    const conflicts: ConflictInfo['conflicts'] = []

    try {
        // Get teacher's availability
        const availability = await getTeacherAvailability(teacherId)

        if (!availability) {
            // If no availability is set, assume no conflicts
            return {
                hasConflict: false,
                conflicts: []
            }
        }

        // Check each day of the new class
        for (const [day, time] of Object.entries(classTimes)) {
            const normalizedDay = normalizeDayName(day) as keyof WeeklySchedule
            const dayAvailability = availability.weekly_schedule[normalizedDay]

            if (dayAvailability.length === 0) {
                // No availability set for this day
                conflicts.push({
                    type: 'availability',
                    day: day.charAt(0).toUpperCase() + day.slice(1),
                    message: 'No availability set for this day'
                })
                continue
            }

            // Check if the new time slot fits within any availability slot
            const newSlot: TimeSlot = { start: time.start, end: time.end }
            let hasMatchingAvailability = false
            const teacherAvailabilityTimes: string[] = []

            for (const availabilitySlot of dayAvailability) {
                // Convert availability times from UTC to local for comparison
                const availabilityStartLocal = convertUtcTimeToLocalForComparison(availabilitySlot.start, timezone)
                const availabilityEndLocal = convertUtcTimeToLocalForComparison(availabilitySlot.end, timezone)

                const availabilitySlotLocal: TimeSlot = {
                    start: availabilityStartLocal,
                    end: availabilityEndLocal
                }

                // Store teacher availability times for conflict message
                teacherAvailabilityTimes.push(`${availabilityStartLocal} - ${availabilityEndLocal}`)

                // Check if the new slot is completely within the availability slot
                const newStart = timeToMinutes(newSlot.start)
                const newEnd = timeToMinutes(newSlot.end)
                const availStart = timeToMinutes(availabilitySlotLocal.start)
                const availEnd = timeToMinutes(availabilitySlotLocal.end)

                if (newStart >= availStart && newEnd <= availEnd) {
                    hasMatchingAvailability = true
                    break
                }
            }

            if (!hasMatchingAvailability) {
                conflicts.push({
                    type: 'availability',
                    day: day.charAt(0).toUpperCase() + day.slice(1),
                    message: 'Class time is outside of teacher availability',
                    existingTime: teacherAvailabilityTimes.join(', ')
                })
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts
        }
    } catch (error) {
        console.error('Error checking teacher availability conflicts:', error)
        return {
            hasConflict: false,
            conflicts: []
        }
    }
}

/**
 * Check both schedule and availability conflicts for a teacher
 */
export async function checkTeacherConflicts(
    teacherId: string,
    classTimes: Record<string, { start: string; end: string }>,
    startDate: Date,
    endDate: Date,
    timezone: string,
    excludeClassId?: string
): Promise<ConflictInfo> {
    const [scheduleConflicts, availabilityConflicts] = await Promise.all([
        checkTeacherScheduleConflicts(teacherId, classTimes, startDate, endDate, timezone, excludeClassId),
        checkTeacherAvailabilityConflicts(teacherId, classTimes, timezone)
    ])

    const allConflicts = [
        ...scheduleConflicts.conflicts,
        ...availabilityConflicts.conflicts
    ]

    return {
        hasConflict: allConflicts.length > 0,
        conflicts: allConflicts
    }
}

/**
 * Check conflicts for multiple teachers
 */
export async function checkMultipleTeacherConflicts(
    teacherIds: string[],
    classTimes: Record<string, { start: string; end: string }>,
    startDate: Date,
    endDate: Date,
    timezone: string,
    excludeClassId?: string
): Promise<Record<string, ConflictInfo>> {
    const results: Record<string, ConflictInfo> = {}

    await Promise.all(
        teacherIds.map(async (teacherId) => {
            results[teacherId] = await checkTeacherConflicts(
                teacherId,
                classTimes,
                startDate,
                endDate,
                timezone,
                excludeClassId
            )
        })
    )

    return results
}

/**
 * Check if a student has schedule conflicts with the proposed class sessions
 */
export async function checkStudentScheduleConflicts(
    studentId: string,
    classTimes: Record<string, { start: string; end: string }>,
    startDate: Date,
    endDate: Date,
    timezone: string,
    excludeClassId?: string
): Promise<ConflictInfo> {
    const conflicts: ConflictInfo['conflicts'] = []

    try {
        // Get student's existing sessions
        const existingSessions = await getSessionsByStudentId(studentId)

        // Get unique class IDs from sessions to fetch class data
        const classIds = [...new Set(existingSessions.map(s => s.class_id))]
        const supabase = createClient()
        const { data: classes } = await supabase
            .from('classes')
            .select('id, days_repeated, timezone')
            .in('id', classIds)

        // Create a map of class_id to days_repeated and timezone for quick lookup
        const classDaysRepeatedMap = new Map(
            classes?.map(c => [c.id, c.days_repeated]) || []
        )
        const classTimezoneMap = new Map(
            classes?.map(c => [c.id, c.timezone || 'America/Toronto']) || []
        )

        // Check each day of the new class
        for (const [day, time] of Object.entries(classTimes)) {
            const normalizedDay = normalizeDayName(day)

            // Check existing sessions for conflicts on this day
            for (const session of existingSessions) {
                // Skip sessions from the class being edited
                if (excludeClassId && session.class_id === excludeClassId) {
                    continue
                }

                const sessionDate = new Date(session.start_date)
                const sessionEndDate = new Date(session.end_date)
                const now = new Date()

                // Skip past sessions - only check future sessions
                if (sessionEndDate < now) {
                    continue
                }

                const sessionDay = getDayFromDate(sessionDate)

                // Only check sessions that fall within the class date range
                if (sessionDay === normalizedDay &&
                    sessionDate >= startDate &&
                    sessionDate <= endDate) {

                    // Get the class's days_repeated to find the recurring time for this day
                    const daysRepeated = classDaysRepeatedMap.get(session.class_id)
                    let existingStartTime: string
                    let existingEndTime: string

                    if (daysRepeated && typeof daysRepeated === 'object') {
                        // Get the time slot for this day from days_repeated
                        const dayTimeSlot = (daysRepeated as Record<string, { start: string; end: string }>)[normalizedDay]

                        if (dayTimeSlot && dayTimeSlot.start && dayTimeSlot.end) {
                            // days_repeated times are stored in LOCAL format (not UTC)
                            // Get the existing class's timezone
                            const existingClassTimezone = classTimezoneMap.get(session.class_id) || 'America/Toronto'

                            // Convert the existing class's local time to the new class's timezone for comparison
                            existingStartTime = convertLocalTimeBetweenTimezones(
                                dayTimeSlot.start,
                                existingClassTimezone,
                                timezone
                            )
                            existingEndTime = convertLocalTimeBetweenTimezones(
                                dayTimeSlot.end,
                                existingClassTimezone,
                                timezone
                            )
                        } else {
                            // Fallback to session timestamp if days_repeated doesn't have this day
                            existingStartTime = formatInTimeZone(sessionDate, timezone, 'HH:mm')
                            const sessionEndDate = new Date(session.end_date)
                            existingEndTime = formatInTimeZone(sessionEndDate, timezone, 'HH:mm')
                        }
                    } else {
                        // Fallback to session timestamp if days_repeated is not available
                        existingStartTime = formatInTimeZone(sessionDate, timezone, 'HH:mm')
                        const sessionEndDate = new Date(session.end_date)
                        existingEndTime = formatInTimeZone(sessionEndDate, timezone, 'HH:mm')
                    }

                    // Check for overlap
                    const newSlot: TimeSlot = { start: time.start, end: time.end }
                    const existingSlot: TimeSlot = { start: existingStartTime, end: existingEndTime }

                    if (doTimeSlotsOverlap(newSlot, existingSlot)) {
                        conflicts.push({
                            type: 'schedule',
                            day: day.charAt(0).toUpperCase() + day.slice(1),
                            message: `Conflicts with existing class "${session.title}"`,
                            existingTime: `${existingStartTime} - ${existingEndTime}`,
                            newTime: `${time.start} - ${time.end}`
                        })
                    }
                }
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts
        }
    } catch (error) {
        console.error('Error checking student schedule conflicts:', error)
        return {
            hasConflict: false,
            conflicts: []
        }
    }
}

/**
 * Check schedule conflicts for multiple students
 */
export async function checkMultipleStudentConflicts(
    studentIds: string[],
    classTimes: Record<string, { start: string; end: string }>,
    startDate: Date,
    endDate: Date,
    timezone: string,
    excludeClassId?: string
): Promise<Record<string, ConflictInfo>> {
    const results: Record<string, ConflictInfo> = {}

    await Promise.all(
        studentIds.map(async (studentId) => {
            const conflicts = await checkStudentScheduleConflicts(
                studentId,
                classTimes,
                startDate,
                endDate,
                timezone,
                excludeClassId
            )
            results[studentId] = conflicts
        })
    )

    return results
}

/**
 * Test function to verify availability conflict checking
 * This can be called from the browser console for debugging
 */
export function testAvailabilityConflictChecking() {
    const timezone = "America/New_York" // Example timezone

    // Test the conversion function
    const convertedStart = convertUtcTimeToLocalForComparison("11:00", timezone)
    const convertedEnd = convertUtcTimeToLocalForComparison("17:00", timezone)

    console.log("Test conversion:", {
        original: { start: "11:00", end: "17:00" },
        converted: { start: convertedStart, end: convertedEnd }
    })

    // Test the time comparison
    const newStart = timeToMinutes("12:00") // 720 minutes
    const newEnd = timeToMinutes("13:00")   // 780 minutes
    const availStart = timeToMinutes(convertedStart)
    const availEnd = timeToMinutes(convertedEnd)

    const isWithin = newStart >= availStart && newEnd <= availEnd

    console.log("Test comparison:", {
        newSlot: { start: "12:00", end: "13:00" },
        availabilitySlot: { start: convertedStart, end: convertedEnd },
        newStart,
        newEnd,
        availStart,
        availEnd,
        isWithin
    })

    return isWithin
} 