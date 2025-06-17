"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { ClassManagementActions } from "@/components/class-management-actions"
import { StatusBadge } from "@/components/status-badge"
import { formatDuration } from "@/lib/utils"
import { differenceInMinutes, format, parseISO, isValid, parse } from "date-fns"
import Link from "next/link"
import { useState } from "react"

// Helper function to safely format dates
const safeFormat = (date: Date, formatStr: string, fallback = "N/A") => {
  try {
    if (!date || !isValid(date)) return fallback;
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

// Helper function to safely parse ISO date strings
const safeParseISO = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    const parsedDate = parseISO(dateString);
    return isValid(parsedDate) ? parsedDate : null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
}

// Helper function to parse time strings (HH:mm:ss)
const parseTimeString = (timeString: string | null | undefined): Date | null => {
  if (!timeString) return null;
  try {
    // Check if it's just a time string (no date part)
    if (timeString.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
      const today = new Date();
      // Parse time using date-fns parse with appropriate format
      const parsedTime = parse(timeString, 'HH:mm:ss', today);
      return isValid(parsedTime) ? parsedTime : null;
    }
    // If not a simple time string, try standard ISO parsing
    return safeParseISO(timeString);
  } catch (error) {
    console.error("Error parsing time:", error);
    return null;
  }
}

type ClassSessionDetailsProps = {
  classData: {
    session_id: string
    title: string
    description: string
    subject: string
    date: string
    start_time: string
    end_time: string
    status: string
    class_link: string | null
    teacher: {
      teacher_id: string
      first_name: string
      last_name: string
    }
    enrolled_students: {
      student_id: string
      first_name: string
      last_name: string
    }[]
    attendance?: Record<string, boolean>
  }
}

export function ClassSessionDetails({ classData }: ClassSessionDetailsProps) {
  const [currentStatus, setCurrentStatus] = useState(classData.status)

  // Parse dates safely
  const classDate = safeParseISO(classData.date) || new Date();
  const startTime = parseTimeString(classData.start_time) || new Date();
  const endTime = parseTimeString(classData.end_time) || new Date(startTime.getTime() + 60 * 60 * 1000);

  // Combine date with time
  const startDateTime = new Date(classDate);
  startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds());

  const endDateTime = new Date(classDate);
  endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds());

  // Calculate duration safely
  let durationMinutes = 60; // default to 1 hour
  if (isValid(startDateTime) && isValid(endDateTime)) {
    durationMinutes = Math.max(differenceInMinutes(endDateTime, startDateTime), 0);
  }

  const duration = formatDuration(durationMinutes);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{classData.title}</CardTitle>
            <CardDescription>{safeFormat(startDateTime, "EEEE, MMMM d, yyyy")}</CardDescription>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Class Management Actions */}
        <ClassManagementActions
          classData={classData}
          currentStatus={currentStatus}
          onStatusChange={setCurrentStatus}
        />

        {/* Class Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Teacher</h3>
            <Link
              href={`/admin/teachers/${classData.teacher.teacher_id}`}
              className="text-base font-medium mt-1 hover:underline text-primary inline-block"
            >
              {classData.teacher.first_name} {classData.teacher.last_name}
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
            <p className="text-base font-medium mt-1">{classData.subject}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Time</h3>
            <p className="text-base font-medium mt-1">
              {safeFormat(startDateTime, "h:mm a")} - {safeFormat(endDateTime, "h:mm a")} ({duration})
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Students Enrolled</h3>
            <p className="text-base font-medium mt-1">{classData.enrolled_students.length} students</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
          <p className="text-sm text-muted-foreground">{classData.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Attendance Tracking - Takes the full width */}
          <div className="md:col-span-3">
            <AttendanceTracker
              sessionId={classData.session_id}
              sessionDate={classData.date}
              students={classData.enrolled_students}
              currentStatus={currentStatus}
              onStatusChange={setCurrentStatus}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
