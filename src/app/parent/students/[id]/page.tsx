import { notFound } from "next/navigation"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, User, Users, BookOpen, Clock, UserPen } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"
import { getStudentById, getStudentParents, getStudentTeachers } from "@/lib/get/get-students"
import { getStudentClassCount, getSessionsByStudentId } from "@/lib/get/get-classes"
import React from "react"
import AvatarIcon from "@/components/avatar"


export default async function StudentDetailPage({ params }: { params: { id: string } }) {
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

    const studentClassCount = await getStudentClassCount(student.student_id)
    const studentSessions = await getSessionsByStudentId(student.student_id)

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
                                    <span className="text-2xl font-bold text-primary">{studentClassCount}</span>
                                    <span className="text-xs text-muted-foreground">Classes</span>
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
                                        <span className="text-sm break-all">{student.email}</span>
                                    </div>
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
                                                    className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm"
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
                                                    className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm"
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
                            <CardDescription>View {student.first_name}'s upcoming classes and attendance</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <WeeklySchedule sessions={studentSessions} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
