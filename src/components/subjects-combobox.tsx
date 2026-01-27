"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// // Define the subjects available for selection
// const subjects = [
//     "Qur'an Recitation",
//     "Qur'an Memorization",
//     "Tajweed (Beginner)",
//     "Tajweed (Advanced)",
//     "Tajweed and Recitation Certificate",
//     "Qur'an Memorization Ijaazah",
//     "Learn Ten Qura'at",
//     "Tafseer",
//     "Learn to Read Arabic",
//     "Arabic Grammar",
//     "Arabic Conversation",
//     "Modern Standard Arabic",
//     "Islamic Studies for Kids",
//     "Prayer Lessons",
//     "Azan Program",
//     "Five Pillars of Islam",
//     "Stories of the Qur'an",
//     "Stories of the Prophets",
//     "Daily Duas"
// ]

// Define the subjects available for selection
const subjects = [
    "Qur'an",
    "Arabic",
    "Tajweed (Beginner)",
    "Tajweed (Intermediate)",
    "Tajweed (Advanced)",
    "Islamic Studies",
    "Special Program",
]

interface SubjectsComboboxProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function SubjectsCombobox({
    value,
    onValueChange,
    placeholder = "Select a subject...",
    className = ""
}: SubjectsComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)

    const filteredSubjects = useMemo(() => {
        if (!searchValue) return subjects
        return subjects.filter(subject =>
            subject.toLowerCase().includes(searchValue.toLowerCase())
        )
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

    const handleSelect = (subject: string) => {
        onValueChange(subject)
        setOpen(false)
        setSearchValue("")
    }

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20 font-normal"
                onClick={() => setOpen(!open)}
            >
                <span className={!value ? "text-gray-500" : ""}>
                    {value || placeholder}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search subjects..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="pl-8 pr-8 h-9"
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
                        {filteredSubjects.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No subjects found
                            </div>
                        ) : (
                            <div>
                                {filteredSubjects.map((subject) => (
                                    <button
                                        key={subject}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                        onClick={() => handleSelect(subject)}
                                    >
                                        {subject}
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