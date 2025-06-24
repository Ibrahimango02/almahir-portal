import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { parseISO, isValid } from 'date-fns'

// Default timezone - you can make this configurable
const DEFAULT_TIMEZONE = 'UTC'

/**
 * Get user's timezone from browser or use default
 * NOTE: This function should only be used on the client side to avoid hydration mismatches
 */
export function getUserTimezone(): string {
    if (typeof window !== 'undefined') {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
    }
    return DEFAULT_TIMEZONE
}

/**
 * Get user's timezone safely for SSR - always returns UTC to prevent hydration mismatches
 * Use this for server-side rendering, then update with actual timezone on client
 */
export function getSafeTimezone(): string {
    return DEFAULT_TIMEZONE
}

/**
 * Convert a UTC date to user's local timezone
 */
export function utcToLocal(utcDate: string | Date, timezone?: string): Date {
    const tz = timezone || getSafeTimezone()

    if (typeof utcDate === 'string') {
        const parsed = parseISO(utcDate)
        if (!isValid(parsed)) {
            throw new Error(`Invalid date string: ${utcDate}`)
        }
        return toZonedTime(parsed, tz)
    }

    return toZonedTime(utcDate, tz)
}

/**
 * Convert a local date to UTC
 */
export function localToUtc(localDate: Date, timezone?: string): Date {
    const tz = timezone || getSafeTimezone()

    // Create a date string in the target timezone
    const dateString = localDate.toLocaleString("en-US", { timeZone: tz })

    // Create a new date object from this string
    // This gives us a date that represents the same moment but in the target timezone
    const dateInTargetTz = new Date(dateString)

    // Calculate the difference between the original date and the timezone-adjusted date
    // This difference is the offset we need to apply
    const offsetMs = localDate.getTime() - dateInTargetTz.getTime()

    // Apply the offset to get the UTC time
    const utcDate = new Date(localDate.getTime() + offsetMs)

    return utcDate
}

/**
 * Format a date in user's timezone
 */
export function formatInUserTimezone(
    date: string | Date,
    formatString: string,
    timezone?: string
): string {
    const tz = timezone || getSafeTimezone()

    if (typeof date === 'string') {
        const parsed = parseISO(date)
        if (!isValid(parsed)) {
            return 'Invalid Date'
        }
        return formatInTimeZone(parsed, tz, formatString)
    }

    return formatInTimeZone(date, tz, formatString)
}

/**
 * Parse and combine date and time strings, then convert to UTC
 */
export function combineDateTimeToUtc(
    dateStr: string,
    timeStr: string,
    timezone?: string
): Date {
    const tz = timezone || getSafeTimezone()

    // Parse the date (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number)
    if (!year || !month || !day) {
        throw new Error(`Invalid date format: ${dateStr}`)
    }

    // Parse the time (HH:MM:SS)
    const cleanTime = timeStr.replace(/(-|\+)\d{2}.*$/, '')
    const [hours, minutes, seconds = 0] = cleanTime.split(':').map(Number)

    // Create local date
    const localDate = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds)

    // Convert to UTC using the same approach as localToUtc
    const dateString = localDate.toLocaleString("en-US", { timeZone: tz })
    const dateInTargetTz = new Date(dateString)
    const offsetMs = localDate.getTime() - dateInTargetTz.getTime()
    const utcDate = new Date(localDate.getTime() + offsetMs)

    return utcDate
}

/**
 * Extract date and time from UTC datetime for display
 */
export function extractDateAndTime(
    utcDateTime: string | Date,
    timezone?: string
): { date: string; time: string } {
    const tz = timezone || getSafeTimezone()

    if (typeof utcDateTime === 'string') {
        const parsed = parseISO(utcDateTime)
        if (!isValid(parsed)) {
            throw new Error(`Invalid date string: ${utcDateTime}`)
        }
        return {
            date: formatInTimeZone(parsed, tz, 'yyyy-MM-dd'),
            time: formatInTimeZone(parsed, tz, 'HH:mm:ss')
        }
    }

    return {
        date: formatInTimeZone(utcDateTime, tz, 'yyyy-MM-dd'),
        time: formatInTimeZone(utcDateTime, tz, 'HH:mm:ss')
    }
}

/**
 * Format datetime for display in user's timezone
 */
export function formatDateTime(
    date: string | Date,
    formatString: string = 'PPP p',
    timezone?: string
): string {
    return formatInUserTimezone(date, formatString, timezone)
}

/**
 * Format time for display in user's timezone
 */
export function formatTime(
    date: string | Date,
    formatString: string = 'HH:mm',
    timezone?: string
): string {
    return formatInUserTimezone(date, formatString, timezone)
}

/**
 * Format date for display in user's timezone
 */
export function formatDate(
    date: string | Date,
    formatString: string = 'PPP',
    timezone?: string
): string {
    return formatInUserTimezone(date, formatString, timezone)
}

/**
 * Get current time in user's timezone
 */
export function getCurrentTimeInTimezone(timezone?: string): Date {
    const tz = timezone || getSafeTimezone()
    return toZonedTime(new Date(), tz)
}

/**
 * Check if a date is today in user's timezone
 */
export function isTodayInTimezone(date: string | Date, timezone?: string): boolean {
    const tz = timezone || getSafeTimezone()
    const localDate = utcToLocal(date, tz)
    const today = getCurrentTimeInTimezone(tz)

    return localDate.toDateString() === today.toDateString()
}

/**
 * Convert a UTC timestamp (timestamptz format) to local user timezone
 * @param utcTimestamp - UTC timestamp in format YYYY-MM-DD HH:MM:SS+NN
 * @returns Date object in user's local timezone
 */
export function convertUtcTimestampToLocal(utcTimestamp: string): Date {
    try {
        // Parse the UTC timestamp string
        const parsed = parseISO(utcTimestamp)
        if (!isValid(parsed)) {
            throw new Error(`Invalid timestamp format: ${utcTimestamp}`)
        }

        // Get user's timezone
        const userTimezone = getUserTimezone()

        // Convert to user's local timezone
        return toZonedTime(parsed, userTimezone)
    } catch (error) {
        console.error('Error converting UTC timestamp to local:', error)
        // Fallback to original timestamp if conversion fails
        return new Date(utcTimestamp)
    }
}

// Helper function to convert UTC time to local time
export function convertUtcTimeToLocal(utcTime: string, teacherTimezone?: string): string {
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

/**
 * Convert UTC datetime string to local timezone display format
 * Specifically for full datetime strings (ISO format)
 * @param utcDateTime - UTC datetime string in ISO format
 * @param timezone - Optional timezone to convert to, defaults to user's timezone
 * @returns Formatted time string in local timezone
 */
export function convertUtcDateTimeToLocal(utcDateTime: string, timezone?: string): string {
    try {
        const parsed = parseISO(utcDateTime)
        if (!isValid(parsed)) {
            throw new Error(`Invalid datetime format: ${utcDateTime}`)
        }

        const targetTimezone = timezone || getUserTimezone()
        return formatTime(parsed, 'h:mm a', targetTimezone)
    } catch (error) {
        console.error('Error converting datetime:', error)
        return 'Invalid Time'
    }
} 