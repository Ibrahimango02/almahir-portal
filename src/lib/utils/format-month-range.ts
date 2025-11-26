// Function to convert month numbers to month names
export const formatMonthRange = (monthRange: string): string => {
    if (!monthRange) return '-'

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const months = monthRange.split('-')

    if (months.length === 1) {
        // Single month case - check if it includes year (e.g., "8/2025")
        const part = months[0]
        if (part.includes('/')) {
            // Format with year: "8/2025"
            const [month, year] = part.split('/').map(Number)
            const monthIndex = month - 1
            if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
                return monthRange // Return original if invalid
            }
            return `${monthNames[monthIndex]} ${year}`
        } else {
            // Legacy format without year (e.g., "8") - for backward compatibility
            const month = parseInt(part) - 1
            if (isNaN(month) || month < 0 || month > 11) {
                return monthRange // Return original if invalid
            }
            return monthNames[month]
        }
    } else if (months.length === 2) {
        // Range case - check if both parts include year
        const startPart = months[0]
        const endPart = months[1]

        if (startPart.includes('/') && endPart.includes('/')) {
            // Both parts have year format: "8/2025-8/2026" or "7/2025-8/2025"
            const [startMonth, startYear] = startPart.split('/').map(Number)
            const [endMonth, endYear] = endPart.split('/').map(Number)

            const startMonthIndex = startMonth - 1
            const endMonthIndex = endMonth - 1

            if (isNaN(startMonthIndex) || isNaN(endMonthIndex) || startMonthIndex < 0 || startMonthIndex > 11 || endMonthIndex < 0 || endMonthIndex > 11) {
                return monthRange // Return original if invalid
            }

            const startName = monthNames[startMonthIndex]
            const endName = monthNames[endMonthIndex]

            // Always include year for both months
            return `${startName} ${startYear} - ${endName} ${endYear}`
        } else {
            // Legacy format without years (e.g., "7-8") - for backward compatibility
            const startMonth = parseInt(startPart) - 1
            const endMonth = parseInt(endPart) - 1

            if (isNaN(startMonth) || isNaN(endMonth) || startMonth < 0 || startMonth > 11 || endMonth < 0 || endMonth > 11) {
                return monthRange // Return original if invalid
            }

            const startName = monthNames[startMonth]
            const endName = monthNames[endMonth]

            return startMonth === endMonth ? startName : `${startName} - ${endName}`
        }
    }

    return monthRange // Return original for any other format
} 