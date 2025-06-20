import { notFound } from "next/navigation"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, User, Users, Calendar, Edit, BookOpen, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"
import { getStudentById, getStudentParents, getStudentTeachers } from "@/lib/get/get-students"
import { getSessionsByStudentId } from "@/lib/get/get-classes"
import React from "react"
import AvatarIcon from "@/components/avatar"


export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const student = await getStudentById(id)
  const studentParents = await getStudentParents(id)

  if (!student) {
    notFound()
    return (
      <div>
        <h2>Student not found</h2>
        <Link href="/admin/students">Return to Students List</Link>
      </div>
    )
  }

  const studentSessions = await getSessionsByStudentId(student.student_id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href="/admin/students" label="Back to Students" />
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
                  <span className="text-2xl font-bold text-primary">{studentSessions.length}</span>
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
                    <span className="text-sm break-all">{student.email}</span>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Parents: {studentParents?.map((parent, index) => (
                      <React.Fragment key={parent.id}>
                        <Link
                          href={`/admin/parents/${parent.id}`}
                          className="text-primary hover:underline"
                        >
                          {parent.first_name} {parent.last_name}
                        </Link>
                        {index < studentParents.length - 1 ? ", " : ""}
                      </React.Fragment>
                    ))}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Academic Information */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Academic Information
                </h3>
                <div className="space-y-3 pl-6">
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium block text-foreground">Enrollment Date</span>
                      <span className="text-muted-foreground">
                        {format(parseISO(student.created_at), "MMMM d, yyyy")}
                      </span>
                    </div>
                  </div>
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
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">{student.notes}</p>
                </div>
              )}

              {/* Edit Button */}
              <Button
                asChild
                className="w-full mt-6 shadow-sm transition-all hover:shadow-md"
                style={{ backgroundColor: "#3d8f5b", color: "white" }}
              >
                <Link href={`/admin/students/edit/${student.student_id}`} className="flex items-center justify-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Student Information
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Class Schedule Card - Now spans 8 columns on medium screens */}
        <Card className="md:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Class Schedule</CardTitle>
              <CardDescription>View {student.first_name}'s upcoming classes and attendance</CardDescription>
            </div>
            <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
              <Link href={`/admin/students/assign-class/${student.student_id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Class
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <WeeklySchedule sessions={studentSessions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
