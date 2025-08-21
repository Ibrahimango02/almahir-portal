// Function to convert month numbers to month names
export const formatMonthRange = (monthRange: string): string => {
    if (!monthRange) return '-'

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const months = monthRange.split('-')

    if (months.length === 1) {
        // Single month case (e.g., "8")
        const month = parseInt(months[0]) - 1 // Convert to 0-based index
        if (isNaN(month) || month < 0 || month > 11) {
            return monthRange // Return original if invalid
        }
        return monthNames[month]
    } else if (months.length === 2) {
        // Check if this is a cross-year range (e.g., "8/2025-8/2026")
        const startPart = months[0]
        const endPart = months[1]

        if (startPart.includes('/') && endPart.includes('/')) {
            // Cross-year format: "8/2025-8/2026"
            const [startMonth, startYear] = startPart.split('/').map(Number)
            const [endMonth, endYear] = endPart.split('/').map(Number)

            const startMonthIndex = startMonth - 1
            const endMonthIndex = endMonth - 1

            if (isNaN(startMonthIndex) || isNaN(endMonthIndex) || startMonthIndex < 0 || startMonthIndex > 11 || endMonthIndex < 0 || endMonthIndex > 11) {
                return monthRange // Return original if invalid
            }

            const startName = monthNames[startMonthIndex]
            const endName = monthNames[endMonthIndex]

            return `${startName} ${startYear} - ${endName} ${endYear}`
        } else {
            // Same year range case (e.g., "7-8")
            const startMonth = parseInt(months[0]) - 1 // Convert to 0-based index
            const endMonth = parseInt(months[1]) - 1

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