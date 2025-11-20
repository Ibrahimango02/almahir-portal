"use client"

import { useEffect, useState } from 'react'
import { useTimezone } from '@/contexts/TimezoneContext'
import { convertUtcTimeToLocal } from '@/lib/utils/timezone'

interface ClassTimeDisplayProps {
    utcTime: string
    className?: string
}

export function ClassTimeDisplay({ utcTime, className }: ClassTimeDisplayProps) {
    const { timezone } = useTimezone()
    const [mounted, setMounted] = useState(false)
    const [displayTime, setDisplayTime] = useState(utcTime)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && timezone && timezone !== 'UTC') {
            try {
                const localTime = convertUtcTimeToLocal(utcTime, timezone)
                setDisplayTime(localTime)
            } catch (error) {
                console.error('Error converting time:', error)
                setDisplayTime(utcTime)
            }
        } else if (mounted) {
            // If timezone is not yet loaded, show UTC time temporarily
            setDisplayTime(utcTime)
        }
    }, [mounted, timezone, utcTime])

    return <span className={className}>{displayTime}</span>
}

