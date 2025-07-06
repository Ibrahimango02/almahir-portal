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
import { getSessionCountByTeacherId, getSessionsByTeacherId } from "@/lib/get/get-classes"
import AvatarIcon from "@/components/avatar"
import { TeacherAvailabilityDisplay } from "@/components/teacher-availability-display"
import { TeacherStudentsSection } from "@/components/teacher-students-section"

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
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
                        <WeeklySchedule sessions={adminSessions} />
                    </CardContent>
                </Card>
            </div>

            {/* Students Section */}
            <TeacherStudentsSection
                students={adminStudents}
                teacherName={`${admin.first_name} ${admin.last_name}`}
            />
        </div>
    )
}
