import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, Calendar, Clock, GraduationCap, Video } from "lucide-react"
import Link from "next/link"

// Mock data for student classes
const studentData = {
  name: "Emma Smith",
  grade: "10th",
  age: 16,
  todayClasses: [
    {
      id: 1,
      subject: "Mathematics",
      topic: "Algebra Fundamentals",
      date: "2023-04-17",
      startTime: "09:00 AM",
      endTime: "10:00 AM",
      teacher: {
        name: "Sarah Johnson",
        initials: "SJ",
      },
      meetingLink: "https://zoom.us/j/123456789",
      materials: [
        { id: 1, name: "Algebra Worksheet", type: "pdf" },
        { id: 2, name: "Practice Problems", type: "pdf" },
      ],
    },
    {
      id: 2,
      subject: "Physics",
      topic: "Mechanics",
      date: "2023-04-17",
      startTime: "11:30 AM",
      endTime: "12:30 PM",
      teacher: {
        name: "Michael Chen",
        initials: "MC",
      },
      meetingLink: "https://zoom.us/j/987654321",
      materials: [
        { id: 3, name: "Physics Textbook Ch. 5", type: "pdf" },
        { id: 4, name: "Lab Instructions", type: "pdf" },
      ],
    },
  ],
  upcomingClasses: [
    {
      id: 3,
      subject: "English",
      topic: "Literature Analysis",
      date: "2023-04-18",
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      teacher: {
        name: "Emily Davis",
        initials: "ED",
      },
      meetingLink: "https://zoom.us/j/123123123",
      materials: [
        { id: 5, name: "Reading Assignment", type: "pdf" },
        { id: 6, name: "Essay Guidelines", type: "pdf" },
      ],
    },
    {
      id: 4,
      subject: "Chemistry",
      topic: "Chemical Bonding",
      date: "2023-04-18",
      startTime: "01:00 PM",
      endTime: "02:00 PM",
      teacher: {
        name: "Robert Wilson",
        initials: "RW",
      },
      meetingLink: "https://zoom.us/j/456456456",
      materials: [
        { id: 7, name: "Chemistry Notes", type: "pdf" },
        { id: 8, name: "Lab Safety Guidelines", type: "pdf" },
      ],
    },
  ],
  recentClasses: [
    {
      id: 5,
      subject: "Mathematics",
      topic: "Geometry",
      date: "2023-04-16",
      startTime: "09:00 AM",
      endTime: "10:00 AM",
      teacher: {
        name: "Sarah Johnson",
        initials: "SJ",
      },
      materials: [
        { id: 9, name: "Geometry Worksheet", type: "pdf" },
        { id: 10, name: "Practice Problems", type: "pdf" },
      ],
      attendance: "present",
    },
    {
      id: 6,
      subject: "Biology",
      topic: "Cell Structure",
      date: "2023-04-16",
      startTime: "11:30 AM",
      endTime: "12:30 PM",
      teacher: {
        name: "Jennifer Lee",
        initials: "JL",
      },
      materials: [
        { id: 11, name: "Biology Notes", type: "pdf" },
        { id: 12, name: "Lab Report Template", type: "pdf" },
      ],
      attendance: "present",
    },
  ],
}

export default function StudentClassesPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
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
            <div className="text-2xl font-bold">{studentData.todayClasses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.upcomingClasses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.recentClasses.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Classes</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          <TabsTrigger value="recent">Recent Classes</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="space-y-4">
          {studentData.todayClasses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {studentData.todayClasses.map((cls) => (
                <Card key={cls.id} className="overflow-hidden">
                  <div className="bg-primary/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{cls.subject}</h3>
                        <p className="text-sm text-muted-foreground">{cls.topic}</p>
                      </div>
                      <Badge variant="outline">Today</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{cls.teacher.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{cls.teacher.name}</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {cls.startTime} - {cls.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">Class Materials:</p>
                        <div className="flex flex-wrap gap-2">
                          {cls.materials.map((material) => (
                            <Badge key={material.id} variant="outline" className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {material.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button asChild className="flex-1">
                          <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer">
                            <Video className="mr-2 h-4 w-4" />
                            Join Class
                          </a>
                        </Button>
                        <Button variant="outline" asChild className="flex-1">
                          <Link href={`/student/classes/${cls.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-muted-foreground">No classes scheduled for today.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-4">
          {studentData.upcomingClasses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {studentData.upcomingClasses.map((cls) => (
                <Card key={cls.id} className="overflow-hidden">
                  <div className="bg-primary/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{cls.subject}</h3>
                        <p className="text-sm text-muted-foreground">{cls.topic}</p>
                      </div>
                      <Badge variant="outline">{new Date(cls.date).toLocaleDateString()}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{cls.teacher.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{cls.teacher.name}</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {cls.startTime} - {cls.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">Class Materials:</p>
                        <div className="flex flex-wrap gap-2">
                          {cls.materials.map((material) => (
                            <Badge key={material.id} variant="outline" className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {material.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/student/classes/${cls.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-muted-foreground">No upcoming classes scheduled.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          {studentData.recentClasses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {studentData.recentClasses.map((cls) => (
                <Card key={cls.id} className="overflow-hidden">
                  <div className="bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{cls.subject}</h3>
                        <p className="text-sm text-muted-foreground">{cls.topic}</p>
                      </div>
                      <Badge variant={cls.attendance === "present" ? "default" : "destructive"}>{cls.attendance}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{cls.teacher.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{cls.teacher.name}</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {cls.startTime} - {cls.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium">Class Materials:</p>
                        <div className="flex flex-wrap gap-2">
                          {cls.materials.map((material) => (
                            <Badge key={material.id} variant="outline" className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {material.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/student/classes/${cls.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-muted-foreground">No recent classes found.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>My Progress</CardTitle>
          <CardDescription>Track your academic progress and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div className="flex items-center gap-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Current Grade Level</p>
                  <p className="text-sm text-muted-foreground">{studentData.grade} Grade</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/student/progress">View Progress</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
