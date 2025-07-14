"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  isSameDay,
  addWeeks,
  subWeeks,
  isWithinInterval,
  endOfDay,
  startOfDay,
  differenceInMinutes,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths
} from "date-fns"
import { Button } from "@/components/ui/button"
import { List, CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, Users, Calendar, Play, CheckCircle, BookX, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "./status-badge"
import { ClassSessionType } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { ClientTimeDisplay } from "./client-time-display"
import { getProfile } from "@/lib/get/get-profiles"

// Utility function to parse class date and time
const parseClassDateTime = (
  cls: { start_date?: string; end_date?: string },
  timeField: "start_date" | "end_date"
): Date | null => {
  try {
    const time = cls[timeField]
    if (!time) return null

    // Parse the ISO datetime string directly
    return parseISO(time)
  } catch (error) {
    console.error(`Error parsing ${timeField} for class:`, error, cls)
    return null
  }
}

export function WeeklySchedule({
  sessions,
  assignClassUrl,
  role,
  id
}: {
  sessions: ClassSessionType[],
  assignClassUrl?: string,
  role?: "student" | "teacher" | "parent" | "admin",
  id?: string
}) {
  // Handle null values from context - convert null to undefined for compatibility
  const [view, setView] = useState<"list" | "calendar" | "monthly" | "monthly-list">("calendar")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [visibleClasses, setVisibleClasses] = useState<ClassSessionType[]>(sessions)
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all")
  const [activeListTab, setActiveListTab] = useState<"upcoming" | "recent">("upcoming")
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  // Fetch current user's role
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      try {
        const profile = await getProfile()
        setCurrentUserRole(profile.role)
      } catch (error) {
        console.error("Error fetching current user role:", error)
      }
    }

    fetchCurrentUserRole()
  }, [])

  // Add check for past week
  const isPastWeek = useMemo(() => {
    const now = new Date()
    const weekEnd = addDays(currentWeekStart, 6)
    return weekEnd < now
  }, [currentWeekStart])

  // Update activeListTab when week changes
  useEffect(() => {
    if (isPastWeek && activeListTab === "upcoming") {
      setActiveListTab("recent")
    }
  }, [isPastWeek, activeListTab])

  // Memoize sorted classes to prevent recreation on every render
  const sortedClasses = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [sessions])

  // Update visible classes when week changes or view changes
  useEffect(() => {
    if (view === "calendar") {
      // For calendar view, filter classes to show only those in the current week
      const weekEnd = addDays(currentWeekStart, 6) // 6 days after Monday = Sunday
      let filtered = sortedClasses.filter((cls) => {
        const classDate = parseClassDateTime(cls, "start_date")
        return classDate && isWithinInterval(classDate, {
          start: startOfDay(currentWeekStart),
          end: endOfDay(weekEnd),
        })
      })

      // Apply time filter if not "all"
      if (timeFilter !== "all") {
        filtered = filtered.filter((cls) => {
          const startTime = parseClassDateTime(cls, "start_date")
          if (!startTime) return false;

          const hour = startTime.getHours();

          if (timeFilter === "morning") {
            return hour >= 4 && hour < 12;
          } else if (timeFilter === "afternoon") {
            return hour >= 12 && hour < 20;
          } else if (timeFilter === "evening") {
            return hour >= 20 || hour < 4;
          }

          return true;
        });
      }

      setVisibleClasses(filtered)
    } else if (view === "monthly" || view === "monthly-list") {
      // For monthly views, filter classes to show only those in the current month
      const monthEnd = endOfMonth(currentMonth)
      const filtered = sortedClasses.filter((cls) => {
        const classDate = parseClassDateTime(cls, "start_date")
        return classDate && isWithinInterval(classDate, {
          start: startOfDay(currentMonth),
          end: endOfDay(monthEnd),
        })
      })
      setVisibleClasses(filtered)
    } else if (view === "list") {
      // For list view, filter based on the week and the active tab
      const weekEnd = addDays(currentWeekStart, 6) // 6 days after Monday = Sunday
      const now = new Date()

      let filtered = sortedClasses.filter((cls) => {
        const classDate = parseClassDateTime(cls, "start_date")
        return classDate && isWithinInterval(classDate, {
          start: startOfDay(currentWeekStart),
          end: endOfDay(weekEnd),
        })
      })

      // Apply the upcoming/recent filter
      if (activeListTab === "upcoming") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_date")
          return endTime && endTime >= now;
        });
      } else if (activeListTab === "recent") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_date")
          return endTime && endTime <= now;
        });
      }

      setVisibleClasses(filtered)
    }
  }, [sortedClasses, view, timeFilter, currentWeekStart, currentMonth, activeListTab])

  const navigateWeek = (direction: "next" | "prev") => {
    setCurrentWeekStart((prev) => (direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)))

    // For list view, adjust visible classes to show appropriate date range
    if (view === "list") {
      const newWeekStart = direction === "next" ? addWeeks(currentWeekStart, 1) : subWeeks(currentWeekStart, 1)
      const weekEnd = addDays(newWeekStart, 6)
      const now = new Date()

      let filtered = sortedClasses.filter((cls) => {
        const classDate = parseClassDateTime(cls, "start_date")
        return classDate && isWithinInterval(classDate, {
          start: startOfDay(newWeekStart),
          end: endOfDay(weekEnd),
        })
      })

      // Apply the upcoming/recent filter
      if (activeListTab === "upcoming") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_date")
          return endTime && endTime <= now;
        });
      } else if (activeListTab === "recent") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_date")
          return endTime && endTime > now;
        });
      }

      setVisibleClasses(filtered)
    }
  }

  const navigateMonth = (direction: "next" | "prev") => {
    setCurrentMonth((prev) => (direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)))
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center w-full">
          {/* Tabs on the left */}
          <div className="flex items-center gap-4">
            {/* Time Period Tabs */}
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
                  <CalendarDays className="mr-2 h-4 w-4" /> Weekly
                </TabsTrigger>
                <TabsTrigger value="monthly" className={view.includes("monthly") ? "bg-[#3d8f5b] text-white" : ""}>
                  <Calendar className="mr-2 h-4 w-4" /> Monthly
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

          {/* Navigation in the center/right */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => view === "monthly" || view === "monthly-list" ? navigateMonth("prev") : navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {view === "monthly" || view === "monthly-list"
                ? format(currentMonth, "MMMM yyyy")
                : `${format(currentWeekStart, "MMM d")} - ${format(addDays(currentWeekStart, 6), "MMM d, yyyy")}`
              }
            </span>
            <Button variant="outline" size="sm" onClick={() => view === "monthly" || view === "monthly-list" ? navigateMonth("next") : navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Assign Class button on the far right */}
          {assignClassUrl && (
            <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
              <a href={assignClassUrl}>
                <Plus className="mr-2 h-4 w-4" /> Assign Class
              </a>
            </Button>
          )}
        </div>

        {view === "calendar" && (
          <div className="flex justify-end mb-4">
            <Tabs
              value={timeFilter}
              onValueChange={(value) => setTimeFilter(value as "all" | "morning" | "afternoon" | "evening")}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="morning">Morning</TabsTrigger>
                <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
                <TabsTrigger value="evening">Evening</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {view === "list" ? (
          <div className="h-[calc(100vh-200px)] flex flex-col">
            <div className="flex justify-end mb-4">
              <Tabs value={activeListTab} onValueChange={(value) => setActiveListTab(value as "upcoming" | "recent")}>
                <TabsList className="bg-muted/80">
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger
                    value="upcoming"
                    disabled={isPastWeek}
                    className={cn(isPastWeek && "opacity-50 cursor-not-allowed")}
                  >
                    Upcoming
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex-1">
              <ListScheduleView classes={visibleClasses} filter={activeListTab} currentUserRole={currentUserRole} />
            </div>
          </div>
        ) : view === "monthly-list" ? (
          <div className="h-[calc(100vh-200px)]">
            <MonthlyListScheduleView classes={visibleClasses} monthStart={currentMonth} role={role} id={id} currentUserRole={currentUserRole} />
          </div>
        ) : view === "monthly" ? (
          <MonthlyScheduleView classes={visibleClasses} monthStart={currentMonth} role={role} id={id} currentUserRole={currentUserRole} />
        ) : (
          <CalendarScheduleView classes={visibleClasses} weekStart={currentWeekStart} filter={timeFilter} currentUserRole={currentUserRole} />
        )}
      </div>
    </TooltipProvider>
  )
}

function ListScheduleView({
  classes,
  filter,
  currentUserRole
}: {
  classes: ClassSessionType[];
  filter: "upcoming" | "recent";
  currentUserRole: string | null;
}) {
  const router = useRouter()

  // Current date and time for filtering
  const now = useMemo(() => new Date(), [])

  // Sort and filter classes by date and time
  const filteredSortedClasses = useMemo(() => {
    // First get properly sorted classes
    const sorted = [...classes].sort((a, b) => {
      try {
        const aDateTime = parseClassDateTime(a, "start_date")
        const bDateTime = parseClassDateTime(b, "start_date")

        if (!aDateTime || !bDateTime) return 0
        return aDateTime.getTime() - bDateTime.getTime()
      } catch (error) {
        console.error("Error sorting classes:", error)
        return 0
      }
    })

    // Then filter based on the active tab
    return sorted.filter(cls => {
      const startDateTime = parseClassDateTime(cls, "start_date")
      const endDateTime = parseClassDateTime(cls, "end_date")
      if (!startDateTime || !endDateTime) return false

      if (filter === "upcoming") {
        // Show classes that are ongoing or in the future
        return startDateTime >= now || (startDateTime <= now && endDateTime > now)
      } else if (filter === "recent") {
        // Show classes that have ended
        return endDateTime <= now
      }

      return true
    })
  }, [classes, filter, now])

  const handleCardClick = (classId: string, sessionId: string) => {
    if (!currentUserRole) return
    router.push(`/${currentUserRole}/classes/${classId}/${sessionId}`)
  }

  return (
    <div className="h-full flex flex-col">
      {filteredSortedClasses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          {filter === "upcoming" ? "No ongoing or upcoming classes found" : "No completed classes found"}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-3 p-1">
            {filteredSortedClasses.map((classItem) => {
              const startDateTime = parseClassDateTime(classItem, "start_date")
              const endDateTime = parseClassDateTime(classItem, "end_date")
              const isTodayClass = startDateTime && isToday(startDateTime)

              if (!startDateTime || !endDateTime) return null

              return (
                <div
                  key={classItem.session_id}
                  className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-accent/50"
                  onClick={() => handleCardClick(classItem.class_id, classItem.session_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{classItem.title}</h3>
                        {isTodayClass && (
                          <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-500 text-white font-medium px-2 py-1">
                            Today
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{classItem.subject}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {format(startDateTime, "PPP")}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <ClientTimeDisplay date={startDateTime} format="h:mm a" /> - <ClientTimeDisplay date={endDateTime} format="h:mm a" />
                        </span>
                        {classItem.teachers.length > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {classItem.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 ml-3">
                      <span className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                        classItem.status === "running" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                        classItem.status === "complete" && "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                        classItem.status === "pending" && "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
                        classItem.status === "scheduled" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                        classItem.status === "rescheduled" && "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
                        classItem.status === "cancelled" && "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
                        classItem.status === "absence" && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      )}>
                        {/* Optionally, you can add an icon here if you want to match the monthly badge style */}
                        {classItem.status === "scheduled" && <Calendar className="h-3 w-3" />}
                        {classItem.status === "running" && <Play className="h-3 w-3" />}
                        {classItem.status === "complete" && <CheckCircle className="h-3 w-3" />}
                        {classItem.status === "pending" && <Clock className="h-3 w-3" />}
                        {classItem.status === "rescheduled" && <CalendarDays className="h-3 w-3" />}
                        {classItem.status === "cancelled" && <BookX className="h-3 w-3" />}
                        {classItem.status === "absence" && <UserX className="h-3 w-3" />}
                        {classItem.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarScheduleView({
  classes,
  weekStart,
  filter = "all",
  currentUserRole
}: {
  classes: ClassSessionType[];
  weekStart: Date;
  filter?: "all" | "morning" | "afternoon" | "evening";
  currentUserRole: string | null;
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Client-side only state
  useEffect(() => {
    setMounted(true)
  }, [])


  // Generate week days based on the weekStart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Find earliest and latest class times to determine time slots
  const timeRange = useMemo(() => {
    if (filter === "morning") {
      return { earliestHour: 4, latestHour: 12 }
    } else if (filter === "afternoon") {
      return { earliestHour: 12, latestHour: 20 }
    } else if (filter === "evening") {
      return { earliestHour: 20, latestHour: 4 }
    } else {
      return { earliestHour: 0, latestHour: 24 }
    }
  }, [filter])

  // Time slots for the day
  const timeSlots = useMemo(() => {
    const slots = []

    if (filter === "evening") {
      // For evening view, create slots from 8 PM (20) to 4 AM (4) the next day
      // First add hours from 8 PM to 11 PM (20-23)
      for (let i = 20; i < 24; i++) {
        slots.push(i)
      }
      // Then add hours from 12 AM to 4 AM (0-3)
      for (let i = 0; i < 4; i++) {
        slots.push(i)
      }
    } else {
      // For other filters, use the normal range
      for (let i = timeRange.earliestHour; i < timeRange.latestHour; i++) {
        slots.push(i)
      }
    }

    return slots
  }, [timeRange, filter])

  // Function to check if two classes overlap
  const doClassesOverlap = (class1: ClassSessionType, class2: ClassSessionType) => {
    const start1 = parseClassDateTime(class1, "start_date")
    const end1 = parseClassDateTime(class1, "end_date")
    const start2 = parseClassDateTime(class2, "start_date")
    const end2 = parseClassDateTime(class2, "end_date")

    if (!start1 || !end1 || !start2 || !end2) return false

    return start1 < end2 && start2 < end1
  }

  // Function to group overlapping classes
  const groupOverlappingClasses = useCallback((classes: ClassSessionType[]) => {
    if (classes.length <= 1) {
      return [classes]
    }

    const sortedClasses = [...classes].sort((a, b) => {
      const startA = parseClassDateTime(a, "start_date")
      const startB = parseClassDateTime(b, "start_date")
      if (!startA || !startB) return 0
      return startA.getTime() - startB.getTime()
    })

    const groups: ClassSessionType[][] = []
    let currentGroup: ClassSessionType[] = [sortedClasses[0]]

    for (let i = 1; i < sortedClasses.length; i++) {
      const currentClass = sortedClasses[i]
      let overlapsWithCurrentGroup = false

      for (const groupClass of currentGroup) {
        if (doClassesOverlap(currentClass, groupClass)) {
          overlapsWithCurrentGroup = true
          break
        }
      }

      if (overlapsWithCurrentGroup) {
        currentGroup.push(currentClass)
      } else {
        groups.push(currentGroup)
        currentGroup = [currentClass]
      }
    }

    groups.push(currentGroup)
    return groups
  }, [])

  // Calculate position for the current time indicator
  const currentTimeIndicator = useMemo(() => {
    if (!mounted) return null;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if current time is within displayed range
    if (filter === "evening") {
      // For evening view, check if current time is between 8 PM and 4 AM
      if (currentHour < 20 && currentHour >= 4) {
        return null;
      }
    } else {
      // For other filters, use the normal range check
      if (currentHour < timeRange.earliestHour || currentHour >= timeRange.latestHour) {
        return null;
      }
    }

    // Calculate position on the timeline
    const hourIndex = timeSlots.findIndex(hour => hour === currentHour);
    if (hourIndex === -1) return null;

    // Position within the hour (0-60 minutes)
    const minutePercentage = (currentMinute / 60) * 100;
    return {
      hourIndex,
      top: minutePercentage
    };
  }, [mounted, timeSlots, timeRange, filter]);

  // Format the hour for display
  const formatHour = (hour: number) => {
    const date = new Date()
    date.setHours(hour, 0, 0)
    return format(date, "h a")
  }

  // Helper to get status-specific border and background colors matching StatusBadge
  const getStatusContainerStyles = (status: string) => {
    switch (status) {
      case "scheduled":
        return "border-blue-200 bg-blue-50/80 dark:border-blue-800/60 dark:bg-blue-950/50"
      case "running":
        return "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/60 dark:bg-emerald-950/50"
      case "pending":
        return "border-indigo-200 bg-indigo-50/80 dark:border-indigo-800/60 dark:bg-indigo-950/50"
      case "complete":
        return "border-purple-200 bg-purple-50/80 dark:border-purple-800/60 dark:bg-purple-950/50"
      case "rescheduled":
        return "border-amber-200 bg-amber-50/80 dark:border-amber-800/60 dark:bg-amber-950/50"
      case "cancelled":
        return "border-rose-200 bg-rose-50/80 dark:border-rose-800/60 dark:bg-rose-950/50"
      case "absence":
        return "border-orange-200 bg-orange-50/80 dark:border-orange-800/60 dark:bg-orange-950/50"
      default:
        return "border-gray-200 bg-gray-50/80 dark:border-gray-800/60 dark:bg-gray-950/50"
    }
  }

  // Prepare classes for each day with overlap calculation
  const classesByDay = useMemo(() => {
    const byDay = weekDays.map((day) => {
      // Get all valid classes for this day
      const classesForDay = classes.filter((cls) => {
        const startDateTime = parseClassDateTime(cls, "start_date")
        return startDateTime && isSameDay(day, startDateTime)
      })

      // Group overlapping classes
      const groups = groupOverlappingClasses(classesForDay)

      // Flatten groups but preserve group information
      return groups.flatMap((group, groupIndex) =>
        group.map((cls, classIndex) => ({
          ...cls,
          groupIndex,
          classIndex,
          groupSize: group.length,
        }))
      )
    })

    return byDay
  }, [classes, weekDays, groupOverlappingClasses])

  return (
    <div className="overflow-x-auto border rounded-lg" ref={wrapperRef}>
      <div className="min-w-[700px] w-full">
        {/* Calendar header - Days of the week */}
        <div
          className="grid grid-cols-8 border-b"
          style={{ paddingRight: filter === "all" ? `15px` : '0' }}
        >
          <div className="p-2 border-r bg-muted/30 text-sm"></div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 border-r last:border-r-0 font-medium text-center",
                isToday(day) ? "bg-blue-50 dark:bg-blue-950" : "bg-muted/30",
              )}
            >
              <div className="text-sm uppercase">{format(day, "EEE")}</div>
              <div className={cn("text-xl font-normal", isToday(day) ? "text-blue-700 dark:text-blue-400" : "")}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div
          ref={scrollContainerRef}
          className={cn(filter === "all" && "max-h-[600px] overflow-y-auto")}
        >
          {timeSlots.map((hour, hourIndex) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-2 border-r bg-muted/20 text-sm flex items-center justify-end pr-3">
                {formatHour(hour)}
              </div>

              {weekDays.map((day, dayIndex) => {
                const isTodayColumn = isToday(day);
                const showCurrentTimeIndicator = mounted && isTodayColumn &&
                  currentTimeIndicator &&
                  currentTimeIndicator.hourIndex === hourIndex;

                return (
                  <div key={day.toISOString()} className="p-0 border-r last:border-r-0 text-sm relative min-h-[50px]">
                    {/* Current time indicator - only rendered on client side */}
                    {showCurrentTimeIndicator && (
                      <div
                        className="absolute w-full h-0.5 bg-red-500 z-30 flex items-center"
                        style={{
                          top: `${currentTimeIndicator.top}%`,
                        }}
                      >
                        <div className="absolute -left-1 w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="absolute -right-1 w-2 h-2 rounded-full bg-red-500"></div>
                      </div>
                    )}
                    {classesByDay[dayIndex].map((extendedClass: ClassSessionType & { groupIndex: number; classIndex: number; groupSize: number }) => {
                      try {
                        const startTime = parseClassDateTime(extendedClass, "start_date")
                        const endTime = parseClassDateTime(extendedClass, "end_date")

                        if (!startTime || !endTime) return null

                        const classStartHour = startTime.getHours()

                        // For the evening view, we need to handle classes that start or span this hour
                        if (filter === "evening") {
                          // For evening view, still only show classes starting at the current hour
                          if (classStartHour !== hour) {
                            return null
                          }
                        } else {
                          // For morning and afternoon views, only show classes that start in this hour
                          if (classStartHour !== hour) {
                            return null
                          }
                        }

                        // Calculate duration in minutes and convert to pixels (50px per hour)
                        const durationMinutes = differenceInMinutes(endTime, startTime)
                        const heightPx = Math.max(50, Math.round((durationMinutes * 50) / 60))

                        // Calculate width based on group size
                        const width = 100 / extendedClass.groupSize
                        // Calculate left offset based on index within group
                        const left = extendedClass.classIndex * width

                        return (
                          <Tooltip key={`${extendedClass.class_id}-${extendedClass.session_id}`}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute rounded-md border p-0.5 flex flex-col justify-between overflow-hidden cursor-pointer transition-all hover:z-20 hover:shadow-md",
                                  getStatusContainerStyles(extendedClass.status),
                                )}
                                style={{
                                  height: `${heightPx}px`,
                                  top: `${(startTime.getMinutes() / 60) * 50}px`,
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  zIndex: 10,
                                }}
                                onClick={() => {
                                  if (!currentUserRole) return
                                  router.push(`/${currentUserRole}/classes/${extendedClass.class_id}/${extendedClass.session_id}`)
                                }}
                              >
                                <div>
                                  <p className="font-medium truncate text-[10px] leading-tight">{extendedClass.title}</p>
                                  {heightPx >= 60 && (
                                    <p className="text-[9px] text-muted-foreground truncate leading-tight">
                                      {extendedClass.subject}
                                    </p>
                                  )}
                                  {heightPx >= 80 && (
                                    <p className="text-[9px] text-muted-foreground truncate leading-tight">
                                      <ClientTimeDisplay date={startTime} format="h:mm a" /> - <ClientTimeDisplay date={endTime} format="h:mm a" />
                                    </p>
                                  )}
                                </div>
                                {/* Always show status badge regardless of height */}
                                <div className="flex justify-end items-center mt-auto">
                                  <StatusBadge
                                    status={convertStatusToPrefixedFormat(extendedClass.status, 'session')}
                                    className="text-[8px] px-1 py-0.5"
                                  />
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <div className="font-semibold">{extendedClass.title}</div>
                                <div className="text-sm">{extendedClass.subject}</div>
                                <div className="text-sm">
                                  <ClientTimeDisplay date={startTime} format="EEEE, MMMM d, yyyy" />
                                </div>
                                <div className="text-sm">
                                  <ClientTimeDisplay date={startTime} format="h:mm a" /> - <ClientTimeDisplay date={endTime} format="h:mm a" />
                                </div>
                                {extendedClass.teachers.length > 0 && (
                                  <div className="text-sm">
                                    <span className="font-medium">Teachers:</span> {extendedClass.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      } catch {
                        return null
                      }
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MonthlyScheduleView({
  classes,
  monthStart,
  role,
  id,
  currentUserRole
}: {
  classes: ClassSessionType[],
  monthStart: Date,
  role?: string,
  id?: string,
  currentUserRole: string | null
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})

  // Helper to get attendance status icon for monthly view
  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Calendar className="h-3 w-3" />
      case "present":
        return <CheckCircle className="h-3 w-3" />
      case "absent":
        return <UserX className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  // Client-side only state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch attendance data for all sessions
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!role || !id || classes.length === 0) return

      const attendanceMap: Record<string, string> = {}

      try {
        for (const cls of classes) {
          let attendanceStatus = 'scheduled' // default status

          if (role === 'student') {
            const { getStudentAttendanceForSession } = await import('@/lib/get/get-students')
            const attendance = await getStudentAttendanceForSession(cls.session_id, id)
            if (attendance.length > 0) {
              attendanceStatus = attendance[0].attendance_status
            }
          } else if (role === 'teacher' || role === 'admin') {
            const { getTeacherAttendanceForSession } = await import('@/lib/get/get-teachers')
            const attendance = await getTeacherAttendanceForSession(cls.session_id, id)
            if (attendance.length > 0) {
              attendanceStatus = attendance[0].attendance_status
            }
          }

          attendanceMap[cls.session_id] = attendanceStatus
        }

        setAttendanceData(attendanceMap)
      } catch (error) {
        console.error('Error fetching attendance data:', error)
      }
    }

    fetchAttendanceData()
  }, [classes, role, id])

  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const monthEnd = endOfMonth(monthStart)
    const start = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start from Monday
    const end = startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 1 }) // End on Sunday of the week containing month end

    return eachDayOfInterval({ start, end })
  }, [monthStart])

  // Group days into weeks
  const weeks = useMemo(() => {
    const weeks = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7))
    }
    return weeks
  }, [calendarDays])

  // Get classes for a specific day
  const getClassesForDay = (day: Date) => {
    return classes.filter((cls) => {
      const classDate = parseClassDateTime(cls, "start_date")
      return classDate && isSameDay(classDate, day)
    })
  }

  // Helper to get attendance status-specific border and background colors
  const getAttendanceStatusContainerStyles = (status: string) => {
    switch (status) {
      case "scheduled":
        return "border-blue-200 bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/50"
      case "present":
        return "border-emerald-200 bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/50"
      case "absent":
        return "border-rose-200 bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/50"
      default:
        return "border-gray-200 bg-gray-100 dark:border-gray-800/60 dark:bg-gray-950/50"
    }
  }

  const handleDayClick = (day: Date) => {
    // Navigate to the weekly view for the week containing this day
    const weekStart = startOfWeek(day, { weekStartsOn: 1 })
    // You could implement navigation to a specific week view here
    console.log("Navigate to week starting:", weekStart)
  }

  const handleClassClick = (classId: string, sessionId: string) => {
    if (!currentUserRole) return
    router.push(`/${currentUserRole}/classes/${classId}/${sessionId}`)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Calendar header */}
      <div className="grid grid-cols-7 bg-muted/30 border-b">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar body */}
      <div className="grid grid-cols-7">
        {weeks.map((week) =>
          week.map((day) => {
            const isCurrentMonth = day.getMonth() === monthStart.getMonth()
            const isTodayDate = mounted && isToday(day)
            const dayClasses = getClassesForDay(day)

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] p-2 border-r border-b relative cursor-pointer hover:bg-accent/50 transition-colors",
                  !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                  isTodayDate && "bg-blue-50 dark:bg-blue-950/50"
                )}
                onClick={() => handleDayClick(day)}
              >
                {/* Day number */}
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isTodayDate && "text-blue-700 dark:text-blue-400"
                )}>
                  {format(day, "d")}
                </div>

                {/* Classes for this day */}
                <div className="space-y-0.5">
                  {dayClasses.slice(0, 3).map((cls) => {
                    const startTime = parseClassDateTime(cls, "start_date")
                    const endTime = parseClassDateTime(cls, "end_date")

                    if (!startTime || !endTime) return null

                    return (
                      <Tooltip key={`${cls.class_id}-${cls.session_id}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "p-0.5 rounded text-[10px] cursor-pointer transition-all hover:shadow-sm relative",
                              getAttendanceStatusContainerStyles(attendanceData[cls.session_id] || "scheduled")
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClassClick(cls.class_id, cls.session_id)
                            }}
                          >
                            {/* Status icon at top right - only show attendance status */}
                            <div className="absolute top-0 right-0 p-0.5">
                              {getAttendanceStatusIcon(attendanceData[cls.session_id] || "scheduled")}
                            </div>
                            <div className="font-medium truncate leading-tight pr-4">{cls.title}</div>
                            <div className="text-muted-foreground truncate leading-tight">
                              <ClientTimeDisplay date={startTime} format="HH:mm" /> - <ClientTimeDisplay date={endTime} format="HH:mm" />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            <div className="font-semibold">{cls.title}</div>
                            <div className="text-sm">{cls.subject}</div>
                            <div className="text-sm">
                              <ClientTimeDisplay date={startTime} format="EEEE, MMMM d, yyyy" />
                            </div>
                            <div className="text-sm">
                              <ClientTimeDisplay date={startTime} format="h:mm a" /> - <ClientTimeDisplay date={endTime} format="h:mm a" />
                            </div>
                            {cls.teachers.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium">Teachers:</span> {cls.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                              </div>
                            )}
                            {/* Show attendance status if user has a role */}
                            {role && (
                              <div className="text-sm">
                                <span className={cn(
                                  "ml-1 px-1.5 py-0.5 rounded text-xs font-medium",
                                  (attendanceData[cls.session_id] || "scheduled") === "present" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                                  (attendanceData[cls.session_id] || "scheduled") === "absent" && "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
                                  (attendanceData[cls.session_id] || "scheduled") === "scheduled" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                )}>
                                  {attendanceData[cls.session_id] || "scheduled"}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}

                  {/* Show indicator if there are more classes */}
                  {dayClasses.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayClasses.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}



function MonthlyListScheduleView({
  classes,
  monthStart,
  role,
  id,
  currentUserRole
}: {
  classes: ClassSessionType[],
  monthStart: Date,
  role?: string,
  id?: string,
  currentUserRole: string | null
}) {
  const router = useRouter()
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({})

  // Helper to get attendance status icon for monthly list view
  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Calendar className="h-3 w-3" />
      case "present":
        return <CheckCircle className="h-3 w-3" />
      case "absent":
        return <UserX className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  // Fetch attendance data for all sessions
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!role || !id || classes.length === 0) return

      const attendanceMap: Record<string, string> = {}

      try {
        for (const cls of classes) {
          let attendanceStatus = 'scheduled' // default status

          if (role === 'student') {
            const { getStudentAttendanceForSession } = await import('@/lib/get/get-students')
            const attendance = await getStudentAttendanceForSession(cls.session_id, id)
            if (attendance.length > 0) {
              attendanceStatus = attendance[0].attendance_status
            }
          } else if (role === 'teacher' || role === 'admin') {
            const { getTeacherAttendanceForSession } = await import('@/lib/get/get-teachers')
            const attendance = await getTeacherAttendanceForSession(cls.session_id, id)
            if (attendance.length > 0) {
              attendanceStatus = attendance[0].attendance_status
            }
          }

          attendanceMap[cls.session_id] = attendanceStatus
        }

        setAttendanceData(attendanceMap)
      } catch (error) {
        console.error('Error fetching attendance data:', error)
      }
    }

    fetchAttendanceData()
  }, [classes, role, id])


  // Sort and filter classes by date and time
  const filteredSortedClasses = useMemo(() => {
    // First get properly sorted classes
    const sorted = [...classes].sort((a, b) => {
      try {
        const aDateTime = parseClassDateTime(a, "start_date")
        const bDateTime = parseClassDateTime(b, "start_date")

        if (!aDateTime || !bDateTime) return 0
        return aDateTime.getTime() - bDateTime.getTime()
      } catch (error) {
        console.error("Error sorting classes:", error)
        return 0
      }
    })

    // Then filter based on the active tab
    return sorted.filter(cls => {
      const startDateTime = parseClassDateTime(cls, "start_date")
      const endDateTime = parseClassDateTime(cls, "end_date")
      if (!startDateTime || !endDateTime) return false

      // For monthly list view, we don't have an "upcoming"/"recent" filter,
      // so we just show all classes for the month.
      return true
    })
  }, [classes])

  const handleCardClick = (classId: string, sessionId: string) => {
    if (!currentUserRole) return
    router.push(`/${currentUserRole}/classes/${classId}/${sessionId}`)
  }

  return (
    <div className="h-full flex flex-col">
      {filteredSortedClasses.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No classes found for {format(monthStart, "MMMM yyyy")}.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-3 p-1">
            {filteredSortedClasses.map((classItem) => {
              const startDateTime = parseClassDateTime(classItem, "start_date")
              const endDateTime = parseClassDateTime(classItem, "end_date")
              const isTodayClass = startDateTime && isToday(startDateTime)

              if (!startDateTime || !endDateTime) return null

              return (
                <div
                  key={classItem.session_id}
                  className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-accent/50"
                  onClick={() => handleCardClick(classItem.class_id, classItem.session_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">{classItem.title}</h3>
                        {isTodayClass && (
                          <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-500 text-white font-medium px-2 py-1">
                            Today
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{classItem.subject}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {format(startDateTime, "PPP")}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <ClientTimeDisplay date={startDateTime} format="h:mm a" /> - <ClientTimeDisplay date={endDateTime} format="h:mm a" />
                        </span>
                        {classItem.teachers.length > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {classItem.teachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 ml-3">
                      {/* Show attendance status if user has a role, otherwise show session status */}
                      {role ? (
                        <span className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                          (attendanceData[classItem.session_id] || "scheduled") === "present" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
                          (attendanceData[classItem.session_id] || "scheduled") === "absent" && "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
                          (attendanceData[classItem.session_id] || "scheduled") === "scheduled" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        )}>
                          {getAttendanceStatusIcon(attendanceData[classItem.session_id] || "scheduled")}
                          {attendanceData[classItem.session_id] || "scheduled"}
                        </span>
                      ) : (
                        <StatusBadge status={convertStatusToPrefixedFormat(classItem.status, 'session')} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
