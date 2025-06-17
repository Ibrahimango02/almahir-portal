"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { format } from "date-fns"
import Link from "next/link"
import { CalendarDays, Users, BookOpen, Link as LinkIcon, UserCircle2, Clock } from "lucide-react"
import { getClassSessions } from "@/lib/get/get-classes"
import { useEffect, useState } from "react"
import { ClassSessionType } from "@/types"

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
  }
`

type ClassDetailsProps = {
  classData: {
    class_id: string
    title: string
    description: string | null
    subject: string
    start_date: string
    end_date: string
    status: string
    days_repeated: string[]
    class_link: string | null
    teachers: {
      teacher_id: string
      first_name: string
      last_name: string
    }[]
    enrolled_students: {
      student_id: string
      first_name: string
      last_name: string
    }[]
  }
}

export function ClassDetails({ classData }: ClassDetailsProps) {
  const [sessions, setSessions] = useState<ClassSessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionsData = await getClassSessions(classData.class_id)
        setSessions(sessionsData)
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [classData.class_id])

  // Ensure arrays are defined
  const teachers = classData.teachers || []
  const enrolledStudents = classData.enrolled_students || []
  const daysRepeated = classData.days_repeated || []

  return (
    <>
      <style>{scrollbarStyles}</style>
      <Card>
        <CardHeader className="border-b pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{classData.title}</CardTitle>
              <CardDescription className="text-lg">{classData.subject}</CardDescription>
            </div>
            <StatusBadge status={classData.status} />
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Class Info */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCircle2 className="h-5 w-5" />
                <h3 className="text-sm font-medium">Teachers</h3>
              </div>
              <div className="space-y-2">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <Link
                      key={teacher.teacher_id}
                      href={`/admin/teachers/${teacher.teacher_id}`}
                      className="text-base font-medium mt-1 hover:underline text-primary inline-block"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-primary">
                          {teacher.first_name} {teacher.last_name}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No teachers assigned</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
                <h3 className="text-sm font-medium">Schedule</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium">
                  {format(new Date(classData.start_date), "MMM d, yyyy")} - {format(new Date(classData.end_date), "MMM d, yyyy")}
                </p>
                {daysRepeated.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {daysRepeated.map((day) => (
                      <span
                        key={day}
                        className="px-2 py-1 text-sm bg-muted rounded-md"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Students Enrolled</h3>
                </div>
                <p className="text-sm text-muted-foreground">{enrolledStudents.length} students</p>
              </div>
              {enrolledStudents.length > 0 ? (
                <div className="h-[88px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {enrolledStudents.map((student) => (
                    <Link
                      key={student.student_id}
                      href={`/admin/students/${student.student_id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-primary">
                          {student.first_name} {student.last_name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No students enrolled</p>
              )}
            </div>

            {(
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LinkIcon className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Class Link</h3>
                </div>
                <a
                  href={classData.class_link || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm text-primary truncate">
                      {classData.class_link}
                    </p>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {classData.description && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-sm font-medium">Description</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {classData.description}
              </p>
            </div>
          )}

          {/* Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <h3 className="text-sm font-medium">Class Sessions</h3>
              </div>
              <p className="text-sm text-muted-foreground">{sessions.length} sessions</p>
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            ) : sessions.length > 0 ? (
              <div className="h-[300px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {sessions.map((session) => (
                  <Link
                    key={session.session_id}
                    href={`/admin/classes/${classData.class_id}/${session.session_id}`}
                    className="block transition-colors hover:bg-muted/50"
                  >
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(session.date), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(`2000-01-01T${session.start_time}`), "h:mm a")} -{" "}
                            {format(new Date(`2000-01-01T${session.end_time}`), "h:mm a")}
                          </p>
                        </div>
                        <StatusBadge status={session.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sessions scheduled</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
} 