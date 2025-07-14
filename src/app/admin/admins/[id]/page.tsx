import { notFound } from "next/navigation"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, User, Calendar, Plus, BookOpen } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getTeacherById } from "@/lib/get/get-teachers"
import { getTeacherAvailability, getTeacherStudents } from "@/lib/get/get-teachers"
import { getSessionCountByTeacherId, getSessionsByTeacherId, getClassesByTeacherId } from "@/lib/get/get-classes"
import AvatarIcon from "@/components/avatar"
import { TeacherAvailabilityDisplay } from "@/components/teacher-availability-display"
import { TeacherStudentsSection } from "@/components/teacher-students-section"
import { createClient } from "@/utils/supabase/server"

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Get current user data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()

    const admin = await getTeacherById(id)

    if (!admin) {
        notFound()
        return (
            <div>
                <h2>Admin not found</h2>
                <Link href="/admin/admins">Return to Admins List</Link>
            </div>
        )
    }

    const adminSessions = await getSessionsByTeacherId(admin.teacher_id)
    const adminSessionCount = await getSessionCountByTeacherId(admin.teacher_id)
    const adminAvailability = await getTeacherAvailability(admin.teacher_id)
    const adminStudents = await getTeacherStudents(admin.teacher_id)
    const adminClasses = await getClassesByTeacherId(admin.teacher_id)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
                <BackButton href="/admin/admins" label="Back to Admins" />
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Admin Information Card - Now spans 4 columns on medium screens */}
                <Card className="md:col-span-4 overflow-hidden">
                    {/* Card Header with Background */}
                    <CardHeader className="relative pb-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-0"></div>
                        <div className="relative z-10 flex flex-col items-center pt-4">
                            <div className="relative">
                                {admin.avatar_url ? (
                                    <div className="mb-4">
                                        <AvatarIcon url={admin.avatar_url} size="large" />
                                    </div>
                                ) : (
                                    <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-md">
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {admin.first_name[0]}
                                            {admin.last_name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <Badge
                                    className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${admin.status === "active" ? "bg-green-600"
                                        : admin.status === "inactive" ? "bg-amber-500"
                                            : admin.status === "pending" ? "bg-blue-500"
                                                : admin.status === "suspended" ? "bg-red-600"
                                                    : admin.status === "archived" ? "bg-gray-500"
                                                        : "bg-gray-500"
                                        }`}
                                >
                                    {admin.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl font-bold text-center mt-2">
                                {admin.first_name} {admin.last_name}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                                <Badge variant="secondary" className="font-medium">
                                    Admin
                                </Badge>
                                {admin.specialization && (
                                    <Badge variant="outline" className="font-medium">
                                        {admin.specialization}
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
                                    <span className="text-2xl font-bold text-primary">N/A</span>
                                    <span className="text-xs text-muted-foreground">Hourly Rate</span>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">{adminSessionCount}</span>
                                    <span className="text-xs text-muted-foreground">Sessions</span>
                                </div>
                            </div>

                            <Separator />

                            {/* Contact Information */}
                            <div>
                                <h3 className="text-base font-semibold flex items-center mb-3">
                                    <User className="h-4 w-4 mr-2 text-primary" />
                                    Contact Information
                                </h3>
                                <div className="space-y-3 pl-6">
                                    <div className="flex items-start">
                                        <Mail className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm break-all">{admin.email}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <Phone className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{admin.phone || 'Not provided'}</span>
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
                                    {adminAvailability ? (
                                        <TeacherAvailabilityDisplay
                                            schedule={adminAvailability.weekly_schedule}
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
                            {admin.notes && (
                                <div>
                                    <h3 className="text-base font-semibold flex items-center mb-3">
                                        <BookOpen className="h-4 w-4 mr-2 text-primary" />
                                        Notes
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">{admin.notes}</p>
                                </div>
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
                                <CardDescription>View {admin.first_name}&apos;s upcoming classes and schedule</CardDescription>
                            </div>
                            <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                                <Link href={`/admin/admins/assign-class/${id}`}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Assign Class
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <WeeklySchedule
                            sessions={adminSessions}
                            role={"admin"}
                            id={id}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Classes Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Classes - ({adminClasses.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {adminClasses.length > 0 ? (
                        <div className="space-y-3">
                            {adminClasses.map((classInfo) => (
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
                                                                <div key={day} className="text-xs text-muted-foreground">
                                                                    {dayName}: {timeSlot.start} - {timeSlot.end} {durationText}
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
                                                <div className="text-center">
                                                    <p className="text-base font-semibold text-muted-foreground">{classInfo.enrolled_students.length}</p>
                                                    <p className="text-xs text-muted-foreground">students</p>
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
                            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-medium text-muted-foreground mb-1">
                                No Classes Assigned
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {admin.first_name} is not assigned to any classes.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Students Section */}
            <TeacherStudentsSection
                students={adminStudents}
                teacherName={`${admin.first_name} ${admin.last_name}`}
            />
        </div>
    )
}
