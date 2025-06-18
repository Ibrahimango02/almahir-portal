import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { format, parseISO, isValid } from 'date-fns'

// Default timezone - you can make this configurable
const DEFAULT_TIMEZONE = 'UTC'

/**
 * Get user's timezone from browser or use default
 */
export function getUserTimezone(): string {
    if (typeof window !== 'undefined') {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
    }
    return DEFAULT_TIMEZONE
}

/**
 * Convert a UTC date to user's local timezone
 */
export function utcToLocal(utcDate: string | Date, timezone?: string): Date {
    const tz = timezone || getUserTimezone()

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
    const tz = timezone || getUserTimezone()

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
    const tz = timezone || getUserTimezone()

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
    const tz = timezone || getUserTimezone()

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
    const tz = timezone || getUserTimezone()

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
    const tz = timezone || getUserTimezone()
    return toZonedTime(new Date(), tz)
}

/**
 * Check if a date is today in user's timezone
 */
export function isTodayInTimezone(date: string | Date, timezone?: string): boolean {
    const tz = timezone || getUserTimezone()
    const localDate = utcToLocal(date, tz)
    const today = getCurrentTimeInTimezone(tz)

    return localDate.toDateString() === today.toDateString()
} 