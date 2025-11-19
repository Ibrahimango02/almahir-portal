"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { countries } from "@/lib/utils/countries"
import { cn } from "@/lib/utils"

interface CountrySelectProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function CountrySelect({ value, onValueChange, placeholder = "Select country...", className }: CountrySelectProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)

    const filteredCountries = useMemo(() => {
        if (!searchValue) return countries // Show all countries when not searching
        return countries.filter(country =>
            country.toLowerCase().includes(searchValue.toLowerCase())
        ) // Show all matching countries when searching
    }, [searchValue])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
                setSearchValue("")
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (country: string) => {
        onValueChange(country)
        setOpen(false)
        setSearchValue("")
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn("w-full justify-between", className)}
                onClick={() => setOpen(!open)}
            >
                {value || placeholder}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search countries..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-8 pr-8"
                                autoFocus
                            />
                            {searchValue && (
                                <button
                                    onClick={() => setSearchValue("")}
                                    className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No countries found
                            </div>
                        ) : (
                            <div>
                                {filteredCountries.map((country) => (
                                    <button
                                        key={country}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        onClick={() => handleSelect(country)}
                                    >
                                        {country}
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