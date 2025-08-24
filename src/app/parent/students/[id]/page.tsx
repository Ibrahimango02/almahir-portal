import { notFound } from "next/navigation"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, BookOpen, Clock, UserPen, CreditCard, Receipt, DollarSign } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"
import { Button } from "@/components/ui/button"
import { getStudentById, getStudentParents, getStudentTeachers } from "@/lib/get/get-students"
import { getSessionCountByStudentId, getSessionsByStudentId, getClassesByStudentId } from "@/lib/get/get-classes"
import { getSubscriptionInfoByStudentId } from "@/lib/get/get-subscriptions"
import { getStudentSessionHistory } from "@/lib/get/get-session-history"
import { getStudentSessionNotesForStudent } from "@/lib/get/get-session-remarks"
import { getInvoicesByStudentId } from "@/lib/get/get-invoices"
import { getStudentTotalHours } from "@/lib/get/get-students"
import React from "react"
import AvatarIcon from "@/components/avatar"
import { formatMonthRange } from "@/lib/utils/format-month-range"


export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const student = await getStudentById(id)
    const studentParents = await getStudentParents(id)
    const studentTeachers = await getStudentTeachers(id)

    if (!student) {
        notFound()
        return (
            <div>
                <h2>Student not found</h2>
                <Link href="/parent/students">Return to Students List</Link>
            </div>
        )
    }

    const studentSessions = await getSessionsByStudentId(student.student_id)
    const studentSessionCount = await getSessionCountByStudentId(student.student_id)
    const studentClasses = await getClassesByStudentId(student.student_id)
    const studentSubscription = await getSubscriptionInfoByStudentId(student.student_id)
    const studentTotalHours = await getStudentTotalHours(student.student_id)
    const invoices = await getInvoicesByStudentId(student.student_id)

    // Fetch session history and attendance for each session
    const sessionsWithHistory = await getStudentSessionHistory(student.student_id)

    // Fetch all session notes for this student in parallel
    const sessionNotesResults = await Promise.all(
        sessionsWithHistory.map((session) =>
            getStudentSessionNotesForStudent(session.session_id, student.student_id)
        )
    )
    // Map sessionId to notes for easy lookup
    const sessionNotesMap = new Map(
        sessionsWithHistory.map((session, idx) => [session.session_id, sessionNotesResults[idx]])
    )

    // Determine if hours used exceeds monthly hours
    const monthlyHours = studentSubscription?.subscription?.hours_per_month ?? 0
    const isOverLimit = studentTotalHours > monthlyHours
    const isUnderLimit = studentTotalHours < monthlyHours
    const isExactLimit = studentTotalHours === monthlyHours

    // Determine card color classes for hours 
    let hoursTextColor = 'text-primary'
    let hoursBgColor = ''
    if (isOverLimit) {
        hoursTextColor = 'text-red-600'
        hoursBgColor = 'bg-red-50'
    } else if (isUnderLimit) {
        hoursTextColor = 'text-yellow-600'
        hoursBgColor = 'bg-yellow-50'
    } else if (isExactLimit) {
        hoursTextColor = 'text-green-600'
        hoursBgColor = 'bg-green-50'
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <BackButton href="/parent/students" label="Back to Students" />
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
                                    <span className="text-2xl font-bold text-primary">{studentSessionCount}</span>
                                    <span className="text-xs text-muted-foreground">Sessions</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Teachers Section */}
                            <div>
                                <h3 className="text-base font-semibold flex items-center mb-3">
                                    <UserPen className="h-4 w-4 mr-2 text-primary" />
                                    Teachers
                                </h3>
                                <div className="space-y-3 pl-6">
                                    {studentTeachers && studentTeachers.length > 0 ? (
                                        <div className="space-y-2">
                                            {studentTeachers.map((teacher) => (
                                                <div
                                                    key={teacher.teacher_id}
                                                    className="flex items-center gap-3 p-2 rounded-lg bg-card"
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        {teacher.avatar_url && <AvatarImage src={teacher.avatar_url} alt={teacher.first_name} />}
                                                        <AvatarFallback>{teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-primary truncate">
                                                            {teacher.first_name} {teacher.last_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {teacher.specialization || 'Teacher'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center border-2 border-dashed border-muted rounded-lg">
                                            <UserPen className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">No teachers assigned</p>
                                        </div>
                                    )}
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
                                                <div
                                                    key={parent.parent_id}
                                                    className="flex items-center gap-3 p-2 rounded-lg bg-card"
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        {parent.avatar_url && <AvatarImage src={parent.avatar_url} alt={parent.first_name} />}
                                                        <AvatarFallback>{parent.first_name.charAt(0)}{parent.last_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-primary truncate">
                                                            {parent.first_name} {parent.last_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {parent.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-2 rounded-lg bg-card">
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
                        <WeeklySchedule sessions={studentSessions} role={"student"} id={id} />
                    </CardContent>
                </Card>
            </div>

            {/* Enrolled Classes Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Classes <span className="text-xs bg-muted px-2 py-1 rounded-full">{studentClasses.length}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {studentClasses.length > 0 ? (
                        <div className="space-y-3">
                            {studentClasses.map((classInfo) => (
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
                                                                    ? "bg-amber-100 text-amber-800 dark:bg-gray-900 dark:text-amber-300"
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

                                                            // Calculate duration
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
                                                                    {dayName}: <span className="text-muted-foreground">{timeSlot.start} - {timeSlot.end} {durationText}</span>
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
                                            <Link href={`/parent/classes/${classInfo.class_id}`}>
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
                                No Classes Enrolled
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {student.first_name} is not enrolled in any classes.
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
                    {sessionsWithHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Session Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Time</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendance</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {sessionsWithHistory.map((session) => {
                                        const notesObj = sessionNotesMap.get(session.session_id)
                                        return (
                                            <tr
                                                key={session.session_id}
                                                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                            >
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <Link
                                                        href={`/parent/classes/${session.class_id}/${session.session_id}`}
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
                                                        href={`/parent/classes/${session.class_id}/${session.session_id}`}
                                                        className="block"
                                                    >
                                                        <div className="text-sm text-gray-900">
                                                            {format(parseISO(session.start_date), "MMMM d, yyyy")}
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <Link
                                                        href={`/parent/classes/${session.class_id}/${session.session_id}`}
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
                                                        href={`/parent/classes/${session.class_id}/${session.session_id}`}
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
                                                        href={`/parent/classes/${session.class_id}/${session.session_id}`}
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
                                                    {notesObj && notesObj.notes ? (
                                                        <span title={notesObj.notes}>
                                                            {notesObj.notes.length > 40
                                                                ? notesObj.notes.slice(0, 40) + "..."
                                                                : notesObj.notes}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No notes</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
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

            {/* Subscription Information Section */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Subscription Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {studentSubscription ? (
                        <div className="space-y-4">
                            {/* Top Row: Status and Plan */}
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">Status: </span>
                                    <Badge
                                        className={`capitalize px-2 py-1 text-xs ${studentSubscription.status === "active" ? "bg-green-600" :
                                            studentSubscription.status === "inactive" ? "bg-amber-500" :
                                                studentSubscription.status === "expired" ? "bg-red-600" :
                                                    "bg-gray-500"
                                            }`}
                                    >
                                        {studentSubscription.status}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{studentSubscription.subscription?.name}</p>
                                    <p className="text-xs text-muted-foreground">Current Plan</p>
                                </div>
                            </div>

                            {/* Middle Row: Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Start Date</h4>
                                    <p className="text-sm font-semibold">
                                        {studentSubscription.start_date ? format(parseISO(studentSubscription.start_date), "MMM d, yyyy") : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Next Payment Date</h4>
                                    <p className="text-sm font-semibold">
                                        {studentSubscription.next_payment_date ? format(parseISO(studentSubscription.next_payment_date), "MMM d, yyyy") : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Row: Fee and Hours */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-lg bg-white">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">Subscription Fee</span>
                                    </div>
                                    <p className="text-xl font-bold text-primary">
                                        {studentSubscription.subscription?.total_amount} CAD
                                    </p>
                                    <p className="text-xs text-muted-foreground">every {studentSubscription.subscription?.rate} months</p>
                                </div>

                                <div className={`p-3 border rounded-lg ${hoursBgColor}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className={`h-4 w-4 ${hoursTextColor}`} />
                                        <span className={`text-sm font-medium ${hoursTextColor}`}>Monthly Hours</span>
                                    </div>
                                    <p className={`text-xl font-bold ${hoursTextColor}`}>
                                        {studentTotalHours} / {monthlyHours}
                                    </p>
                                    <p className={`text-xs ${hoursTextColor}`}>used / available</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-medium text-muted-foreground mb-1">
                                No Active Subscription
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                This student doesn&apos;t have an active subscription plan.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoices Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        Invoices <span className="text-xs bg-muted px-2 py-1 rounded-full">{invoices ? invoices.length : 0}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {invoices && invoices.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Months</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parents</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.invoice_id} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                                            <td className="px-4 py-2 text-sm">
                                                <span className="inline-block bg-muted px-2 py-0.5 rounded-full font-medium text-primary">
                                                    {formatMonthRange(invoice.months)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                {invoice.parent ? `${invoice.parent.first_name} ${invoice.parent.last_name}` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                {invoice.subscription?.total_amount?.toFixed(2) || '0.00'} CAD
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.due_date ? format(parseISO(invoice.due_date), "MMM dd, yyyy") : "-"}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.paid_date ? format(parseISO(invoice.paid_date), "MMM dd, yyyy") : "-"}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                                                <span
                                                    className={
                                                        `inline-block px-2 py-0.5 rounded-full text-xs font-semibold ` +
                                                        (invoice.status === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : invoice.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : invoice.status === 'overdue'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800')
                                                    }
                                                >
                                                    {invoice.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-medium text-muted-foreground mb-1">
                                No Invoices
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                No invoices found for this student.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
