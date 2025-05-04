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
import { List, CalendarDays, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "./status-badge"
import { ClassSessionType } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TablePagination } from "./table-pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Utility function to parse class date and time
const parseClassDateTime = (
  cls: { date?: string; start_time?: string; end_time?: string },
  timeField: "start_time" | "end_time"
): Date | null => {
  try {
    const time = cls[timeField]
    if (!time) return null

    if (cls.date) {
      // If the class has a separate date field, use it with time
      const cleanTime = time.replace(/(-|\+)\d{2}.*$/, '')
      const [hours, minutes] = cleanTime.split(':').map(Number)
      const [year, month, day] = cls.date.split('-').map(Number)

      const result = new Date(year, month - 1, day)
      result.setHours(hours || 0, minutes || 0, 0)

      // If this is an end time and it's earlier than start time, add a day
      if (timeField === "end_time" && cls.start_time) {
        const startTime = parseClassDateTime(cls, "start_time")
        if (startTime && result < startTime) {
          result.setDate(result.getDate() + 1)
        }
      }

      return result
    } else {
      // Otherwise, try to parse the ISO date from time fields
      return parseISO(time)
    }
  } catch (error) {
    console.error(`Error parsing ${timeField} for class:`, error, cls)
    return null
  }
}

export function WeeklySchedule({ classes }: { classes: ClassSessionType[] }) {
  const [view, setView] = useState<"list" | "calendar">("list")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [visibleClasses, setVisibleClasses] = useState<ClassSessionType[]>(classes)
  const [timeFilter, setTimeFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all")
  const [activeListTab, setActiveListTab] = useState<"upcoming" | "recent">("upcoming")

  // Memoize sorted classes to prevent recreation on every render
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [classes])

  // Update visible classes when week changes or view changes
  useEffect(() => {
    if (view === "calendar") {
      // For calendar view, filter classes to show only those in the current week
      const weekEnd = addDays(currentWeekStart, 6) // 6 days after Monday = Sunday
      let filtered = sortedClasses.filter((cls) => {
        const classDate = parseClassDateTime(cls, "start_time")
        return classDate && isWithinInterval(classDate, {
          start: startOfDay(currentWeekStart),
          end: endOfDay(weekEnd),
        })
      })

      // Apply time filter if not "all"
      if (timeFilter !== "all") {
        filtered = filtered.filter((cls) => {
          const startTime = parseClassDateTime(cls, "start_time")
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
        const classDate = parseClassDateTime(cls, "start_time")
        return classDate && isWithinInterval(classDate, {
          start: startOfDay(currentWeekStart),
          end: endOfDay(weekEnd),
        })
      })

      // Apply the upcoming/recent filter
      if (activeListTab === "upcoming") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_time")
          return endTime && endTime <= now;
        });
      } else if (activeListTab === "recent") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_time")
          return endTime && endTime > now;
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
        const classDate = parseClassDateTime(cls, "start_time")
        return classDate && isWithinInterval(classDate, {
          start: startOfDay(newWeekStart),
          end: endOfDay(weekEnd),
        })
      })

      // Apply the upcoming/recent filter
      if (activeListTab === "upcoming") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_time")
          return endTime && endTime <= now;
        });
      } else if (activeListTab === "recent") {
        filtered = filtered.filter((cls) => {
          const endTime = parseClassDateTime(cls, "end_time")
          return endTime && endTime > now;
        });
      }

      setVisibleClasses(filtered)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg font-bold tracking-tight">Class Schedule</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setView(view === "list" ? "calendar" : "list")}>
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
        </div>
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
                <TabsTrigger value="upcoming">Recent</TabsTrigger>
                <TabsTrigger value="recent">Upcoming</TabsTrigger>
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
        const aDateTime = parseClassDateTime(a, "start_time")
        const bDateTime = parseClassDateTime(b, "start_time")

        if (!aDateTime || !bDateTime) return 0
        return aDateTime.getTime() - bDateTime.getTime()
      } catch (error) {
        console.error("Error sorting classes:", error)
        return 0
      }
    })

    // Then filter based on the active tab
    return sorted.filter(cls => {
      const endDateTime = parseClassDateTime(cls, "end_time")
      if (!endDateTime) return false

      if (filter === "upcoming") {
        // Show classes that have ended (end time <= now)
        return endDateTime <= now
      } else if (filter === "recent") {
        // Show classes that haven't ended yet (end time > now)
        return endDateTime > now
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

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>, classId: string) => {
    // Check if the click was on a link or other interactive element
    const target = e.target as HTMLElement
    const isLink = target.tagName === "A" || target.closest("a")

    // Only navigate if the click wasn't on a link
    if (!isLink) {
      router.push(`/admin/schedule/${classId}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          {filter === "upcoming" ? "Completed Classes" : "Ongoing & Upcoming Classes"}
        </h3>
      </div>

      {filteredSortedClasses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {filter === "upcoming" ? "No completed classes found" : "No ongoing or upcoming classes found"}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium text-sm">Class</th>
                  <th className="text-left p-3 font-medium text-sm">Date & Time</th>
                  <th className="text-left p-3 font-medium text-sm">Subject</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClasses.map((classItem) => {
                  const startDateTime = parseClassDateTime(classItem, "start_time")
                  const endDateTime = parseClassDateTime(classItem, "end_time")

                  if (!startDateTime || !endDateTime) return null

                  return (
                    <tr
                      key={classItem.session_id}
                      className="border-t hover:bg-muted/20 cursor-pointer transition-colors"
                      onClick={(e) => handleRowClick(e, classItem.session_id)}
                    >
                      <td className="p-3">
                        <div className="font-medium">{classItem.title}</div>
                        <p className="text-xs text-muted-foreground">
                          {classItem.description && classItem.description.substring(0, 50)}
                          {classItem.description && classItem.description.length > 50 ? '...' : ''}
                        </p>
                      </td>
                      <td className="p-3">
                        <div>{format(startDateTime, "EEEE, MMMM d, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(startDateTime, "h:mm a")} - {format(endDateTime, "h:mm a")}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="inline-block">{classItem.subject}</div>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={classItem.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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

  // Create an array of the days of the week
  const weekDays = useMemo(() => {
    // Start from Monday (index 0) to Sunday (index 6)
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

  // Function to check if two classes overlap
  const doClassesOverlap = (class1: ClassSessionType, class2: ClassSessionType) => {
    const start1 = parseClassDateTime(class1, "start_time")
    const end1 = parseClassDateTime(class1, "end_time")
    const start2 = parseClassDateTime(class2, "start_time")
    const end2 = parseClassDateTime(class2, "end_time")

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
      return parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
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

  // Helper to get status colors for classes
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "scheduled":
        return "border-blue-400/70 bg-blue-50/80 dark:border-blue-800/70 dark:bg-blue-950/80"
      case "running":
        return "border-emerald-400/70 bg-emerald-50/80 dark:border-emerald-800/70 dark:bg-emerald-950/80"
      case "pending":
        return "border-indigo-400/70 bg-indigo-50/80 dark:border-indigo-800/70 dark:bg-indigo-950/80"
      case "complete":
        return "border-purple-400/70 bg-purple-50/80 dark:border-purple-800/70 dark:bg-purple-950/80"
      case "rescheduled":
        return "border-amber-400/70 bg-amber-50/80 dark:border-amber-800/70 dark:bg-amber-950/80"
      case "cancelled":
        return "border-rose-400/70 bg-rose-50/80 dark:border-rose-800/70 dark:bg-rose-950/80"
      case "absent":
        return "border-orange-400/70 bg-orange-50/80 dark:border-orange-800/70 dark:bg-orange-950/80"
      default:
        return "border-gray-400/70 bg-gray-50/80 dark:border-gray-800/70 dark:bg-gray-950/80"
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-blue-700 dark:text-blue-400"
      case "running":
        return "text-emerald-700 dark:text-emerald-400"
      case "pending":
        return "text-indigo-700 dark:text-indigo-400"
      case "complete":
        return "text-purple-700 dark:text-purple-400"
      case "rescheduled":
        return "text-amber-700 dark:text-amber-400"
      case "cancelled":
        return "text-rose-700 dark:text-rose-400"
      case "absent":
        return "text-orange-700 dark:text-orange-400"
      default:
        return "text-gray-700 dark:text-gray-400"
    }
  }

  // Format the hour for display
  const formatHour = (hour: number) => {
    const date = new Date()
    date.setHours(hour, 0, 0)
    return format(date, "h a")
  }

  // Prepare classes for each day with overlap calculation
  const classesByDay = useMemo(() => {
    const byDay = weekDays.map((day) => {
      // Get all valid classes for this day
      const classesForDay = classes.filter((cls) => {
        const startDateTime = parseClassDateTime(cls, "start_time")
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
          {timeSlots.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="p-2 border-r bg-muted/20 text-sm flex items-center justify-end pr-3">
                {formatHour(hour)}
              </div>

              {weekDays.map((day, dayIndex) => (
                <div key={day.toISOString()} className="p-0 border-r last:border-r-0 text-sm relative min-h-[50px]">
                  {classesByDay[dayIndex].map((extendedClass: any) => {
                    try {
                      const startTime = parseClassDateTime(extendedClass, "start_time")
                      const endTime = parseClassDateTime(extendedClass, "end_time")

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
                            getStatusStyles(extendedClass.status),
                          )}
                          style={{
                            height: `${heightPx}px`,
                            top: `${(startTime.getMinutes() / 60) * 50}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                            zIndex: 10,
                          }}
                          onClick={() => router.push(`/admin/schedule/${extendedClass.session_id}`)}
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
                                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                              </p>
                            )}
                          </div>
                          {/* Always show status badge regardless of height */}
                          <div className="flex justify-end items-center mt-auto">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs whitespace-nowrap text-ellipsis overflow-hidden max-w-full",
                                getStatusTextColor(extendedClass.status),
                              )}
                            >
                              {extendedClass.status}
                            </Badge>
                          </div>
                        </div>
                      )
                    } catch (error) {
                      return null
                    }
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
