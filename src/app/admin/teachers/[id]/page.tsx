import { notFound } from "next/navigation"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, Calendar, Edit, Contact, UserPen, Users, BookOpen, DollarSign, History, LibraryBig } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getTeacherById } from "@/lib/get/get-teachers"
import { getTeacherAvailability, getTeacherStudents } from "@/lib/get/get-teachers"
import { getSessionCountByTeacherId, getSessionsByTeacherId, getClassesByTeacherId } from "@/lib/get/get-classes"
import AvatarIcon from "@/components/avatar"
import { TeacherAvailabilityDisplay } from "@/components/teacher-availability-display"
import { TeacherStudentsSection } from "@/components/teacher-students-section"
import { getTeacherSessionHistory } from "@/lib/get/get-session-history"
import { getSessionRemarks } from "@/lib/get/get-session-remarks"
import { getTeacherPaymentsByTeacherId } from "@/lib/get/get-teacher-payments"
import { format, parseISO } from "date-fns"
import { createClient } from "@/utils/supabase/server"
import { checkIfAdmin, getModeratorById } from "@/lib/get/get-profiles"

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Get current user ID
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  // Check if admin
  const isAdmin = userId ? await checkIfAdmin(userId) : false;

  const { id } = await params

  const teacher = await getTeacherById(id)

  if (!teacher) {
    notFound()
    return (
      <div>
        <h2>Teacher not found</h2>
        <Link href="/admin/teachers">Return to Teachers List</Link>
      </div>
    )
  }

  const teacherSessions = await getSessionsByTeacherId(teacher.teacher_id)
  const teacherSessionCount = await getSessionCountByTeacherId(teacher.teacher_id)
  const teacherAvailability = await getTeacherAvailability(teacher.teacher_id)
  const teacherStudents = await getTeacherStudents(teacher.teacher_id)
  const teacherClasses = await getClassesByTeacherId(teacher.teacher_id)

  // Fetch moderator information if assigned
  const moderator = teacher.moderator_id ? await getModeratorById(teacher.moderator_id) : null

  // Fetch session history and attendance for each session
  const sessionsWithHistory = await getTeacherSessionHistory(teacher.teacher_id)

  // Fetch all session remarks for this teacher in parallel
  const sessionRemarksResults = await Promise.all(
    sessionsWithHistory.map((session) =>
      getSessionRemarks(session.session_id)
    )
  )
  // Map sessionId to remarks for easy lookup
  const sessionRemarksMap = new Map(
    sessionsWithHistory.map((session, idx) => [session.session_id, sessionRemarksResults[idx]])
  )

  // Fetch teacher payments
  const teacherPayments = await getTeacherPaymentsByTeacherId(teacher.teacher_id)

  // Create a mapping of session IDs to class IDs from the sessions history
  const sessionToClassMap = new Map(
    sessionsWithHistory.map(session => [session.session_id, session.class_id])
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <BackButton href="/admin/teachers" label="Back to Teachers" />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Teacher Information Card - Now spans 4 columns on medium screens */}
        <Card className="md:col-span-4 overflow-hidden">
          {/* Card Header with Background */}
          <CardHeader className="relative pb-0">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-0"></div>
            <div className="relative z-10 flex flex-col items-center pt-4">
              <div className="relative">
                {teacher.avatar_url ? (
                  <div className="mb-4">
                    <AvatarIcon url={teacher.avatar_url} size="large" />
                  </div>
                ) : (
                  <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-md">
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {teacher.first_name[0]}
                      {teacher.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Badge
                  className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${teacher.status === "active" ? "bg-green-600"
                    : teacher.status === "inactive" ? "bg-amber-500"
                      : teacher.status === "pending" ? "bg-blue-500"
                        : teacher.status === "suspended" ? "bg-red-600"
                          : teacher.status === "archived" ? "bg-gray-500"
                            : "bg-gray-500"
                    }`}
                >
                  {teacher.status}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-center mt-2">
                {teacher.first_name} {teacher.last_name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                <Badge variant="secondary" className="font-medium">
                  Teacher
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {teacher.specialization && (
                  <Badge variant="outline" className="font-medium">
                    {teacher.specialization}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-primary">${teacher.hourly_rate || 'N/A'}</span>
                  <span className="text-xs text-muted-foreground">Hourly Rate</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{teacherSessionCount}</span>
                  <span className="text-xs text-muted-foreground">Sessions</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-start">
                <UserPen className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Moderator: </span>
                  {moderator ? (
                    <span className="font-medium">{moderator.first_name} {moderator.last_name}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No moderator assigned</span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <Contact className="h-4 w-4 mr-2 text-primary" />
                  Contact Information
                </h3>
                <div className="space-y-3 pl-6">
                  <div className="flex items-start">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm break-all">{teacher.email}</span>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{teacher.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Availability */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Availability
                </h3>
                <div className="pl-6">
                  {teacherAvailability ? (
                    <TeacherAvailabilityDisplay
                      schedule={teacherAvailability.weekly_schedule}
                    />
                  ) : (
                    <div className="p-3 bg-muted/30 rounded-md">
                      <span className="text-sm text-muted-foreground">No availability set</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Notes */}
              {(
                <div>
                  <h3 className="text-base font-semibold flex items-center mb-3">
                    <BookOpen className="h-4 w-4 mr-2 text-primary" />
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">{teacher.notes}</p>
                </div>
              )}

              <Separator />

              {/* Edit Button - Only for admin */}
              {isAdmin && (
                <Button
                  asChild
                  className="w-full mt-6 shadow-sm transition-all hover:shadow-md"
                  style={{ backgroundColor: "#3d8f5b", color: "white" }}
                >
                  <Link href={`/admin/teachers/edit/${teacher.teacher_id}`} className="flex items-center justify-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Teacher Information
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Class Schedule Card - Now spans 8 columns on medium screens */}
        <Card className="md:col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Class Schedule</CardTitle>
                <CardDescription>View {teacher.first_name}&apos;s upcoming classes and schedule</CardDescription>
              </div>
              <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                <Link href={`/admin/teachers/assign-class/${teacher.teacher_id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  Assign Class
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklySchedule
              sessions={teacherSessions}
              role={"teacher"}
              id={id}
            />
          </CardContent>
        </Card>
      </div>

      {/* Classes Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <LibraryBig className="h-5 w-5 text-primary" />
            Classes <span className="text-xs bg-muted px-2 py-1 rounded-full">{teacherClasses.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teacherClasses.length > 0 ? (
            <div className="space-y-3">
              {teacherClasses.map((classInfo) => (
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
                      <Link href={`/admin/classes/${classInfo.class_id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <LibraryBig className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-medium text-muted-foreground mb-1">
                No Classes Assigned
              </h3>
              <p className="text-sm text-muted-foreground">
                {teacher.first_name} is not assigned to any classes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sessions History Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
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
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Session Summary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sessionsWithHistory.map((session) => {
                    const remarksObj = sessionRemarksMap.get(session.session_id)
                    return (
                      <tr
                        key={session.session_id}
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Link
                            href={`/admin/classes/${session.class_id}/${session.session_id}`}
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
                            href={`/admin/classes/${session.class_id}/${session.session_id}`}
                            className="block"
                          >
                            <div className="text-sm text-gray-900">
                              {format(parseISO(session.start_date), "MMMM d, yyyy")}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Link
                            href={`/admin/classes/${session.class_id}/${session.session_id}`}
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
                            href={`/admin/classes/${session.class_id}/${session.session_id}`}
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
                            href={`/admin/classes/${session.class_id}/${session.session_id}`}
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
                          {remarksObj && remarksObj.session_summary ? (
                            <span title={remarksObj.session_summary}>
                              {remarksObj.session_summary.length > 40
                                ? remarksObj.session_summary.slice(0, 40) + "..."
                                : remarksObj.session_summary}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No summary</span>
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
              <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-medium text-muted-foreground mb-1">
                No Past Sessions
              </h3>
              <p className="text-sm text-muted-foreground">
                No session history available for this teacher.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Section - Only for admin */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Payments <span className="text-xs bg-muted px-2 py-1 rounded-full">{teacherPayments ? teacherPayments.length : 0}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teacherPayments && teacherPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Session</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {teacherPayments.map((payment, idx) => (
                      <tr key={payment.payment_id || idx} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {payment.session?.class_title || 'N/A'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/classes/${sessionToClassMap.get(payment.session.session_id) || 'unknown'}/${payment.session.session_id}`}
                            className="text-primary hover:underline"
                          >
                            {payment.session?.start_date ? format(parseISO(payment.session.start_date), "MMM dd, yyyy") : "N/A"}
                          </Link>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{payment.hours}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{Number(payment.amount).toFixed(2)} CAD</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {payment.paid_date ? format(parseISO(payment.paid_date), "MMM d, yyyy") : "-"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                          <span
                            className={
                              `inline-block px-2 py-0.5 rounded-full text-xs font-semibold ` +
                              (payment.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : payment.status === 'overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800')
                            }
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-medium text-muted-foreground mb-1">
                  No Payments
                </h3>
                <p className="text-sm text-muted-foreground">
                  No payments found for this teacher.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Students Section */}
      <TeacherStudentsSection
        students={teacherStudents}
        teacherName={`${teacher.first_name} ${teacher.last_name}`}
      />
    </div>
  )
}
