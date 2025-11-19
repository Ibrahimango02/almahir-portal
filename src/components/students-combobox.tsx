"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StudentType } from "@/types"

interface StudentsComboboxProps {
    students: StudentType[]
    selectedStudentIds: string[]
    onStudentSelect: (studentId: string) => void
    placeholder?: string
    className?: string
}

export function StudentsCombobox({
    students,
    selectedStudentIds,
    onStudentSelect,
    placeholder = "Select students...",
    className = ""
}: StudentsComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

    const filteredStudents = useMemo(() => {
        if (!searchValue) return students
        return students.filter(student => {
            const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
            const gender = student.gender?.toLowerCase() || ""
            const age = student.age?.toString() || ""
            const searchLower = searchValue.toLowerCase()
            return fullName.includes(searchLower) || gender.includes(searchLower) || age.includes(searchLower)
        })
    }, [students, searchValue])

    // Get available students (not already selected)
    const availableStudents = useMemo(() => {
        return filteredStudents.filter(student => !selectedStudentIds.includes(student.student_id))
    }, [filteredStudents, selectedStudentIds])

    // Reset highlighted index when list changes
    useEffect(() => {
        setHighlightedIndex(-1)
        // Clear refs array when list changes
        itemRefs.current = []
    }, [availableStudents.length, searchValue])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
                setSearchValue("")
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    const handleSelect = (studentId: string) => {
        onStudentSelect(studentId)
        setSearchValue("")
        setHighlightedIndex(-1)
        // Keep dropdown open and refocus input to allow multiple selections
        setTimeout(() => {
            inputRef.current?.focus()
        }, 0)
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || availableStudents.length === 0) return

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setHighlightedIndex((prev) => {
                    const next = prev < availableStudents.length - 1 ? prev + 1 : 0
                    // Scroll into view
                    setTimeout(() => {
                        itemRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
                    }, 0)
                    return next
                })
                break
            case "ArrowUp":
                e.preventDefault()
                setHighlightedIndex((prev) => {
                    const next = prev > 0 ? prev - 1 : availableStudents.length - 1
                    // Scroll into view
                    setTimeout(() => {
                        itemRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" })
                    }, 0)
                    return next
                })
                break
            case "Enter":
                e.preventDefault()
                if (highlightedIndex >= 0 && highlightedIndex < availableStudents.length) {
                    handleSelect(availableStudents[highlightedIndex].student_id)
                }
                break
            case "Escape":
                e.preventDefault()
                setOpen(false)
                setSearchValue("")
                setHighlightedIndex(-1)
                break
        }
    }

    const selectedStudents = students.filter(student => selectedStudentIds.includes(student.student_id))

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="relative" ref={dropdownRef}>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11 border-gray-200 focus:border-[#3d8f5b] focus:ring-[#3d8f5b]/20 font-normal"
                    onClick={() => setOpen(!open)}
                >
                    <span className="text-gray-500">
                        {availableStudents.length === 0 && selectedStudentIds.length > 0
                            ? "All available students selected"
                            : placeholder
                        }
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {open && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Search students..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={(e) => {
                                        // Don't close if clicking inside the dropdown
                                        if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
                                            // Only close if clicking outside the entire component
                                            setTimeout(() => {
                                                if (!dropdownRef.current?.contains(document.activeElement)) {
                                                    setOpen(false)
                                                    setSearchValue("")
                                                    setHighlightedIndex(-1)
                                                }
                                            }, 200)
                                        }
                                    }}
                                    className="pl-8 pr-8 h-9"
                                    autoFocus
                                />
                                {searchValue && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSearchValue("")
                                            inputRef.current?.focus()
                                        }}
                                        className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div ref={listRef} className="max-h-48 overflow-y-auto">
                            {availableStudents.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    {searchValue ? "No students found" : "No available students"}
                                </div>
                            ) : (
                                <div>
                                    {availableStudents.map((student, index) => (
                                        <button
                                            key={student.student_id}
                                            type="button"
                                            ref={(el) => {
                                                itemRefs.current[index] = el
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm focus:outline-none ${
                                                highlightedIndex === index
                                                    ? "bg-[#3d8f5b]/10 border-l-2 border-[#3d8f5b]"
                                                    : "hover:bg-gray-100"
                                            }`}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleSelect(student.student_id)
                                            }}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                            onMouseDown={(e) => {
                                                // Prevent input blur when clicking on option
                                                e.preventDefault()
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {student.first_name} {student.last_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Age: {student.age || 'N/A'} • {student.gender || 'Gender not specified'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Display selected students */}
            {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedStudents.map((student) => (
                        <div
                            key={student.student_id}
                            className="flex items-center gap-2 bg-[#3d8f5b]/10 border border-[#3d8f5b]/20 px-3 py-2 rounded-lg text-sm"
                        >
                            <span className="text-[#3d8f5b] font-medium">
                                {student.first_name} {student.last_name}
                            </span>
                            <button
                                type="button"
                                onClick={() => onStudentSelect(student.student_id)}
                                className="text-[#3d8f5b] hover:text-[#3d8f5b]/70 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 