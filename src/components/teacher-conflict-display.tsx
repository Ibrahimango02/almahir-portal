"use client"

import { Clock, Calendar, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConflictInfo } from "@/lib/utils/conflict-checker"
import { TeacherType } from "@/types"

interface TeacherConflictDisplayProps {
    teacher: TeacherType
    conflictInfo: ConflictInfo
    onRemoveTeacher?: (teacherId: string) => void
}

export function TeacherConflictDisplay({
    teacher,
    conflictInfo,
    onRemoveTeacher
}: TeacherConflictDisplayProps) {
    if (!conflictInfo.hasConflict) {
        return null
    }

    const scheduleConflicts = conflictInfo.conflicts.filter(c => c.type === 'schedule')
    const availabilityConflicts = conflictInfo.conflicts.filter(c => c.type === 'availability')

    return (
        <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-red-900">
                                {teacher.first_name} {teacher.last_name}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {scheduleConflicts.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1 text-sm font-medium text-red-700 mb-1">
                                        <Calendar className="h-3 w-3" />
                                        Schedule Conflicts:
                                    </div>
                                    <div className="max-h-32 overflow-y-auto pr-2">
                                        <ul className="text-sm text-red-700 space-y-1 ml-4">
                                            {scheduleConflicts.map((conflict, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <span className="text-xs bg-red-100 px-2 py-1 rounded">
                                                        {conflict.day}
                                                    </span>
                                                    <span>{conflict.message}</span>
                                                    {conflict.existingTime && conflict.newTime && (
                                                        <span className="text-xs text-red-600">
                                                            ({conflict.existingTime})
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {availabilityConflicts.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1 text-sm font-medium text-red-700 mb-1">
                                        <Clock className="h-3 w-3" />
                                        Availability Conflicts:
                                    </div>
                                    <div className="max-h-32 overflow-y-auto pr-2">
                                        <ul className="text-sm text-red-700 space-y-1 ml-4">
                                            {availabilityConflicts.map((conflict, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <span className="text-xs bg-red-100 px-2 py-1 rounded">
                                                        {conflict.day}
                                                    </span>
                                                    <span>{conflict.message}</span>
                                                    {conflict.newTime && (
                                                        <span className="text-xs text-red-600">
                                                            ({conflict.newTime})
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {onRemoveTeacher && (
                        <button
                            onClick={() => onRemoveTeacher(teacher.teacher_id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Remove teacher"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    )
} 