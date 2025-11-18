"use client"

import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, addMonths, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react"
import { ScheduleCalendarView } from "@/components/schedule-calendar-view"
import { ScheduleListView } from "@/components/schedule-list-view"
import { MonthlyScheduleView } from "@/components/monthly-schedule-view"
import { MonthlyListScheduleView } from "@/components/monthly-list-schedule-view"
import { getClasses } from "@/lib/get/get-classes"
import { ClassType } from "@/types"

export default function SchedulePage() {
  const [view, setView] = useState<"calendar" | "list" | "monthly" | "monthly-list">("calendar")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [activeTab, setActiveTab] = useState("all")
  const [activeListTab, setActiveListTab] = useState("upcoming")
  const [classData, setClassData] = useState<ClassType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await getClasses()
        // Ensure we have data before setting loading to false
        // This ensures all sessions are fetched before rendering
        if (data && Array.isArray(data)) {
          setClassData(data)
        } else {
          console.error('Invalid data received from getClasses')
          setClassData([])
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
        setClassData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const navigateWeek = (direction: "next" | "prev") => {
    setCurrentWeekStart((prev) => (direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)))
  }

  const navigateMonth = (direction: "next" | "prev") => {
    setCurrentMonth((prev) => (direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
      </div>

      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>
              {view === "calendar" ? "Weekly Schedule" :
                view === "list" ? "Schedule List" :
                  view === "monthly" ? "Monthly Calendar" : "Monthly List"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => view.includes("monthly") ? navigateMonth("prev") : navigateWeek("prev")}
                aria-label={view.includes("monthly") ? "Previous month" : "Previous week"}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium">
                {view.includes("monthly")
                  ? format(currentMonth, "MMMM yyyy")
                  : `${format(currentWeekStart, "MMM d")} - ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}`
                }
              </p>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => view.includes("monthly") ? navigateMonth("next") : navigateWeek("next")}
                aria-label={view.includes("monthly") ? "Next month" : "Next week"}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {view === "calendar" && "View and manage your weekly class schedule"}
            {view === "list" && "View all scheduled classes in list format"}
            {view === "monthly" && "View and manage your monthly class schedule"}
            {view === "monthly-list" && "View all scheduled classes for the month in list format"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Time Period Tabs */}
          <div className="flex items-center gap-4 mb-4">
            <Tabs
              value={view.includes("monthly") ? "monthly" : "weekly"}
              onValueChange={(value) => {
                if (value === "monthly") {
                  setView(view === "list" ? "monthly-list" : "monthly")
                } else {
                  setView(view === "monthly-list" ? "list" : "calendar")
                }
              }}
            >
              <TabsList className="bg-muted/80">
                <TabsTrigger value="weekly" className={!view.includes("monthly") ? "bg-[#3d8f5b] text-white" : ""}>
                  Week
                </TabsTrigger>
                <TabsTrigger value="monthly" className={view.includes("monthly") ? "bg-[#3d8f5b] text-white" : ""}>
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View Type Tabs */}
            <Tabs
              value={view === "monthly-list" ? "list" : view === "monthly" ? "calendar" : view}
              onValueChange={(value) => {
                if (view.includes("monthly")) {
                  setView(value === "list" ? "monthly-list" : "monthly")
                } else {
                  setView(value as "list" | "calendar")
                }
              }}
            >
              <TabsList className="bg-muted/80">
                <TabsTrigger value="calendar" className={(view === "calendar" || view === "monthly") ? "bg-[#3d8f5b] text-white" : ""}>
                  <CalendarDays className="mr-2 h-4 w-4" /> Calendar
                </TabsTrigger>
                <TabsTrigger value="list" className={(view === "list" || view === "monthly-list") ? "bg-[#3d8f5b] text-white" : ""}>
                  <List className="mr-2 h-4 w-4" /> List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content based on view */}
          {view === "calendar" ? (
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="morning">Morning</TabsTrigger>
                <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
                <TabsTrigger value="evening">Evening</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <ScheduleCalendarView
                  classData={classData}
                  isLoading={isLoading}
                  baseRoute="/admin"
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={0}
                  timeRangeEnd={24}
                />
              </TabsContent>
              <TabsContent value="morning">
                <ScheduleCalendarView
                  classData={classData}
                  isLoading={isLoading}
                  baseRoute="/admin"
                  filter="morning"
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={4}
                  timeRangeEnd={12}
                />
              </TabsContent>
              <TabsContent value="afternoon">
                <ScheduleCalendarView
                  classData={classData}
                  isLoading={isLoading}
                  baseRoute="/admin"
                  filter="afternoon"
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={12}
                  timeRangeEnd={20}
                />
              </TabsContent>
              <TabsContent value="evening">
                <ScheduleCalendarView
                  classData={classData}
                  isLoading={isLoading}
                  baseRoute="/admin"
                  filter="evening"
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={20}
                  timeRangeEnd={28}
                />
              </TabsContent>
            </Tabs>
          ) : view === "list" ? (
            <Tabs defaultValue="upcoming" value={activeListTab} onValueChange={setActiveListTab}>
              <TabsList className="mb-4 bg-muted/80">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                <ScheduleListView
                  classData={classData}
                  isLoading={isLoading}
                  baseRoute="/admin"
                  filter="upcoming"
                  currentWeekStart={currentWeekStart}
                />
              </TabsContent>
              <TabsContent value="recent">
                <ScheduleListView
                  classData={classData}
                  isLoading={isLoading}
                  baseRoute="/admin"
                  filter="recent"
                  currentWeekStart={currentWeekStart}
                />
              </TabsContent>
            </Tabs>
          ) : view === "monthly" ? (
            <MonthlyScheduleView
              classes={classData}
              monthStart={currentMonth}
              currentUserRole="admin"
            />
          ) : view === "monthly-list" ? (
            <MonthlyListScheduleView
              classes={classData}
              monthStart={currentMonth}
              currentUserRole="admin"
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
