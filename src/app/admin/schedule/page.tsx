"use client"

import { useState } from "react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, ChevronLeft, ChevronRight, List, Search } from "lucide-react"
import { AdminScheduleCalendarView } from "@/components/admin-schedule-calendar-view"
import { AdminScheduleListView } from "@/components/admin-schedule-list-view"

export default function SchedulePage() {
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [activeTab, setActiveTab] = useState("all")
  const [activeListTab, setActiveListTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("")

  const navigateWeek = (direction: "next" | "prev") => {
    setCurrentWeekStart((prev) => (direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)))
  }

  const toggleView = () => {
    if (view === "calendar") {
      setView("list")
      setActiveListTab("upcoming") // Reset to "upcoming" tab when switching to list view
    } else {
      setView("calendar")
      setActiveTab("all") // Reset to "8-Hour" tab when switching to calendar view
    }
  }

  // Get current time for "all" view
  const currentHour = new Date().getHours()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Class Schedule</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search classes..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={toggleView}>
            {view === "calendar" ? (
              <>
                <List className="mr-2 h-4 w-4" />
                View List
              </>
            ) : (
              <>
                <CalendarDays className="mr-2 h-4 w-4" />
                View Calendar
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{view === "calendar" ? "Weekly Schedule" : "Schedule List"}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigateWeek("prev")}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium">
                {format(currentWeekStart, "MMMM d")} -{" "}
                {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMMM d, yyyy")}
              </p>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigateWeek("next")}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {view === "calendar"
              ? "View and manage your weekly class schedule"
              : "View all scheduled classes in list format"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {view === "calendar" ? (
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="morning">Morning</TabsTrigger>
                <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
                <TabsTrigger value="evening">Evening</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <AdminScheduleCalendarView
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={0}
                  timeRangeEnd={24}
                  searchQuery={searchQuery}
                />
              </TabsContent>
              <TabsContent value="morning">
                <AdminScheduleCalendarView
                  filter="morning"
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={4}
                  timeRangeEnd={12}
                  searchQuery={searchQuery}
                />
              </TabsContent>
              <TabsContent value="afternoon">
                <AdminScheduleCalendarView
                  filter="afternoon"
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={12}
                  timeRangeEnd={20}
                  searchQuery={searchQuery}
                />
              </TabsContent>
              <TabsContent value="evening">
                <AdminScheduleCalendarView
                  filter="evening"
                  currentWeekStart={currentWeekStart}
                  timeRangeStart={20}
                  timeRangeEnd={28} // 28 represents 4 AM next day
                  searchQuery={searchQuery}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="upcoming" value={activeListTab} onValueChange={setActiveListTab}>
              <TabsList className="mb-4 bg-muted/80">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                <AdminScheduleListView filter="upcoming" currentWeekStart={currentWeekStart} searchQuery={searchQuery} />
              </TabsContent>
              <TabsContent value="recent">
                <AdminScheduleListView filter="recent" currentWeekStart={currentWeekStart} searchQuery={searchQuery} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
