"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
} from "date-fns"
import { Button } from "@/components/ui/button"
import { List, CalendarDays, ExternalLink, ChevronLeft, ChevronRight, Plus, Clock, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "./status-badge"
import { ClassSessionType } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TablePagination } from "./table-pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { ClientTimeDisplay } from "./client-time-display"

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

export function WeeklySchedule({ sessions, assignClassUrl }: { sessions: ClassSessionType[], assignClassUrl?: string }) {
  const [view, setView] = useState<"list" | "calendar">("calendar")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [visibleClasses, setVisibleClasses] = useState<ClassSessionType[]>(sessions)
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all")
  const [activeListTab, setActiveListTab] = useState<"upcoming" | "recent">("upcoming")

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
  }, [isPastWeek, currentWeekStart])

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
  }, [sortedClasses, view, timeFilter, currentWeekStart, activeListTab])

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center w-full">
        {/* Tabs on the left */}
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(value) => setView(value as "list" | "calendar")}>
            <TabsList className="bg-muted/80">
              <TabsTrigger value="list" className={view === "list" ? "bg-[#3d8f5b] text-white" : ""}>
                <List className="mr-2 h-4 w-4" /> List
              </TabsTrigger>
              <TabsTrigger value="calendar" className={view === "calendar" ? "bg-[#3d8f5b] text-white" : ""}>
                <CalendarDays className="mr-2 h-4 w-4" /> Calendar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Week navigation in the center/right */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
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
        <>
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
          <ListScheduleView classes={visibleClasses} weekStart={currentWeekStart} filter={activeListTab} />
        </>
      ) : (
        <CalendarScheduleView classes={visibleClasses} weekStart={currentWeekStart} filter={timeFilter} />
      )}
    </div>
  )
}

