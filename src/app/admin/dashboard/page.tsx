import {
  BookCheck,
  BookX,
  Calendar,
  CalendarClock,
  CheckCircle,
  Clock,
  GraduationCapIcon as Graduation,
  Play,
  UserX,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecentClasses } from "@/components/recent-classes"
import { UpcomingClasses } from "@/components/upcoming-classes"
import { getClassesCountByStatus } from "@/lib/get/get-classes"
import { getStudentsCount } from "@/lib/get/get-students"
import { getTeachersCount } from "@/lib/get/get-teachers"
import { getWeeklyClassesCount } from "@/lib/get/get-classes"
import { createClient } from "@/utils/supabase/server"

export default async function Dashboard() {
  const supabase = await createClient()

  // Get user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user?.id)
    .single()

  // Fetch todaysClasses inside the component to ensure fresh data on each page load
  const todaysClasses = {
    scheduled: await getClassesCountByStatus("scheduled"),
    running: await getClassesCountByStatus("running"),
    pending: await getClassesCountByStatus("pending"),
    complete: await getClassesCountByStatus("complete"),
    cancelled: await getClassesCountByStatus("cancelled"),
    absence: await getClassesCountByStatus("absence"),
  }

  const studentsCount = await getStudentsCount()
  const teachersCount = await getTeachersCount()
  const weeklyClassesCount = await getWeeklyClassesCount()

  return (
    <div className="flex flex-col gap-6">
      {/* Prominent Welcome Banner */}
      <div className="w-full flex items-center bg-green-800 min-h-[110px] shadow-md" style={{ borderBottom: '4px solid #34d399' }}>
        <div className="flex-1 flex justify-center items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">
            Welcome {profile?.first_name} {profile?.last_name}
          </h2>
        </div>
      </div>
      {/* End Banner */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
      <h2 className="text-xl font-semibold tracking-tight">Classes Today</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="border-l-4 border-l-blue-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.scheduled}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-emerald-500/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.running}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-indigo-500/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.complete}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <BookX className="h-4 w-4 text-rose-500/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.cancelled}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absence</CardTitle>
            <UserX className="h-4 w-4 text-orange-500/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.absence}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>Classes Overview</CardTitle>
            <CardDescription>View and manage your upcoming and recent classes</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList className="bg-muted/80">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="space-y-4">
                <UpcomingClasses />
              </TabsContent>
              <TabsContent value="recent" className="space-y-4">
                <RecentClasses />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Academy Stats</CardTitle>
            <CardDescription>Overview of students, teachers and classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-2 rounded-lg bg-accent/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <Graduation className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Students</p>
                  <p className="text-sm text-muted-foreground">{studentsCount} students enrolled</p>
                </div>
                <div className="ml-auto font-bold">{studentsCount}</div>
              </div>

              <div className="flex items-center gap-4 p-2 rounded-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <Users className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Teachers</p>
                  <p className="text-sm text-muted-foreground">{teachersCount} active teachers</p>
                </div>
                <div className="ml-auto font-bold">{teachersCount}</div>
              </div>

              <div className="flex items-center gap-4 p-2 rounded-lg bg-accent/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <BookCheck className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Weekly Classes</p>
                  <p className="text-sm text-muted-foreground">{weeklyClassesCount} classes this week</p>
                </div>
                <div className="ml-auto font-bold">{weeklyClassesCount}</div>
              </div>

              <div className="flex items-center gap-4 p-2 rounded-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
                  <Clock className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Teaching Hours</p>
                  <p className="text-sm text-muted-foreground">84 hours this week</p>
                </div>
                <div className="ml-auto font-bold">84h</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
