import { notFound } from "next/navigation"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, BookOpen, Clock } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"
import { getStudentById, getStudentParents } from "@/lib/get/get-students"
import { getClassesByStudentId, getClassesByTeacherId } from "@/lib/get/get-classes"
import { getStudentSessionHistory } from "@/lib/get/get-session-history"
import { createClient } from "@/utils/supabase/server"
import React from "react"
import AvatarIcon from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { ClassTimeDisplay } from "@/components/class-time-display"


export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Get current teacher's user ID
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const teacherId = user?.id

    const student = await getStudentById(id)
    const studentParents = await getStudentParents(id)

    if (!student) {
        notFound()
        return (
            <div>
                <h2>Student not found</h2>
                <Link href="/teacher/students">Return to Students List</Link>
            </div>
        )
    }

    // Fetch all classes for student and teacher
    const studentClasses = await getClassesByStudentId(student.student_id)
    const teacherClasses = teacherId ? await getClassesByTeacherId(teacherId) : []
    // Only classes where both teacher and student are assigned
    const sharedClasses = studentClasses.filter(sc =>
        teacherClasses.some(tc => tc.class_id === sc.class_id)
    )

    // Gather all sessions from shared classes
    const sharedSessions = sharedClasses.flatMap(cls =>
        (cls.sessions || []).map(session => ({
            ...session,
            class_id: cls.class_id,
            title: cls.title,
            subject: cls.subject,
            description: cls.description,
            class_link: cls.class_link,
            teachers: cls.teachers,
            students: cls.students,
        }))
    )

    // Fetch session history for the student
    const allStudentSessionHistory = await getStudentSessionHistory(student.student_id)
    // Only include session history for sessions in shared classes
    const sharedSessionHistory = allStudentSessionHistory.filter(sh =>
        sharedClasses.some(cls => cls.class_id === sh.class_id)
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href="/teacher/students" label="Back to Students" />
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Student Information Card - Now spans 4 columns on medium screens */}
                <Card className="md:col-span-4 overflow-hidden">
                    {/* Card Header with Background */}
                    <CardHeader className="relative pb-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-0"></div>
                        <div className="relative z-10 flex flex-col items-center pt-4">
                            <div className="relative">
                                {student.avatar_url ? (
                                    <div className="mb-4">
                                        <AvatarIcon url={student.avatar_url} size="large" />
                                    </div>
                                ) : (
                                    <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-md">
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {student.first_name[0]}
                                            {student.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <Badge
                                    className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${student.status === "active" ? "bg-green-600"
                                        : student.status === "inactive" ? "bg-amber-500"
                                            : student.status === "pending" ? "bg-blue-500"
                                                : student.status === "suspended" ? "bg-red-600"
                                                    : student.status === "archived" ? "bg-gray-500"
                                                        : "bg-gray-500"
                                        }`}
                                >
                                    {student.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl font-bold text-center mt-2">
                                {student.first_name} {student.last_name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                                <Badge variant="secondary" className="font-medium">
                                    Student
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{student.age}</span>
                                    <span className="text-xs text-muted-foreground">Age</span>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{sharedSessionHistory.length}</span>
                                    <span className="text-xs text-muted-foreground">Sessions</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Parents Section */}
                            <div>
                                <h3 className="text-base font-semibold flex items-center mb-3">
                                    <Users className="h-4 w-4 mr-2 text-primary" />
                                    Parents
                                </h3>
                                <div className="space-y-3 pl-6">
                                    {studentParents && studentParents.length > 0 ? (
                                        <div className="space-y-2">
                                            {studentParents.map((parent) => (
                                                <div key={parent.parent_id} className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        {parent.avatar_url && <AvatarImage src={parent.avatar_url} alt={parent.first_name} />}
                                                        <AvatarFallback>{parent.first_name.charAt(0)}{parent.last_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-primary truncate">
                                                            {parent.first_name} {parent.last_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center border-2 border-dashed border-muted rounded-lg">
                                            <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No parents assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Notes */}
                            {student.notes && (
                                <div>
                                    <h3 className="text-base font-semibold flex items-center mb-3">
                                        <BookOpen className="h-4 w-4 mr-2 text-primary" />
                                        Notes
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">{student.notes}</p>
                                </div>
                            )}

                            {/* Enrollment Date - Styled like Notes section */}
                            <div>
                                <h3 className="text-base font-semibold flex items-center mb-3">
                                    <Clock className="h-4 w-4 mr-2 text-primary" />
                                    Enrollment Date
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                                    {format(parseISO(student.created_at), "MMMM d, yyyy")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Class Schedule Card - Now spans 8 columns on medium screens */}
                <Card className="md:col-span-8">
                    <CardHeader>
                        <div>
                            <CardTitle>Class Schedule</CardTitle>
                            <CardDescription>View {student.first_name}&apos;s upcoming classes and attendance</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <WeeklySchedule sessions={sharedSessions} role={"student"} id={id} />
                    </CardContent>
                </Card>
            </div>

            {/* Classes Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Classes <span className="text-xs bg-muted px-2 py-1 rounded-full">{sharedClasses.length}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {sharedClasses.length > 0 ? (
                        <div className="space-y-3">
                            {sharedClasses.map((classInfo) => (
                                <div key={classInfo.class_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-base">{classInfo.title}</h3>
                                                <Badge
                                                    className={`capitalize ${classInfo.status.toLowerCase() === "active"
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                        : classInfo.status.toLowerCase() === "archived"
                                                            ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                                            : classInfo.status.toLowerCase() === "completed"
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                                                : classInfo.status.toLowerCase() === "inactive"
                                                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                                        }`}
                                                >
                                                    {classInfo.status}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground font-medium text-sm">
                                                {classInfo.subject}
                                            </p>
                                            {classInfo.description && (
                                                <p className="text-xs text-muted-foreground">{classInfo.description}</p>
                                            )}
                                            {/* Days and Times */}
                                            {classInfo.days_repeated && (
                                                <div className="mt-2 space-y-1">
                                                    {Object.entries(classInfo.days_repeated).map(([day, timeSlot]) => {
                                                        if (timeSlot) {
                                                            const dayName = day.charAt(0).toUpperCase() + day.slice(1)
                                                            // Calculate duration from UTC times (duration is timezone-independent)
                                                            const startTime = new Date(`2000-01-01T${timeSlot.start}:00`)
                                                            const endTime = new Date(`2000-01-01T${timeSlot.end}:00`)
                                                            const durationMs = endTime.getTime() - startTime.getTime()
                                                            const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
                                                            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
                                                            let durationText = ''
                                                            if (durationHours > 0 && durationMinutes > 0) {
                                                                durationText = `(${durationHours}h ${durationMinutes}m)`
                                                            } else if (durationHours > 0) {
                                                                durationText = `(${durationHours}h)`
                                                            } else if (durationMinutes > 0) {
                                                                durationText = `(${durationMinutes}m)`
                                                            }
                                                            return (
                                                                <div key={day} className="text-xs">
                                                                    {dayName}: <span className="text-muted-foreground">
                                                                        <ClassTimeDisplay utcTime={timeSlot.start} /> - <ClassTimeDisplay utcTime={timeSlot.end} /> {durationText}
                                                                    </span>
                                                                </div>
                                                            )
                                                        }
                                                        return null
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="flex items-center gap-3">
                                                <div className="text-center">
                                                    <p className="text-base font-semibold text-muted-foreground">{classInfo.sessions.length}</p>
                                                    <p className="text-xs text-muted-foreground">sessions</p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/teacher/classes/${classInfo.class_id}`}>
                                                View Details
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-medium text-muted-foreground mb-1">
                                No Classes In Common
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                You and this student are not both assigned to any classes.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sessions History Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Sessions History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {sharedSessionHistory.length > 0 ? (
                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Session Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendance</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {sharedSessionHistory.map((session) => (
                                        <tr
                                            key={session.session_id}
                                            className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                        >
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/teacher/classes/${session.class_id}/${session.session_id}`}
                                                    className="block"
                                                >
                                                    <div className="text-sm font-medium text-gray-900 hover:text-primary transition-colors">
                                                        {session.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{session.subject}</div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/teacher/classes/${session.class_id}/${session.session_id}`}
                                                    className="block"
                                                >
                                                    <div className="text-sm text-gray-900">
                                                        {format(parseISO(session.start_date), "MMMM d, yyyy")}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/teacher/classes/${session.class_id}/${session.session_id}`}
                                                    className="block"
                                                >
                                                    <div className="text-sm text-gray-900">
                                                        {format(parseISO(session.start_date), "hh:mm a")}
                                                        {session.actual_start_time && (
                                                            <span className="text-xs text-gray-500 ml-1">
                                                                (actual: {format(parseISO(session.actual_start_time), "hh:mm a")})
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/teacher/classes/${session.class_id}/${session.session_id}`}
                                                    className="block"
                                                >
                                                    <div className="text-sm text-gray-900">
                                                        {format(parseISO(session.end_date), "hh:mm a")}
                                                        {session.actual_end_time && (
                                                            <span className="text-xs text-gray-500 ml-1">
                                                                (actual: {format(parseISO(session.actual_end_time), "hh:mm a")})
                                                            </span>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/teacher/classes/${session.class_id}/${session.session_id}`}
                                                    className="block"
                                                >
                                                    <Badge
                                                        className={`capitalize px-2 py-0.5 text-xs ${session.attendance_status === "present"
                                                            ? "bg-green-100 text-green-800"
                                                            : session.attendance_status === "absent"
                                                                ? "bg-red-100 text-red-800"
                                                                : session.attendance_status === "late"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            }`}
                                                    >
                                                        {session.attendance_status}
                                                    </Badge>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                <span className="text-xs text-gray-400">No notes</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-medium text-muted-foreground mb-1">
                                No Past Sessions
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                No session history available for this student.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
