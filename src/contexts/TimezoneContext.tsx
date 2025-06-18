"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getUserTimezone } from '@/lib/utils/timezone'

interface TimezoneContextType {
    timezone: string
    setTimezone: (timezone: string) => void
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

const DEFAULT_TIMEZONE = 'UTC'

export function TimezoneProvider({ children }: { children: ReactNode }) {
    const [timezone, setTimezone] = useState<string>(DEFAULT_TIMEZONE)

    useEffect(() => {
        // Get user's timezone on client side
        const userTz = getUserTimezone()
        setTimezone(userTz)
    }, [])

    return (
        <TimezoneContext.Provider value={{ timezone, setTimezone }}>
            {children}
        </TimezoneContext.Provider>
    )
}

export function useTimezone() {
    const context = useContext(TimezoneContext)
    if (context === undefined) {
        throw new Error('useTimezone must be used within a TimezoneProvider')
    }
    return context
} 