function ListScheduleView({
  classes,
  weekStart,
  filter
}: {
  classes: ClassSessionType[];
  weekStart: Date;
  filter: "upcoming" | "recent";
}) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Calculate the end of the week (Monday to Sunday)
  const weekEnd = addDays(weekStart, 6)

  // Current date and time for filtering
  const now = new Date()

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

  // Paginate the classes
  const totalItems = filteredSortedClasses.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedClasses = filteredSortedClasses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleCardClick = (classId: string, sessionId: string) => {
    router.push(`/admin/classes/${classId}/${sessionId}`)
  }

  return (
    <div className="space-y-4">
      {filteredSortedClasses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {filter === "upcoming" ? "No ongoing or upcoming classes found" : "No completed classes found"}
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {paginatedClasses.map((classItem) => {
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
                      <StatusBadge status={convertStatusToPrefixedFormat(classItem.status, 'session')} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  )
}

function CalendarScheduleView({
  classes,
  weekStart,
  filter = "all"
}: {
  classes: ClassSessionType[];
  weekStart: Date;
  filter?: "all" | "morning" | "afternoon" | "evening";
}) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scrollbarWidth, setScrollbarWidth] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Create an array of the days of the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Scroll to 8 AM when the filter changes to "all"
  useEffect(() => {
    if (filter === "all" && scrollContainerRef.current) {
      // Scroll to 8 AM (8 * 60px = 480px) - adjust as needed
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 480;
        }
      }, 100);
    }
  }, [filter]);

  // Calculate scrollbar width using a ref and effect
  useEffect(() => {
    // Create a div with overflow to measure scrollbar width
    const scrollDiv = document.createElement('div')
    scrollDiv.style.overflow = 'scroll'
    scrollDiv.style.height = '100px'
    scrollDiv.style.width = '100px'
    scrollDiv.style.position = 'absolute'
    scrollDiv.style.top = '-9999px'
    document.body.appendChild(scrollDiv)

    // Calculate scrollbar width
    const width = scrollDiv.offsetWidth - scrollDiv.clientWidth

    // Remove the div
    document.body.removeChild(scrollDiv)

    // Set scrollbar width
    setScrollbarWidth(width)
  }, []) // Calculate once on mount

  // Find earliest and latest class times to determine time slots
  const timeRange = useMemo(() => {
    // Determine time range based on filter
    if (filter === "morning") {
      return { earliestHour: 4, latestHour: 12 }
    } else if (filter === "afternoon") {
      return { earliestHour: 12, latestHour: 20 }
    } else if (filter === "evening") {
      return { earliestHour: 20, latestHour: 4 } // 20 to 4 represents 8 PM to 4 AM
    } else if (filter === "all") {
      // For "all", show full 24 hours
      return { earliestHour: 0, latestHour: 24 }
    }

    // If we get here, it's likely a default case or invalid filter
    // Provide a reasonable default range
    return { earliestHour: 8, latestHour: 20 }
  }, [filter])

  // Time slots for the day (dynamic based on class times, with defaults)
  const timeSlots = useMemo(() => {
    // Handle evening view that wraps around midnight
    if (filter === "evening") {
      // Create slots for 8 PM to midnight, then midnight to 4 AM
      const eveningSlots = []
      // From 8 PM (20) to midnight (24)
      for (let i = timeRange.earliestHour; i < 24; i++) {
        eveningSlots.push(i)
      }
      // From midnight (0) to 4 AM (4)
      for (let i = 0; i < timeRange.latestHour; i++) {
        eveningSlots.push(i)
      }
      return eveningSlots
    }

    // For other time ranges
    return Array.from(
      { length: timeRange.latestHour - timeRange.earliestHour },
      (_, i) => i + timeRange.earliestHour,
    )
  }, [timeRange, filter])

  // Calculate position for the current time indicator
  const currentTimeIndicator = useMemo(() => {
    if (!mounted) return null

    const now = new Date()
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if current time is within displayed range
    if (currentHour < timeRange.earliestHour || currentHour >= timeRange.latestHour) {
      return null;
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
  }, [mounted, timeSlots, timeRange]);

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
  const groupOverlappingClasses = (classes: ClassSessionType[]) => {
    if (classes.length <= 1) {
      return [classes]
    }

    // Sort classes by start time for consistent grouping
    const sortedClasses = [...classes].sort((a, b) => {
      return parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
    })

    const groups: ClassSessionType[][] = []
    let currentGroup: ClassSessionType[] = [sortedClasses[0]]

    for (let i = 1; i < sortedClasses.length; i++) {
      const currentClass = sortedClasses[i]
      let overlapsWithCurrentGroup = false

      // Check if current class overlaps with any class in the current group
      for (const groupClass of currentGroup) {
        if (doClassesOverlap(currentClass, groupClass)) {
          overlapsWithCurrentGroup = true
          break
        }
      }

      if (overlapsWithCurrentGroup) {
        // Add to the current group if there's overlap
        currentGroup.push(currentClass)
      } else {
        // Start a new group if there's no overlap
        groups.push(currentGroup)
        currentGroup = [currentClass]
      }
    }

    // Add the last group
    groups.push(currentGroup)
    return groups
  }

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
  }, [classes, weekDays])

  return (
    <div className="overflow-x-auto border rounded-lg" ref={wrapperRef}>
      <div className="min-w-[700px] w-full">
        {/* Calendar header - Days of the week */}
        <div
          className="grid grid-cols-8 border-b"
          style={{ paddingRight: filter === "all" ? `${scrollbarWidth}px` : '0' }}
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
                    {classesByDay[dayIndex].map((extendedClass: any) => {
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
                          <div
                            key={`${extendedClass.id}-${extendedClass.session_id}`}
                            className={cn(
                              "absolute rounded-md border p-1 flex flex-col justify-between overflow-hidden cursor-pointer transition-all hover:z-20 hover:shadow-md",
                              getStatusContainerStyles(extendedClass.status),
                            )}
                            style={{
                              height: `${heightPx}px`,
                              top: `${(startTime.getMinutes() / 60) * 50}px`,
                              left: `${left}%`,
                              width: `${width}%`,
                              zIndex: 10,
                            }}
                            onClick={() => router.push(`/admin/classes/${extendedClass.class_id}/${extendedClass.session_id}`)}
                          >
                            <div>
                              <p className="font-medium truncate text-xs sm:text-sm">{extendedClass.title}</p>
                              {heightPx >= 70 && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {extendedClass.subject}
                                </p>
                              )}
                              {heightPx >= 90 && (
                                <p className="text-xs text-muted-foreground truncate">
                                  <ClientTimeDisplay date={startTime} format="h:mm a" /> - <ClientTimeDisplay date={endTime} format="h:mm a" />
                                </p>
                              )}
                            </div>
                            {/* Always show status badge regardless of height */}
                            <div className="flex justify-end items-center mt-auto">
                              <StatusBadge
                                status={convertStatusToPrefixedFormat(extendedClass.status, 'session')}
                                className="text-xs"
                              />
                            </div>
                          </div>
                        )
                      } catch (error) {
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
