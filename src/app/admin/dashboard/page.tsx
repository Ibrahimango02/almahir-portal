import {
  BookCheck,
  BookOpen,
  BookX,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCapIcon as Graduation,
  Play,
  UserPen,
  UserX
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RecentClasses } from "@/components/recent-classes"
import { UpcomingClasses } from "@/components/upcoming-classes"
import { ClientDateDisplay } from "@/components/client-date-display"
import { RescheduleRequestsTable } from "@/components/reschedule-requests-table"
import { getSessionsToday, getWeeklySessionsCount, getSessionsCountByStatus, getActiveClassesCount } from "@/lib/get/get-classes"
import { getPendingRescheduleRequestsCount } from "@/lib/get/get-reschedule-requests"
import { getActiveStudentsCount } from "@/lib/get/get-students"
import { getActiveTeachersCount } from "@/lib/get/get-teachers"
import { createClient } from "@/utils/supabase/server"

export default async function AdminDashboard() {
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
    scheduled: await getSessionsCountByStatus("scheduled"),
    running: await getSessionsCountByStatus("running"),
    pending: await getSessionsCountByStatus("pending"),
    complete: await getSessionsCountByStatus("complete"),
    cancelled: await getSessionsCountByStatus("cancelled"),
    absence: await getSessionsCountByStatus("absence"),
  }

  const studentsCount = await getActiveStudentsCount()
  const teachersCount = await getActiveTeachersCount()
  const weeklySessionsCount = await getWeeklySessionsCount()
  const activeClassesCount = await getActiveClassesCount()
  const pendingRescheduleCount = await getPendingRescheduleRequestsCount()

  // Fetch sessions data for today using getSessionsToday()
  const sessionsData = await getSessionsToday()

  return (
    <div className="flex flex-col gap-6">
      {/* Prominent Welcome Banner */}
      <div className="w-full flex items-center bg-green-800 min-h-[110px] shadow-md" style={{ borderBottom: '4px solid #34d399' }}>
        <div className="flex-1 flex justify-center items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">
            Welcome, {profile?.first_name} {profile?.last_name}!
          </h2>
        </div>
      </div>
      {/* End Banner */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <ClientDateDisplay />
        </div>
      </div>

      {/* Classes Today */}

      <h2 className="text-xl font-semibold tracking-tight">Sessions Today</h2>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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

        <Card className="border-l-4 border-l-orange-400/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absence</CardTitle>
            <UserX className="h-4 w-4 text-orange-500/80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.absence}</div>
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
      </div>

      {/* Classes Overview */}
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
                <UpcomingClasses
                  sessions={sessionsData}
                  isLoading={false}
                  userType="admin"
                />
              </TabsContent>
              <TabsContent value="recent" className="space-y-4">
                <RecentClasses
                  sessions={sessionsData}
                  isLoading={false}
                  userType="admin"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Academy Stats */}

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Academy Stats</CardTitle>
            <CardDescription>Overview of students, teachers and classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Graduation className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Active Students</p>
                </div>
                <div className="ml-auto">{studentsCount}</div>
              </div>

              <div className="flex items-center gap-4 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <UserPen className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Active Teachers</p>
                </div>
                <div className="ml-auto">{teachersCount}</div>
              </div>

              <div className="flex items-center gap-4 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <BookCheck className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Weekly Sessions</p>
                </div>
                <div className="ml-auto">{weeklySessionsCount}</div>
              </div>

              <div className="flex items-center gap-4 p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <BookOpen className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Active Classes</p>
                </div>
                <div className="ml-auto">{activeClassesCount}</div>
              </div>

              <div className="flex items-center gap-4 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Calendar className="h-5 w-5 text-orange-700 dark:text-orange-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Pending Reschedules</p>
                </div>
                <div className="ml-auto">{pendingRescheduleCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reschedule Requests */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Reschedule Requests</h2>
          {pendingRescheduleCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {pendingRescheduleCount} pending
            </Badge>
          )}
        </div>
        <RescheduleRequestsTable />
      </div>
    </div>
  )
}
