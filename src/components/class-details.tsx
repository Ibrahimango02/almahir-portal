import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceTracker } from "@/components/attendance-tracker"
import { ClassManagementActions } from "@/components/class-management-actions"
import { StatusBadge } from "@/components/status-badge"
import { formatDuration } from "@/lib/utils"
import { differenceInMinutes, format, parseISO, isValid } from "date-fns"
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
  // Add proper validation for date parsing
  let startTime: Date;
  let endTime: Date;
  let durationMinutes: number;

  try {
    startTime = parseISO(classData.start_time);
    endTime = parseISO(classData.end_time);

    // Check if dates are valid
    if (!startTime || !isValid(startTime)) {
      throw new Error('Invalid start time');
    }
    if (!endTime || !isValid(endTime)) {
      throw new Error('Invalid end time');
    }

    durationMinutes = differenceInMinutes(endTime, startTime);
  } catch (error) {
    console.error("Error parsing dates:", error);
    // Fallback to current date if parsing fails
    startTime = new Date();
    endTime = new Date();
    endTime.setHours(endTime.getHours() + 1);
    durationMinutes = 60;
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
