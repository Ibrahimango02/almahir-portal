"use client"

import { useState } from 'react'
import { ChevronDown, Users, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStudentSwitcher } from '@/contexts/StudentSwitcherContext'
import { cn } from '@/lib/utils'

export function StudentSwitcher() {
    const {
        selectedStudent,
        parentStudents,
        isLoading,
        isParentView,
        switchToParentView,
        switchToStudentView
    } = useStudentSwitcher()

    const [isOpen, setIsOpen] = useState(false)

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
        )
    }

    if (parentStudents.length === 0) {
        return null
    }

    const currentView = selectedStudent ? selectedStudent : { first_name: 'Parent', last_name: 'View' }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between text-left font-normal"
            >
                <div className="flex items-center gap-2">
                    {isParentView ? (
                        <Users className="h-4 w-4 text-green-600" />
                    ) : (
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="truncate">
                        {isParentView ? 'Parent View' : `${currentView.first_name} ${currentView.last_name}`}
                    </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                        {/* Parent View Option */}
                        <button
                            onClick={() => {
                                switchToParentView()
                                setIsOpen(false)
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                isParentView && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-green-600" />
                                <span>Parent View</span>
                            </div>
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                        {/* Student Options */}
                        {parentStudents.map((student) => (
                            <button
                                key={student.student_id}
                                onClick={() => {
                                    switchToStudentView(student)
                                    setIsOpen(false)
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                    selectedStudent?.student_id === student.student_id && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-blue-600" />
                                    <span>{student.first_name} {student.last_name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
} 