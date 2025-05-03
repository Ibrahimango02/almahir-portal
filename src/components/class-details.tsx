import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { ClassManagementActions } from "@/components/class-management-actions"
import { StatusBadge } from "@/components/status-badge"
import { formatDuration } from "@/lib/utils"
import { differenceInMinutes, format, parseISO, isValid, parse } from "date-fns"
import Link from "next/link"

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

type ClassDetailsProps = {
  classData: {
    id: number
    title: string
    description: string
    subject: string
    start_time: string
    end_time: string
    status: string
    class_link: string
    teacher_id: number
    teacher: {
      id: number
      first_name: string
      last_name: string
    }
    enrolled_students: {
      id: number
      first_name: string
      last_name: string
    }[]
    attendance?: Record<number, boolean>
  }
}

export function ClassDetails({ classData }: ClassDetailsProps) {
  // Parse dates safely

  const startTime = parseTimeString(classData.start_time) || new Date();
  const endTime = parseTimeString(classData.end_time) || new Date(startTime.getTime() + 60 * 60 * 1000);

  // Calculate duration safely
  let durationMinutes = 60; // default to 1 hour
  if (isValid(startTime) && isValid(endTime)) {
    durationMinutes = Math.max(differenceInMinutes(endTime, startTime), 0);
  }

  const duration = formatDuration(durationMinutes);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{classData.title}</CardTitle>
            <CardDescription>{safeFormat(startTime, "EEEE, MMMM d, yyyy")}</CardDescription>
          </div>
          <StatusBadge status={classData.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Class Management Actions */}
        <ClassManagementActions classData={classData} />

        {/* Class Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Teacher</h3>
            <Link
              href={`/admin/teachers/${classData.teacher.id}`}
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
              {safeFormat(startTime, "h:mm a")} - {safeFormat(endTime, "h:mm a")} ({duration})
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
              classId={classData.id}
              classDate={classData.start_time}
              students={classData.enrolled_students}
              initialAttendance={classData.attendance || {}}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
