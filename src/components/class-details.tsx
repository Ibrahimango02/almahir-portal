"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Link from "next/link"
import { CalendarDays, Users, BookOpen, Link as LinkIcon, UserCircle2, Clock, Trash2, Edit } from "lucide-react"
import { getClassSessions } from "@/lib/get/get-classes"
import { deleteClass } from "@/lib/delete/delete-classes"
import { useEffect, useState } from "react"
import { ClassSessionType } from "@/types"
import { useRouter } from "next/navigation"
import { formatDateTime, utcToLocal } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"

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
      avatar_url: string | null
    }[]
    enrolled_students: {
      student_id: string
      first_name: string
      last_name: string
      avatar_url: string | null
    }[]
  }
}

export function ClassDetails({ classData }: ClassDetailsProps) {
  const [sessions, setSessions] = useState<ClassSessionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { timezone } = useTimezone()

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

  const handleDeleteClass = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteClass(classData.class_id)

      if (result.success) {
        toast({
          title: "Class Deleted",
          description: `"${classData.title}" has been successfully deleted.`,
        })
        // Redirect to classes list
        router.push("/admin/classes")
      } else {
        throw new Error(result.error || "Failed to delete class")
      }
    } catch (error) {
      console.error("Error deleting class:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete class. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

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
            <div className="flex items-center gap-2">
              <StatusBadge status={classData.status} />
              <Button
                size="icon"
                className="h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
                aria-label="Edit class"
                onClick={() => router.push(`/admin/classes/edit/${classData.class_id}`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="icon"
                    className="h-9 w-9 bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                    aria-label="Delete class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Class</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete "{classData.title}"? This action cannot be undone and will permanently remove the class and all associated data including sessions, teacher assignments, and student enrollments.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteClass}
                      disabled={isDeleting}
                      className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                    >
                      {isDeleting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Class
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          {/* Main Info Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Teachers Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCircle2 className="h-5 w-5" />
                <h3 className="text-sm font-medium">Teachers</h3>
                <span className="text-xs bg-muted px-2 py-1 rounded-full">{teachers.length}</span>
              </div>
              {teachers.length > 0 ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {teachers.map((teacher) => (
                    <Link
                      key={teacher.teacher_id}
                      href={`/admin/teachers/${teacher.teacher_id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                        <Avatar className="h-10 w-10">
                          {teacher.avatar_url && <AvatarImage src={teacher.avatar_url} alt={teacher.first_name} />}
                          <AvatarFallback>{teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-primary truncate">
                            {teacher.first_name} {teacher.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Teacher</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                  <UserCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No teachers assigned</p>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-5 w-5" />
                <h3 className="text-sm font-medium">Schedule</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium">
                  {formatDateTime(classData.start_date, "MMM d, yyyy", timezone)} - {formatDateTime(classData.end_date, "MMM d, yyyy", timezone)}
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

            {/* Students Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <h3 className="text-sm font-medium">Students Enrolled</h3>
                <span className="text-xs bg-muted px-2 py-1 rounded-full">{enrolledStudents.length}</span>
              </div>
              {enrolledStudents.length > 0 ? (
                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {enrolledStudents.map((student) => (
                    <Link
                      key={student.student_id}
                      href={`/admin/students/${student.student_id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                        <Avatar className="h-8 w-8">
                          {student.avatar_url && <AvatarImage src={student.avatar_url} alt={student.first_name} />}
                          <AvatarFallback>{student.first_name.charAt(0)}{student.last_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Student</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No students enrolled</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {classData.description && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-sm font-medium">Description</h3>
              </div>
              <p className="leading-relaxed">
                {classData.description}
              </p>
            </div>
          )}

          {/* Sessions (Scrollable) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <h3 className="text-sm font-medium">Class Sessions</h3>
              <span className="text-xs bg-muted px-2 py-1 rounded-full">{sessions.length}</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading sessions...</p>
              ) : sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <Link
                      key={session.session_id}
                      href={`/admin/classes/${classData.class_id}/${session.session_id}`}
                      className="block transition-colors hover:bg-muted/50"
                    >
                      <div className="p-2 rounded-lg border bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {formatDateTime(session.start_date, "EEEE, MMMM d", timezone)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(session.start_date, "h:mm a", timezone)} - {formatDateTime(session.end_date, "h:mm a", timezone)}
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
          </div>
        </CardContent>
      </Card>
    </>
  )
} 