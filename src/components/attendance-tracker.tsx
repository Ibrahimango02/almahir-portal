"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { Save, User, UserPen } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { updateSessionAttendance } from "@/lib/put/put-classes"

type AttendanceTrackerProps = {
    sessionId: string
    sessionDate: string
    students: {
        student_id: string
        first_name: string
        last_name: string
        avatar_url?: string | null
    }[]
    teachers: {
        teacher_id: string
        first_name: string
        last_name: string
        avatar_url?: string | null
    }[]
    currentStatus: string
    onStatusChange: (status: string) => void
    userRole: 'admin' | 'moderator' | 'teacher' | 'student' | 'parent'
    existingAttendance?: {
        teacherAttendance: Array<{ teacher_id: string; attendance_status: string }>
        studentAttendance: Array<{ student_id: string; attendance_status: string }>
    }
    onAttendanceUpdate?: () => void
}

export function AttendanceTracker({
    sessionId,
    sessionDate,
    students,
    teachers,
    currentStatus,
    userRole,
    existingAttendance,
    onAttendanceUpdate
}: AttendanceTrackerProps) {
    const { toast } = useToast()
    const [studentAttendance, setStudentAttendance] = useState<Record<string, boolean>>({})
    const [teacherAttendance, setTeacherAttendance] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Only teachers, admins, and moderators can take attendance
    const canTakeAttendance = userRole === 'admin' || userRole === 'moderator' || userRole === 'teacher'

    // Admins and moderators can edit attendance when status is not 'scheduled' or 'cancelled'
    // Teachers can only edit when session is running
    const canEditAttendance = canTakeAttendance && (
        (userRole === 'admin' || userRole === 'moderator')
            ? (currentStatus !== 'scheduled' && currentStatus !== 'cancelled')
            : currentStatus === "running"
    )

    // Load existing attendance data when component mounts or when existingAttendance changes
    useEffect(() => {
        if (existingAttendance) {
            // Create attendance state from existing data
            const studentAttendanceState: Record<string, boolean> = {}
            const teacherAttendanceState: Record<string, boolean> = {}

            // Initialize all students as absent by default
            students.forEach((student) => {
                studentAttendanceState[student.student_id] = false
            })

            // Initialize all teachers as absent by default
            teachers.forEach((teacher) => {
                teacherAttendanceState[teacher.teacher_id] = false
            })

            // Update with existing attendance records
            existingAttendance.studentAttendance.forEach((record) => {
                if (record.student_id in studentAttendanceState) {
                    studentAttendanceState[record.student_id] = record.attendance_status === 'present'
                }
            })

            existingAttendance.teacherAttendance.forEach((record) => {
                if (record.teacher_id in teacherAttendanceState) {
                    teacherAttendanceState[record.teacher_id] = record.attendance_status === 'present'
                }
            })

            setStudentAttendance(studentAttendanceState)
            setTeacherAttendance(teacherAttendanceState)
            setHasChanges(false)
        } else {
            // No existing attendance data, initialize as absent
            const defaultStudentAttendance: Record<string, boolean> = {}
            const defaultTeacherAttendance: Record<string, boolean> = {}

            students.forEach((student) => {
                defaultStudentAttendance[student.student_id] = false
            })
            teachers.forEach((teacher) => {
                defaultTeacherAttendance[teacher.teacher_id] = false
            })

            setStudentAttendance(defaultStudentAttendance)
            setTeacherAttendance(defaultTeacherAttendance)
        }
    }, [existingAttendance, students, teachers])

    // Refresh attendance data when session status changes
    useEffect(() => {
        if (existingAttendance) {
            // Create attendance state from existing data
            const studentAttendanceState: Record<string, boolean> = {}
            const teacherAttendanceState: Record<string, boolean> = {}

            // Initialize all students as absent by default
            students.forEach((student) => {
                studentAttendanceState[student.student_id] = false
            })

            // Initialize all teachers as absent by default
            teachers.forEach((teacher) => {
                teacherAttendanceState[teacher.teacher_id] = false
            })

            // Update with existing attendance records
            existingAttendance.studentAttendance.forEach((record) => {
                if (record.student_id in studentAttendanceState) {
                    studentAttendanceState[record.student_id] = record.attendance_status === 'present'
                }
            })

            existingAttendance.teacherAttendance.forEach((record) => {
                if (record.teacher_id in teacherAttendanceState) {
                    teacherAttendanceState[record.teacher_id] = record.attendance_status === 'present'
                }
            })

            setStudentAttendance(studentAttendanceState)
            setTeacherAttendance(teacherAttendanceState)
            setHasChanges(false)
        }
    }, [currentStatus, existingAttendance, students, teachers])

    // Function to get initials from name
    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    // Handle student attendance change
    const handleStudentAttendanceChange = (studentId: string, isPresent: boolean) => {
        if (!canEditAttendance) return;
        setStudentAttendance((prev) => ({
            ...prev,
            [studentId]: isPresent,
        }))
        setHasChanges(true)
    }

    // Handle teacher attendance change
    const handleTeacherAttendanceChange = (teacherId: string, isPresent: boolean) => {
        if (!canEditAttendance) return;
        setTeacherAttendance((prev) => ({
            ...prev,
            [teacherId]: isPresent,
        }))
        setHasChanges(true)
    }



    // Save attendance records
    const saveAttendance = async () => {
        if (!canEditAttendance) return;
        setSaving(true)

        try {
            // Ensure all students are explicitly marked as present or absent
            const completeStudentAttendance: Record<string, boolean> = {}
            students.forEach((student) => {
                completeStudentAttendance[student.student_id] = studentAttendance[student.student_id] || false
            })

            // Ensure all teachers are explicitly marked as present or absent
            const completeTeacherAttendance: Record<string, boolean> = {}
            teachers.forEach((teacher) => {
                completeTeacherAttendance[teacher.teacher_id] = teacherAttendance[teacher.teacher_id] || false
            })

            const result = await updateSessionAttendance({
                sessionId,
                studentAttendance: completeStudentAttendance,
                teacherAttendance: completeTeacherAttendance
            })

            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to save attendance')
            }

            // Check if all students are absent
            const allStudentsAbsent = students.length > 0 && Object.values(completeStudentAttendance).every((status) => status === false)
            const allTeachersAbsent = teachers.length > 0 && Object.values(completeTeacherAttendance).every((status) => status === false)

            let description = `Attendance records for ${format(parseISO(sessionDate), "MMMM d, yyyy")} have been updated.`
            if (allStudentsAbsent && allTeachersAbsent) {
                description = `Recorded that no students or teachers attended class on ${format(parseISO(sessionDate), "MMMM d, yyyy")}.`
            } else if (allStudentsAbsent) {
                description = `Recorded that no students attended class on ${format(parseISO(sessionDate), "MMMM d, yyyy")}.`
            } else if (allTeachersAbsent) {
                description = `Recorded that no teachers attended class on ${format(parseISO(sessionDate), "MMMM d, yyyy")}.`
            }

            toast({
                title: "Attendance saved",
                description,
                duration: 3000,
            })

            // Don't reset hasChanges to false - allow further modifications
            // This enables users to update attendance multiple times

            // Notify parent component to refresh attendance data
            if (onAttendanceUpdate) {
                onAttendanceUpdate()
            }
        } catch (error) {
            console.error('Error in saveAttendance:', error)

            const errorMessage = error instanceof Error ? error.message : 'There was a problem saving attendance records. Please try again.'

            toast({
                title: "Error saving attendance",
                description: errorMessage,
                variant: "destructive",
                duration: 5000,
            })
        } finally {
            setSaving(false)
        }
    }

    // Count present students and teachers
    const presentStudentCount = Object.values(studentAttendance).filter(Boolean).length
    const presentTeacherCount = Object.values(teacherAttendance).filter(Boolean).length

    const isAttendanceEnabled = canEditAttendance

    // Reset hasChanges when session status changes to non-running (only for teachers)
    useEffect(() => {
        if (currentStatus !== "running" && userRole === 'teacher') {
            setHasChanges(false)
        }
    }, [currentStatus, userRole])


    // Show message when no students or teachers are enrolled
    if (students.length === 0 && teachers.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">No students or teachers are enrolled in this class.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Teachers Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <UserPen className="h-4 w-4" />
                    Teachers
                </div>
                {teachers.length > 0 ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead className="w-16 text-center">Present</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map((teacher) => (
                                    <TableRow key={teacher.teacher_id}>
                                        <TableCell className="flex items-center gap-2 py-2">
                                            <Avatar className="h-6 w-6">
                                                {teacher.avatar_url && <AvatarImage src={teacher.avatar_url} alt={teacher.first_name} />}
                                                <AvatarFallback className="text-xs bg-muted">
                                                    {getInitials(teacher.first_name, teacher.last_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Link
                                                href={`/admin/teachers/${teacher.teacher_id}`}
                                                className="hover:underline text-primary inline-block text-sm"
                                            >
                                                {teacher.first_name} {teacher.last_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <Checkbox
                                                    id={`teacher-attendance-${teacher.teacher_id}`}
                                                    checked={teacherAttendance[teacher.teacher_id] || false}
                                                    onCheckedChange={(checked) => {
                                                        handleTeacherAttendanceChange(teacher.teacher_id, checked === true)
                                                    }}
                                                    disabled={!isAttendanceEnabled}
                                                    style={{
                                                        backgroundColor: teacherAttendance[teacher.teacher_id] ? "#3d8f5b" : "white",
                                                        color: "white",
                                                        borderColor: "#3d8f5b",
                                                        opacity: isAttendanceEnabled ? 1 : 0.5
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                        <UserPen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No teachers assigned</p>
                    </div>
                )}
            </div>

            {/* Students Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Students
                </div>
                {students.length > 0 ? (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead className="w-16 text-center">Present</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow key={student.student_id}>
                                        <TableCell className="flex items-center gap-2 py-2">
                                            <Avatar className="h-6 w-6">
                                                {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.first_name} />}
                                                <AvatarFallback className="text-xs bg-muted">
                                                    {getInitials(student.first_name, student.last_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Link
                                                href={`/admin/students/${student.student_id}`}
                                                className="hover:underline text-primary inline-block text-sm"
                                            >
                                                {student.first_name} {student.last_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <Checkbox
                                                    id={`student-attendance-${student.student_id}`}
                                                    checked={studentAttendance[student.student_id] || false}
                                                    onCheckedChange={(checked) => {
                                                        handleStudentAttendanceChange(student.student_id, checked === true)
                                                    }}
                                                    disabled={!isAttendanceEnabled}
                                                    style={{
                                                        backgroundColor: studentAttendance[student.student_id] ? "#3d8f5b" : "white",
                                                        color: "white",
                                                        borderColor: "#3d8f5b",
                                                        opacity: isAttendanceEnabled ? 1 : 0.5
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                        <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No students enrolled</p>
                    </div>
                )}
            </div>

            {/* Bottom section with save button and attendance summary */}
            {isAttendanceEnabled && (
                <div className="flex items-center justify-between">
                    {/* Simple attendance summary */}
                    <div className="text-sm text-muted-foreground">
                        {students.length > 0 && (
                            <p>Students: {presentStudentCount} of {students.length} present</p>
                        )}
                        {teachers.length > 0 && (
                            <p>Teachers: {presentTeacherCount} of {teachers.length} present</p>
                        )}
                    </div>

                    {/* Save button */}
                    <Button size="sm" onClick={saveAttendance} disabled={!hasChanges || saving} className="h-8" style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                        {saving ? (
                            "Saving..."
                        ) : (
                            <>
                                <Save className="mr-1 h-3.5 w-3.5" />
                                Save Attendance
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}