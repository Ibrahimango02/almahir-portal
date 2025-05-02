import { notFound } from "next/navigation"
import { StudentSchedule } from "@/components/student-schedule"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, User, Calendar, Edit, GraduationCap, BookOpen, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { BackButton } from "@/components/back-button"

// Mock data based on the database schema
const students = [
  {
    id: "S001",
    first_name: "Emma",
    last_name: "Smith",
    grade_level: "10th",
    age: 16,
    parent: "John Smith",
    email: "emma.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Physics", "English"],
    birth_date: "2007-05-15T00:00:00",
    notes: "Excellent student with a keen interest in mathematics and science.",
    created_at: "2021-09-01T00:00:00",
    updated_at: "2023-01-15T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S002",
    first_name: "Noah",
    last_name: "Smith",
    grade_level: "8th",
    age: 14,
    parent: "John Smith",
    email: "noah.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Biology", "History"],
    birth_date: "2009-08-22T00:00:00",
    notes: "Shows great potential in history and social studies.",
    created_at: "2021-09-01T00:00:00",
    updated_at: "2023-01-15T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S003",
    first_name: "Sophia",
    last_name: "Garcia",
    grade_level: "11th",
    age: 17,
    parent: "Maria Garcia",
    email: "sophia.garcia@student.almahir.edu",
    enrolledClasses: ["Chemistry", "Spanish", "Art"],
    birth_date: "2006-03-10T00:00:00",
    notes: "Bilingual student with exceptional artistic abilities.",
    created_at: "2022-01-15T00:00:00",
    updated_at: "2023-02-20T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S004",
    first_name: "William",
    last_name: "Johnson",
    grade_level: "9th",
    age: 15,
    parent: "James Johnson",
    email: "william.johnson@student.almahir.edu",
    enrolledClasses: ["Physics", "Computer Science", "English"],
    birth_date: "2008-11-05T00:00:00",
    notes: "Shows strong aptitude for computer science and programming.",
    created_at: "2020-09-10T00:00:00",
    updated_at: "2023-01-10T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S005",
    first_name: "Olivia",
    last_name: "Johnson",
    grade_level: "7th",
    age: 13,
    parent: "James Johnson",
    email: "olivia.johnson@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Music", "Art"],
    birth_date: "2010-07-18T00:00:00",
    notes: "Talented musician with a focus on piano and violin.",
    created_at: "2020-09-10T00:00:00",
    updated_at: "2023-01-10T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S006",
    first_name: "Liam",
    last_name: "Johnson",
    grade_level: "12th",
    age: 18,
    parent: "James Johnson",
    email: "liam.johnson@student.almahir.edu",
    enrolledClasses: ["Physics", "Chemistry", "Mathematics"],
    birth_date: "2005-02-28T00:00:00",
    notes: "Preparing for college with a focus on engineering programs.",
    created_at: "2020-09-10T00:00:00",
    updated_at: "2023-01-10T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S007",
    first_name: "Ava",
    last_name: "Brown",
    grade_level: "10th",
    age: 16,
    parent: "Patricia Brown",
    email: "ava.brown@student.almahir.edu",
    enrolledClasses: ["Biology", "English", "History"],
    birth_date: "2007-09-12T00:00:00",
    notes: "Interested in pursuing a career in medicine or healthcare.",
    created_at: "2021-11-25T00:00:00",
    updated_at: "2023-03-05T00:00:00",
    status: "active",
    classes_count: 3,
  },
]

// Mock data for student classes
const getStudentClasses = (studentId: string) => {
  // In a real app, this would be a database query joining classes and class_students tables
  const mockClasses = [
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
      teacher: { first_name: "Sarah", last_name: "Johnson" },
      attendance_status: "present",
    },
    {
      id: 4,
      teacher_id: "T004",
      title: "Chemistry Basics",
      description: "Introduction to chemical principles",
      subject: "Chemistry",
      start_time: "2023-04-17T17:30:00",
      end_time: "2023-04-17T19:00:00",
      status: "scheduled",
      max_students: 15,
      class_link: "https://meet.google.com/456-789-abc",
      teacher: { first_name: "Robert", last_name: "Wilson" },
      attendance_status: "present",
    },
    {
      id: 7,
      teacher_id: "T002",
      title: "Physics Fundamentals",
      description: "Basic principles of physics",
      subject: "Physics",
      start_time: "2023-04-18T11:00:00",
      end_time: "2023-04-18T12:30:00",
      status: "scheduled",
      max_students: 12,
      class_link: "https://meet.google.com/jkl-mnop-qrs",
      teacher: { first_name: "Michael", last_name: "Chen" },
      attendance_status: "absent",
    },
    {
      id: 9,
      teacher_id: "T003",
      title: "English Literature",
      description: "Analysis of classic literature",
      subject: "English",
      start_time: "2023-04-19T14:30:00",
      end_time: "2023-04-19T16:00:00",
      status: "scheduled",
      max_students: 20,
      class_link: "https://meet.google.com/tuv-wxyz-123",
      teacher: { first_name: "Emily", last_name: "Davis" },
      attendance_status: "pending",
    },
    {
      id: 12,
      teacher_id: "T001",
      title: "Advanced Mathematics",
      description: "Complex mathematical concepts",
      subject: "Mathematics",
      start_time: "2023-04-20T10:00:00",
      end_time: "2023-04-20T11:30:00",
      status: "scheduled",
      max_students: 10,
      class_link: "https://meet.google.com/def-ghi-jkl",
      teacher: { first_name: "Sarah", last_name: "Johnson" },
    },
    {
      id: 15,
      teacher_id: "T002",
      title: "Physics Lab",
      description: "Practical physics experiments",
      subject: "Physics",
      start_time: "2023-04-21T13:00:00",
      end_time: "2023-04-21T14:30:00",
      status: "scheduled",
      max_students: 15,
      class_link: "https://meet.google.com/mno-pqr-stu",
      teacher: { first_name: "Michael", last_name: "Chen" },
    },
  ]

  // Filter classes based on the student's enrolled subjects
  const student = students.find((s) => s.id === studentId)
  if (!student) return []

  return mockClasses.filter((cls) => student.enrolledClasses.includes(cls.subject))
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = students.find((s) => s.id === params.id)

  if (!student) {
    notFound()
    return (
      <div>
        <h2>Student not found</h2>
        <Link href="/admin/students">Return to Students List</Link>
      </div>
    )
  }

  const studentClasses = getStudentClasses(student.id)

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
                <Avatar className="h-28 w-28 mb-4 border-4 border-background shadow-md">
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {student.first_name[0]}
                    {student.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <Badge className="absolute bottom-4 right-0 capitalize px-2 py-1 bg-green-500">{student.status}</Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-center mt-2">
                {student.first_name} {student.last_name}
              </CardTitle>
              <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                <Badge variant="secondary" className="font-medium">
                  {student.grade_level} Grade
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
                  <span className="text-2xl font-bold text-primary">{student.classes_count}</span>
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
                  <div className="flex items-start">
                    <GraduationCap className="h-4 w-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Parent: {student.parent}</span>
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
              {student.notes && (
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
                className="w-full mt-6 bg-primary/90 hover:bg-primary text-white shadow-sm transition-all hover:shadow-md"
              >
                <Link href={`/admin/students/${student.id}/edit`} className="flex items-center justify-center gap-2">
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
            <Link href={`/admin/students/${student.id}/assign-to-class`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Assign Class
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <StudentSchedule classes={studentClasses} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
