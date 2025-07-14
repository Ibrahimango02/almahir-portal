/**
 * Formats a PostgreSQL interval string into a human-readable format
 * @param interval - PostgreSQL interval string (e.g., "01:30:00" or "1 day 02:30:00")
 * @returns Formatted duration string
 */
export function formatDuration(interval: string | null): string {
    if (!interval) return 'N/A'

    // Parse the interval string
    const parts = interval.split(' ')
    let hours = 0
    let minutes = 0
    let seconds = 0

    if (parts.length === 1) {
        // Format: "HH:MM:SS" or "HH:MM"
        const timeParts = parts[0].split(':')
        if (timeParts.length >= 2) {
            hours = parseInt(timeParts[0]) || 0
            minutes = parseInt(timeParts[1]) || 0
            if (timeParts.length === 3) {
                seconds = parseInt(timeParts[2]) || 0
            }
        }
    } else {
        // Format: "X days HH:MM:SS" or "X days HH:MM"
        const timePart = parts[parts.length - 1]
        const timeParts = timePart.split(':')
        if (timeParts.length >= 2) {
            hours = parseInt(timeParts[0]) || 0
            minutes = parseInt(timeParts[1]) || 0
            if (timeParts.length === 3) {
                seconds = parseInt(timeParts[2]) || 0
            }
        }

        // Add days if present
        if (parts.length > 1 && parts[0] !== '00') {
            const days = parseInt(parts[0]) || 0
            hours += days * 24
        }
    }

    // Format the output
    if (hours > 0) {
        if (minutes > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${hours}h`
    } else if (minutes > 0) {
        if (seconds > 0) {
            return `${minutes}m ${seconds}s`
        }
        return `${minutes}m`
    } else if (seconds > 0) {
        return `${seconds}s`
    } else {
        return '0m'
    }
}

/**
 * Converts a PostgreSQL interval to total minutes
 * @param interval - PostgreSQL interval string
 * @returns Total minutes as number
 */
export function intervalToMinutes(interval: string | null): number {
    if (!interval) return 0

    const parts = interval.split(' ')
    let totalMinutes = 0

    if (parts.length === 1) {
        // Format: "HH:MM:SS" or "HH:MM"
        const timeParts = parts[0].split(':')
        if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]) || 0
            const minutes = parseInt(timeParts[1]) || 0
            totalMinutes = hours * 60 + minutes
        }
    } else {
        // Format: "X days HH:MM:SS" or "X days HH:MM"
        const timePart = parts[parts.length - 1]
        const timeParts = timePart.split(':')
        if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]) || 0
            const minutes = parseInt(timeParts[1]) || 0
            totalMinutes = hours * 60 + minutes
        }

        // Add days if present
        if (parts.length > 1 && parts[0] !== '00') {
            const days = parseInt(parts[0]) || 0
            totalMinutes += days * 24 * 60
        }
    }

    return totalMinutes
}

/**
 * Converts total minutes to a formatted duration string
 * @param minutes - Total minutes
 * @returns Formatted duration string
 */
export function minutesToDuration(minutes: number): string {
    if (minutes === 0) return '0m'

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours > 0) {
        if (remainingMinutes > 0) {
            return `${hours}h ${remainingMinutes}m`
        }
        return `${hours}h`
    } else {
        return `${remainingMinutes}m`
    }
} 