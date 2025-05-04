import { notFound } from "next/navigation"
import { TeacherSchedule } from "@/components/teacher-schedule"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, BookOpen, User, Calendar, Edit, Plus } from "lucide-react"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getTeacherById } from "@/lib/get-teachers"
import { getClassesByTeacherId } from "@/lib/get-classes"

// Mock classes data for the teacher
const getTeacherClasses = (teacherId: string) => {
  // In a real app, this would be a database query
  return [
    {
      id: 1,
      teacher_id: "T001",
      title: "Mathematics 101",
      description: "Introduction to algebra and geometry",
      subject: "Mathematics",
      start_time: "2023-04-17T08:00:00",
      end_time: "2023-04-17T09:30:00",
      status: "scheduled",
      max_students: 15,
      class_link: "https://meet.google.com/abc-defg-hij",
    },
    {
      id: 2,
      teacher_id: "T002",
      title: "Physics Fundamentals",
      description: "Basic principles of physics",
      subject: "Physics",
      start_time: "2023-04-17T11:00:00",
      end_time: "2023-04-17T12:30:00",
      status: "scheduled",
      max_students: 12,
      class_link: "https://meet.google.com/jkl-mnop-qrs",
    },
    {
      id: 3,
      teacher_id: "T003",
      title: "English Literature",
      description: "Analysis of classic literature",
      subject: "English",
      start_time: "2023-04-17T14:30:00",
      end_time: "2023-04-17T16:00:00",
      status: "scheduled",
      max_students: 20,
      class_link: "https://meet.google.com/tuv-wxyz-123",
    },
    {
      id: 4,
      teacher_id: "T001",
      title: "Advanced Mathematics",
      description: "Complex mathematical concepts",
      subject: "Mathematics",
      start_time: "2023-04-18T10:00:00",
      end_time: "2023-04-18T11:30:00",
      status: "scheduled",
      max_students: 10,
      class_link: "https://meet.google.com/def-ghi-jkl",
    },
    {
      id: 5,
      teacher_id: "T001",
      title: "Calculus I",
      description: "Introduction to calculus",
      subject: "Mathematics",
      start_time: "2023-04-19T13:00:00",
      end_time: "2023-04-19T14:30:00",
      status: "scheduled",
      max_students: 15,
      class_link: "https://meet.google.com/mno-pqr-stu",
    },
    {
      id: 6,
      teacher_id: "T001",
      title: "Geometry",
      description: "Study of shapes and spaces",
      subject: "Mathematics",
      start_time: "2023-04-20T09:00:00",
      end_time: "2023-04-20T10:30:00",
      status: "scheduled",
      max_students: 18,
      class_link: "https://meet.google.com/vwx-yza-bcd",
    },
    {
      id: 7,
      teacher_id: "T001",
      title: "Algebra II",
      description: "Advanced algebraic concepts",
      subject: "Mathematics",
      start_time: "2023-04-21T15:00:00",
      end_time: "2023-04-21T16:30:00",
      status: "scheduled",
      max_students: 12,
      class_link: "https://meet.google.com/efg-hij-klm",
    },
  ].filter((cls) => cls.teacher_id === teacherId)
}

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const teacher = await getTeacherById(id)

  if (!teacher) {
    notFound()
  }

  const teacherClasses = await getClassesByTeacherId(teacher.teacher_id)

  console.log(teacherClasses)

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
                <Avatar className="h-28 w-28 mb-4 border-4 border-background shadow-md">
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {teacher.first_name[0]}
                    {teacher.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <Badge
                  className={`absolute bottom-4 right-0 capitalize px-2 py-1 ${teacher.status === "active" ? "bg-green-500"
                    : teacher.status === "inactive" ? "bg-amber-500"
                      : teacher.status === "pending" ? "bg-blue-500"
                        : teacher.status === "suspended" ? "bg-red-500"
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
                {teacher.specialization && (
                  <Badge variant="secondary" className="font-medium">
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
                  <span className="text-2xl font-bold text-primary">{teacherClasses.length}</span>
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
                  <div className="p-3 bg-muted/30 rounded-md">
                    <span className="text-sm text-muted-foreground">Schedule information not available</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Biography */}
              <div>
                <h3 className="text-base font-semibold flex items-center mb-3">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Biography
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">No biography available</p>
              </div>

              {/* Edit Button */}
              <Button
                asChild
                className="w-full mt-6 bg-primary/90 hover:bg-primary text-white shadow-sm transition-all hover:shadow-md"
              >
                <Link href={`/admin/teachers/${teacher.teacher_id}/edit`} className="flex items-center justify-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Teacher Information
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Class Schedule Card - Now spans 8 columns on medium screens */}
        <Card className="md:col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Class Schedule</CardTitle>
                <CardDescription>View {teacher.first_name}'s upcoming classes and schedule</CardDescription>
              </div>
              <Link href={`/admin/teachers/${teacher.teacher_id}/assign-class`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Class
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <TeacherSchedule classes={teacherClasses} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
