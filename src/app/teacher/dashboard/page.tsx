"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format, parseISO, differenceInMinutes } from "date-fns"
import { ClassActionButtons } from "@/components/class-action-buttons"

// Mock data for teacher's classes
const teacherClasses = {
  upcoming: [
    {
      id: "1",
      title: "Mathematics 101",
      subject: "Mathematics",
      topic: "Algebra Fundamentals",
      start_time: "2023-04-14T09:00:00",
      end_time: "2023-04-14T10:30:00",
      status: "scheduled",
      students: ["Ahmed Ali", "Fatima Khan", "Zainab Hussein", "Omar Farooq"],
      students_count: 4,
      max_students: 10,
      class_link: "https://zoom.us/j/123456789",
    },
    {
      id: "2",
      title: "Mathematics 102",
      subject: "Mathematics",
      topic: "Geometry Basics",
      start_time: "2023-04-14T11:30:00",
      end_time: "2023-04-14T12:30:00",
      status: "scheduled",
      students: ["Layla Mohammed", "Ibrahim Yusuf", "Aisha Mahmoud", "Yousef Ahmed"],
      students_count: 4,
      max_students: 10,
      class_link: "https://zoom.us/j/987654321",
    },
    {
      id: "3",
      title: "Advanced Mathematics",
      subject: "Mathematics",
      topic: "Calculus Introduction",
      start_time: "2023-04-14T14:00:00",
      end_time: "2023-04-14T15:00:00",
      status: "scheduled",
      students: ["Noor Abdullah", "Khalid Rahman", "Mariam Saleh", "Hassan Malik"],
      students_count: 4,
      max_students: 10,
      class_link: "https://zoom.us/j/456789123",
    },
  ],
  recent: [
    {
      id: "4",
      title: "Mathematics 201",
      subject: "Mathematics",
      topic: "Trigonometry Concepts",
      start_time: "2023-04-13T09:00:00",
      end_time: "2023-04-13T10:30:00",
      status: "completed",
      students: ["Ahmed Ali", "Fatima Khan", "Zainab Hussein", "Omar Farooq"],
      students_count: 4,
      max_students: 10,
      class_link: "https://zoom.us/j/123456789",
    },
    {
      id: "5",
      title: "Mathematics 202",
      subject: "Mathematics",
      topic: "Linear Algebra",
      start_time: "2023-04-13T11:30:00",
      end_time: "2023-04-13T12:30:00",
      status: "completed",
      students: ["Layla Mohammed", "Ibrahim Yusuf", "Aisha Mahmoud", "Yousef Ahmed"],
      students_count: 4,
      max_students: 10,
      class_link: "https://zoom.us/j/987654321",
    },
  ],
}

// Helper function to format duration
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} mins`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} mins` : `${hours} hr`
}

// Component to display upcoming classes
function TeacherUpcomingClasses() {
  return (
    <div className="space-y-4">
      {teacherClasses.upcoming.map((cls) => {
        const startTime = parseISO(cls.start_time)
        const endTime = parseISO(cls.end_time)
        const durationMinutes = differenceInMinutes(endTime, startTime)
        const durationText = formatDuration(durationMinutes)

        return (
          <Card key={cls.id} className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{cls.subject[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{cls.title}</p>
                    <p className="text-sm text-muted-foreground">{cls.topic}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(startTime, "MMM d, yyyy")} • {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")} (
                      {durationText})
                    </p>
                  </div>
                </div>
                <StatusBadge status={cls.status} />
              </div>

              <div className="flex justify-end">
                <ClassActionButtons
                  classData={{
                    id: cls.id,
                    title: cls.title,
                    class_link: cls.class_link,
                    status: cls.status,
                  }}
                  compact={true}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// Component to display recent classes
function TeacherRecentClasses() {
  return (
    <div className="space-y-4">
      {teacherClasses.recent.map((cls) => {
        const startTime = parseISO(cls.start_time)
        const endTime = parseISO(cls.end_time)
        const durationMinutes = differenceInMinutes(endTime, startTime)
        const durationText = formatDuration(durationMinutes)

        return (
          <Card key={cls.id} className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{cls.subject[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{cls.title}</p>
                    <p className="text-sm text-muted-foreground">{cls.topic}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(startTime, "MMM d, yyyy")} • {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")} (
                      {durationText})
                    </p>
                  </div>
                </div>
                <StatusBadge status={cls.status} />
              </div>

              <div className="flex justify-end">
                <ClassActionButtons
                  classData={{
                    id: cls.id,
                    title: cls.title,
                    class_link: cls.class_link,
                    status: cls.status,
                  }}
                  compact={true}
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default function TeacherDashboard() {
  // Get current date in a readable format
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherClasses.upcoming.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teaching Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3h</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Your classes for {currentDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList className="bg-muted/80">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4">
              <TeacherUpcomingClasses />
            </TabsContent>
            <TabsContent value="recent" className="space-y-4">
              <TeacherRecentClasses />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
