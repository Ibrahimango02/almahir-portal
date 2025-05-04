"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { CheckCircle, Save, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { StudentType } from "@/types"


type AttendanceRecord = {
  studentId: string
  present: boolean
  notes?: string
}

type AttendanceTrackerProps = {
  sessionId: string
  sessionDate: string
  students: {
    student_id: string
    first_name: string
    last_name: string
  }[]
  initialAttendance?: Record<string, boolean>
}

export function AttendanceTracker({ sessionId, sessionDate, students, initialAttendance = {} }: AttendanceTrackerProps) {
  const { toast } = useToast()
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [isAttendanceTaken, setIsAttendanceTaken] = useState(false)

  // Initialize attendance from props or default all to absent
  useEffect(() => {
    const initialData: Record<string, boolean> = {}
    students.forEach((student) => {
      initialData[student.student_id] = initialAttendance[student.student_id] || false
    })
    setAttendance(initialData)

    // Check if attendance was previously taken
    const attendanceValues = Object.values(initialAttendance)
    setIsAttendanceTaken(attendanceValues.length > 0)

    // If attendance hasn't been taken yet, we should allow saving even with all absent
    if (attendanceValues.length === 0) {
      setHasChanges(true)
    }
  }, [students, initialAttendance])

  // Function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Handle checkbox change
  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: isPresent,
    }))
    setHasChanges(true)
  }

  // Mark all as present
  const markAllPresent = () => {
    const updatedAttendance: Record<string, boolean> = {}
    students.forEach((student) => {
      updatedAttendance[student.student_id] = true
    })
    setAttendance(updatedAttendance)
    setHasChanges(true)
  }

  // Save attendance records
  const saveAttendance = async () => {
    setSaving(true)

    // Simulate API call to save attendance
    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Check if all students are absent
      const allAbsent = students.length > 0 && Object.values(attendance).every((status) => status === false)

      let description = `Attendance records for ${format(parseISO(sessionDate), "MMMM d, yyyy")} have been updated.`
      if (allAbsent) {
        description = `Recorded that no students attended class on ${format(parseISO(sessionDate), "MMMM d, yyyy")}.`
      }

      toast({
        title: "Attendance saved",
        description,
        duration: 3000,
      })

      setHasChanges(false)
      setIsAttendanceTaken(true)
    } catch (error) {
      toast({
        title: "Error saving attendance",
        description: "There was a problem saving attendance records. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setSaving(false)
    }
  }

  // Count present students
  const presentCount = Object.values(attendance).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Attendance Tracking</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllPresent} className="h-8">
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            Mark All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const updatedAttendance: Record<string, boolean> = {}
              students.forEach((student) => {
                updatedAttendance[student.student_id] = false
              })
              setAttendance(updatedAttendance)
              setHasChanges(true)
            }}
            className="h-8"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Mark All Absent
          </Button>
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
      </div>

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
                    <AvatarFallback className="text-xs">
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
                      id={`attendance-${student.student_id}`}
                      checked={attendance[student.student_id] || false}
                      onCheckedChange={(checked) => {
                        handleAttendanceChange(student.student_id, checked === true)
                      }}
                      style={{
                        backgroundColor: attendance[student.student_id] ? "#3d8f5b" : "white",
                        color: "white",
                        borderColor: "#3d8f5b"
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {isAttendanceTaken ? (
          presentCount === 0 ? (
            <p className="text-amber-600 font-medium">No students were present for this class.</p>
          ) : (
            <p>
              Attendance: {presentCount} of {students.length} students present (
              {Math.round((presentCount / students.length) * 100)}%)
            </p>
          )
        ) : (
          <p>Attendance not yet taken for this class.</p>
        )}
      </div>
    </div>
  )
}
