"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function TimePicker({
    value,
    onValueChange,
    placeholder = "Select time",
    className,
    disabled = false
}: TimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [localHour, setLocalHour] = React.useState('')
    const [localMinute, setLocalMinute] = React.useState('')
    const [localAmpm, setLocalAmpm] = React.useState('')

    // Update local state when external value changes
    React.useEffect(() => {
        if (value) {
            const [hour, minute] = value.split(':')
            if (hour && minute) {
                const hourNum = parseInt(hour)
                let displayHour = ''
                let ampm = ''

                if (hourNum === 0) {
                    displayHour = '12'
                    ampm = 'AM'
                } else if (hourNum === 12) {
                    displayHour = '12'
                    ampm = 'PM'
                } else if (hourNum > 12) {
                    displayHour = (hourNum - 12).toString()
                    ampm = 'PM'
                } else {
                    displayHour = hourNum.toString()
                    ampm = 'AM'
                }

                setLocalHour(displayHour)
                setLocalMinute(minute)
                setLocalAmpm(ampm)
            }
        } else {
            setLocalHour('')
            setLocalMinute('')
            setLocalAmpm('')
        }
    }, [value])

    // Convert 12-hour to 24-hour format for storage
    const get24HourFormat = (hour12: string, ampm: string) => {
        if (!hour12 || !ampm) return ''
        let hourNum = parseInt(hour12)
        if (ampm === 'PM' && hourNum !== 12) hourNum += 12
        if (ampm === 'AM' && hourNum === 12) hourNum = 0
        return hourNum.toString().padStart(2, '0')
    }

    // Generate hour options (1-12)
    const hours = Array.from({ length: 12 }, (_, i) =>
        (i + 1).toString()
    )

    // Generate minute options (00-59)
    const minutes = Array.from({ length: 60 }, (_, i) =>
        i.toString().padStart(2, '0')
    )

    // AM/PM options
    const ampmOptions = ['AM', 'PM']

    const handleHourChange = (hour: string) => {
        setLocalHour(hour)
        const newHour24 = get24HourFormat(hour, localAmpm)
        const newTime = `${newHour24}:${localMinute || '00'}`
        onValueChange(newTime)
    }

    const handleMinuteChange = (minute: string) => {
        setLocalMinute(minute)
        const newHour24 = get24HourFormat(localHour, localAmpm)
        const newTime = `${newHour24}:${minute}`
        onValueChange(newTime)
    }

    const handleAmpmChange = (ampm: string) => {
        setLocalAmpm(ampm)
        const newHour24 = get24HourFormat(localHour, ampm)
        const newTime = `${newHour24}:${localMinute || '00'}`
        onValueChange(newTime)
    }

    const formatDisplayValue = (time: string) => {
        if (!time) return placeholder

        const [hour, minute] = time.split(':')
        if (!hour || !minute) return placeholder

        // Convert to 12-hour format for display
        const hourNum = parseInt(hour)
        let displayHour = ''
        let ampm = ''

        if (hourNum === 0) {
            displayHour = '12'
            ampm = 'AM'
        } else if (hourNum === 12) {
            displayHour = '12'
            ampm = 'PM'
        } else if (hourNum > 12) {
            displayHour = (hourNum - 12).toString()
            ampm = 'PM'
        } else {
            displayHour = hourNum.toString()
            ampm = 'AM'
        }

        return `${displayHour}:${minute} ${ampm}`
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {formatDisplayValue(value || '')}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <div className="flex gap-2 items-center">
                    <Select value={localHour} onValueChange={handleHourChange}>
                        <SelectTrigger className="w-16">
                            <SelectValue placeholder="HH" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                            {hours.map((hour) => (
                                <SelectItem key={hour} value={hour}>
                                    {hour}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="flex items-center text-lg font-semibold">:</span>

                    <Select value={localMinute} onValueChange={handleMinuteChange}>
                        <SelectTrigger className="w-16">
                            <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                            {minutes.map((minute) => (
                                <SelectItem key={minute} value={minute}>
                                    {minute}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={localAmpm} onValueChange={handleAmpmChange}>
                        <SelectTrigger className="w-25">
                            <SelectValue placeholder="AM/PM" />
                        </SelectTrigger>
                        <SelectContent>
                            {ampmOptions.map((ampm) => (
                                <SelectItem key={ampm} value={ampm}>
                                    {ampm}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PopoverContent>
        </Popover>
    )
} 