"use client"

import { Calendar } from "lucide-react"
import { useEffect, useState } from "react"

export function ClientDateDisplay() {
    const [currentDate, setCurrentDate] = useState<string>("")

    useEffect(() => {
        // Set initial date
        const updateDate = () => {
            const date = new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })
            setCurrentDate(date)
        }

        updateDate()

        // Update date every minute to keep it current
        const interval = setInterval(updateDate, 60000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{currentDate}</span>
        </div>
    )
} 