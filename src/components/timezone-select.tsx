"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Common timezones list - organized by region
const TIMEZONES = [
    // North America
    { value: "America/New_York", label: "Eastern Time (ET) - New York" },
    { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
    { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
    { value: "America/Phoenix", label: "Mountain Time (MST) - Phoenix" },
    { value: "America/Anchorage", label: "Alaska Time (AKT) - Anchorage" },
    { value: "America/Honolulu", label: "Hawaii Time (HST) - Honolulu" },
    { value: "America/Toronto", label: "Eastern Time (ET) - Toronto" },
    { value: "America/Vancouver", label: "Pacific Time (PT) - Vancouver" },
    { value: "America/Mexico_City", label: "Central Time (CT) - Mexico City" },

    // Europe
    { value: "Europe/London", label: "Greenwich Mean Time (GMT) - London" },
    { value: "Europe/Paris", label: "Central European Time (CET) - Paris" },
    { value: "Europe/Berlin", label: "Central European Time (CET) - Berlin" },
    { value: "Europe/Rome", label: "Central European Time (CET) - Rome" },
    { value: "Europe/Madrid", label: "Central European Time (CET) - Madrid" },
    { value: "Europe/Amsterdam", label: "Central European Time (CET) - Amsterdam" },
    { value: "Europe/Stockholm", label: "Central European Time (CET) - Stockholm" },
    { value: "Europe/Vienna", label: "Central European Time (CET) - Vienna" },
    { value: "Europe/Zurich", label: "Central European Time (CET) - Zurich" },
    { value: "Europe/Brussels", label: "Central European Time (CET) - Brussels" },
    { value: "Europe/Dublin", label: "Greenwich Mean Time (GMT) - Dublin" },
    { value: "Europe/Lisbon", label: "Western European Time (WET) - Lisbon" },
    { value: "Europe/Athens", label: "Eastern European Time (EET) - Athens" },
    { value: "Europe/Istanbul", label: "Turkey Time (TRT) - Istanbul" },
    { value: "Europe/Moscow", label: "Moscow Time (MSK) - Moscow" },

    // Asia
    { value: "Asia/Dubai", label: "Gulf Standard Time (GST) - Dubai" },
    { value: "Asia/Karachi", label: "Pakistan Standard Time (PKT) - Karachi" },
    { value: "Asia/Kolkata", label: "India Standard Time (IST) - Mumbai, Delhi" },
    { value: "Asia/Dhaka", label: "Bangladesh Standard Time (BST) - Dhaka" },
    { value: "Asia/Bangkok", label: "Indochina Time (ICT) - Bangkok" },
    { value: "Asia/Singapore", label: "Singapore Time (SGT) - Singapore" },
    { value: "Asia/Kuala_Lumpur", label: "Malaysia Time (MYT) - Kuala Lumpur" },
    { value: "Asia/Jakarta", label: "Western Indonesia Time (WIB) - Jakarta" },
    { value: "Asia/Manila", label: "Philippine Time (PHT) - Manila" },
    { value: "Asia/Hong_Kong", label: "Hong Kong Time (HKT) - Hong Kong" },
    { value: "Asia/Shanghai", label: "China Standard Time (CST) - Shanghai, Beijing" },
    { value: "Asia/Taipei", label: "Taiwan Time (TST) - Taipei" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST) - Tokyo" },
    { value: "Asia/Seoul", label: "Korea Standard Time (KST) - Seoul" },
    { value: "Asia/Riyadh", label: "Arabia Standard Time (AST) - Riyadh" },
    { value: "Asia/Jerusalem", label: "Israel Standard Time (IST) - Jerusalem" },
    { value: "Asia/Tehran", label: "Iran Standard Time (IRST) - Tehran" },

    // Australia & Pacific
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET) - Sydney" },
    { value: "Australia/Melbourne", label: "Australian Eastern Time (AET) - Melbourne" },
    { value: "Australia/Brisbane", label: "Australian Eastern Time (AET) - Brisbane" },
    { value: "Australia/Perth", label: "Australian Western Time (AWST) - Perth" },
    { value: "Australia/Adelaide", label: "Australian Central Time (ACST) - Adelaide" },
    { value: "Pacific/Auckland", label: "New Zealand Time (NZST) - Auckland" },

    // South America
    { value: "America/Sao_Paulo", label: "Brasilia Time (BRT) - São Paulo" },
    { value: "America/Buenos_Aires", label: "Argentina Time (ART) - Buenos Aires" },
    { value: "America/Lima", label: "Peru Time (PET) - Lima" },
    { value: "America/Bogota", label: "Colombia Time (COT) - Bogotá" },
    { value: "America/Santiago", label: "Chile Time (CLT) - Santiago" },

    // Africa
    { value: "Africa/Cairo", label: "Eastern European Time (EET) - Cairo" },
    { value: "Africa/Johannesburg", label: "South Africa Standard Time (SAST) - Johannesburg" },
    { value: "Africa/Lagos", label: "West Africa Time (WAT) - Lagos" },
    { value: "Africa/Nairobi", label: "East Africa Time (EAT) - Nairobi" },
    { value: "Africa/Casablanca", label: "Western European Time (WET) - Casablanca" },

    // UTC
    { value: "UTC", label: "Coordinated Universal Time (UTC)" },
]

interface TimezoneSelectProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function TimezoneSelect({
    value,
    onValueChange,
    placeholder = "Select timezone",
    className,
    disabled = false
}: TimezoneSelectProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const filteredTimezones = useMemo(() => {
        if (!searchValue) return TIMEZONES
        const searchLower = searchValue.toLowerCase()
        return TIMEZONES.filter(tz =>
            tz.label.toLowerCase().includes(searchLower) ||
            tz.value.toLowerCase().includes(searchLower)
        )
    }, [searchValue])

    // Close dropdown when clicking outside and focus search input when opened
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
                setSearchValue("")
            }
        }

        if (open) {
            // Focus search input when dropdown opens
            setTimeout(() => {
                searchInputRef.current?.focus()
            }, 0)
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    const handleSelect = (tzValue: string) => {
        onValueChange(tzValue)
        setOpen(false)
        setSearchValue("")
    }

    const selectedTimezone = TIMEZONES.find(tz => tz.value === value)

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) {
            setOpen(!open)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                    "w-full justify-between h-11",
                    !selectedTimezone && "text-muted-foreground",
                    disabled && "cursor-not-allowed opacity-50",
                    className
                )}
                onClick={handleButtonClick}
                disabled={disabled}
            >
                {selectedTimezone ? selectedTimezone.label : placeholder}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[300px] overflow-hidden">
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search timezones..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-8 pr-8"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setOpen(false)
                                        setSearchValue("")
                                    }
                                }}
                            />
                            {searchValue && (
                                <button
                                    onClick={() => setSearchValue("")}
                                    className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    type="button"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[250px] overflow-y-auto">
                        {filteredTimezones.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No timezones found
                            </div>
                        ) : (
                            <div>
                                {filteredTimezones.map((tz) => (
                                    <button
                                        key={tz.value}
                                        className={cn(
                                            "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                                            value === tz.value && "bg-[#3d8f5b]/10 text-[#3d8f5b] font-medium"
                                        )}
                                        onClick={() => handleSelect(tz.value)}
                                        type="button"
                                    >
                                        {tz.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
