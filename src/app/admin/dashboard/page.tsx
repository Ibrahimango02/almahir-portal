"use client"

import {
  BookX,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  UserX
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RecentClasses } from "@/components/recent-classes"
import { UpcomingClasses } from "@/components/upcoming-classes"
import { ClientDateDisplay } from "@/components/client-date-display"
import { RescheduleRequestsTable } from "@/components/reschedule-requests-table"
import { getSessionsToday, getSessionsCountByStatus } from "@/lib/get/get-classes"
import { getPendingRescheduleRequestsCount } from "@/lib/get/get-reschedule-requests"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ClassSessionType } from "@/types"

export default function AdminDashboard() {
  const [profile, setProfile] = useState<{ id: string; first_name: string; last_name: string } | null>(null)
  const [todaysClasses, setTodaysClasses] = useState({
    scheduled: 0,
    running: 0,
    pending: 0,
    complete: 0,
    cancelled: 0,
    absence: 0,
  })
  const [pendingRescheduleCount, setPendingRescheduleCount] = useState(0)
  const [sessionsData, setSessionsData] = useState<ClassSessionType[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .eq('id', user.id)
            .single()
          setProfile(profileData)
        }

        // Fetch all dashboard data
        const [
          scheduledCount,
          runningCount,
          pendingCount,
          completeCount,
          cancelledCount,
          absenceCount,
          pendingRescheduleCountData,
          sessionsDataData
        ] = await Promise.all([
          getSessionsCountByStatus("scheduled"),
          getSessionsCountByStatus("running"),
          getSessionsCountByStatus("pending"),
          getSessionsCountByStatus("complete"),
          getSessionsCountByStatus("cancelled"),
          getSessionsCountByStatus("absence"),
          getPendingRescheduleRequestsCount(),
          getSessionsToday()
        ])

        setTodaysClasses({
          scheduled: scheduledCount || 0,
          running: runningCount || 0,
          pending: pendingCount || 0,
          complete: completeCount || 0,
          cancelled: cancelledCount || 0,
          absence: absenceCount || 0,
        })
        setPendingRescheduleCount(pendingRescheduleCountData || 0)
        setSessionsData(sessionsDataData || [])
        setLastUpdated(new Date())
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up polling every 30 seconds to refresh dashboard data
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  // Function to update pending reschedule count (will be called by RescheduleRequestsTable)
  const updatePendingRescheduleCount = async () => {
    try {
      const newCount = await getPendingRescheduleRequestsCount()
      setPendingRescheduleCount(newCount)
    } catch (error) {
      console.error('Error updating pending reschedule count:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-lg bg-[#1f6749] p-6 shadow-lg">
          <div className="text-center">
            <div className="h-8 w-64 bg-white/20 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="rounded-lg bg-[#1f6749] p-6 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Welcome, {profile?.first_name} {profile?.last_name}!
          </h2>
          <p className="mt-2 text-green-100">
            Almahir Academy Administrative Dashboard
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <ClientDateDisplay />
        </div>
      </div>

      {/* Sessions Today */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Sessions Today</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const [
                scheduledCount,
                runningCount,
                pendingCount,
                completeCount,
                cancelledCount,
                absenceCount,
              ] = await Promise.all([
                getSessionsCountByStatus("scheduled"),
                getSessionsCountByStatus("running"),
                getSessionsCountByStatus("pending"),
                getSessionsCountByStatus("complete"),
                getSessionsCountByStatus("cancelled"),
                getSessionsCountByStatus("absence"),
              ])

              setTodaysClasses({
                scheduled: scheduledCount || 0,
                running: runningCount || 0,
                pending: pendingCount || 0,
                complete: completeCount || 0,
                cancelled: cancelledCount || 0,
                absence: absenceCount || 0,
              })
              setLastUpdated(new Date())
            }}
          >
            Refresh
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
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
      <Card>
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
        <RescheduleRequestsTable onCountUpdate={updatePendingRescheduleCount} />
      </div>
    </div>
  )
}
