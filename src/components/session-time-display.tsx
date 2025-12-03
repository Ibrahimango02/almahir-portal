"use client"

import { useEffect, useState } from 'react'
import { useTimezone } from '@/contexts/TimezoneContext'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'

interface SessionTimeDisplayProps {
    dateString: string
    format?: string
    className?: string
    showActual?: boolean
    actualDateString?: string
}

interface SessionDateDisplayProps {
    dateString: string
    format?: string
    className?: string
}

export function SessionTimeDisplay({
    dateString,
    format = 'hh:mm a',
    className = '',
    showActual = false,
    actualDateString
}: SessionTimeDisplayProps) {
    const { timezone } = useTimezone()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // During SSR, show a placeholder that matches the expected format length
        return (
            <div className={className}>
                <span className="text-sm text-gray-900">--:-- --</span>
                {showActual && actualDateString && (
                    <span className="text-xs text-gray-500 ml-1">(actual: --:-- --)</span>
                )}
            </div>
        )
    }

    try {
        const date = parseISO(dateString)
        const formattedTime = formatInTimeZone(date, timezone, format)

        let actualTimeDisplay = null
        if (showActual && actualDateString) {
            const actualDate = parseISO(actualDateString)
            const formattedActual = formatInTimeZone(actualDate, timezone, format)
            actualTimeDisplay = (
                <span className="text-xs text-gray-500 ml-1">
                    (actual: {formattedActual})
                </span>
            )
        }

        return (
            <div className={className}>
                <span className="text-sm text-gray-900">{formattedTime}</span>
                {actualTimeDisplay}
            </div>
        )
    } catch (error) {
        console.error('Error formatting time:', error)
        return (
            <div className={className}>
                <span className="text-sm text-gray-900">Invalid Date</span>
            </div>
        )
    }
}

export function SessionDateDisplay({
    dateString,
    format = 'MMMM d, yyyy',
    className = ''
}: SessionDateDisplayProps) {
    const { timezone } = useTimezone()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // During SSR, show a placeholder
        return (
            <div className={className}>
                <span className="text-sm text-gray-900">-- --, ----</span>
            </div>
        )
    }

    try {
        const date = parseISO(dateString)
        const formattedDate = formatInTimeZone(date, timezone, format)

        return (
            <div className={className}>
                <span className="text-sm text-gray-900">{formattedDate}</span>
            </div>
        )
    } catch (error) {
        console.error('Error formatting date:', error)
        return (
            <div className={className}>
                <span className="text-sm text-gray-900">Invalid Date</span>
            </div>
        )
    }
}

