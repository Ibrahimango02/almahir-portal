"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TeacherType } from "@/types"

interface TeachersComboboxProps {
    teachers: TeacherType[]
    selectedTeacherIds: string[]
    onTeacherSelect: (teacherId: string) => void
    placeholder?: string
    className?: string
}

export function TeachersCombobox({
    teachers,
    selectedTeacherIds,
    onTeacherSelect,
    placeholder = "Select teachers...",
    className = ""
}: TeachersComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const dropdownRef = useRef<HTMLDivElement>(null)

    const filteredTeachers = useMemo(() => {
        if (!searchValue) return teachers
        return teachers.filter(teacher => {
            const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase()
            const specialization = teacher.specialization?.toLowerCase() || ""
            const gender = teacher.gender?.toLowerCase() || ""
            const searchLower = searchValue.toLowerCase()
            return fullName.includes(searchLower) || specialization.includes(searchLower) || gender.includes(searchLower)
        })
    }, [teachers, searchValue])

    // Get available teachers (not already selected)
    const availableTeachers = useMemo(() => {
        return filteredTeachers.filter(teacher => !selectedTeacherIds.includes(teacher.teacher_id))
    }, [filteredTeachers, selectedTeacherIds])

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

    const handleSelect = (teacherId: string) => {
        onTeacherSelect(teacherId)
        setSearchValue("")
        // Keep dropdown open to allow multiple selections
    }

    const selectedTeachers = teachers.filter(teacher => selectedTeacherIds.includes(teacher.teacher_id))

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
                        {availableTeachers.length === 0 && selectedTeacherIds.length > 0
                            ? "All available teachers selected"
                            : placeholder
                        }
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {open && availableTeachers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search teachers..."
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
                            {availableTeachers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No teachers found
                                </div>
                            ) : (
                                <div>
                                    {availableTeachers.map((teacher) => (
                                        <button
                                            key={teacher.teacher_id}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                            onClick={() => handleSelect(teacher.teacher_id)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {teacher.first_name} {teacher.last_name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {teacher.specialization || 'No specialization'} • {teacher.gender || 'Gender not specified'}
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

            {/* Display selected teachers */}
            {selectedTeachers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTeachers.map((teacher) => (
                        <div
                            key={teacher.teacher_id}
                            className="flex items-center gap-2 bg-[#3d8f5b]/10 border border-[#3d8f5b]/20 px-3 py-2 rounded-lg text-sm"
                        >
                            <span className="text-[#3d8f5b] font-medium">
                                {teacher.first_name} {teacher.last_name}
                            </span>
                            <button
                                type="button"
                                onClick={() => onTeacherSelect(teacher.teacher_id)}
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