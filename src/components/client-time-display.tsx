"use client"

import { useEffect, useState } from 'react'
import { useTimezone } from '@/contexts/TimezoneContext'
import { formatInTimeZone } from 'date-fns-tz'

interface ClientTimeDisplayProps {
    date: Date
    format?: string
    className?: string
}

export function ClientTimeDisplay({ date, format = 'h:mm a', className }: ClientTimeDisplayProps) {
    const { timezone } = useTimezone()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // During SSR and initial render, show a placeholder or loading state
    if (!mounted) {
        return <span className={className}>--:--</span>
    }

    // Once mounted, show the actual time in the user's timezone
    const formattedTime = formatInTimeZone(date, timezone, format)

    return <span className={className}>{formattedTime}</span>
} 