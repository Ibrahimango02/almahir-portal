"use client"

import { useState, useEffect, useMemo } from "react"
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


export function TeacherSchedule({ classes }: { classes: ClassSessionType[] }) {
  const [view, setView] = useState<"list" | "calendar">("list")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()))
  const [visibleClasses, setVisibleClasses] = useState<ClassSessionType[]>([])

  // Memoize sorted classes to prevent recreation on every render
  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [classes])

  // Update visible classes when week changes or view changes
  useEffect(() => {
    if (view === "calendar") {
      // For calendar view, filter classes to show only those in the current week
      const weekEnd = addDays(currentWeekStart, 6)
      const filtered = sortedClasses.filter((cls) => {
        const classDate = parseISO(cls.start_time)
        return isWithinInterval(classDate, {
          start: startOfDay(currentWeekStart),
          end: endOfDay(weekEnd),
        })
      })
      setVisibleClasses(filtered)
    } else {
      // For list view, show all classes
      setVisibleClasses(sortedClasses)
    }
  }, [sortedClasses, currentWeekStart, view])

  const navigateWeek = (direction: "next" | "prev") => {
    setCurrentWeekStart((prev) => (direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="inline-flex items-center rounded-md border p-1 bg-muted/50">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "ghost"}
            size="sm"
            className="rounded-sm"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>

        {view === "calendar" && (
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
        )}
      </div>

      {view === "list" ? (
        <ListScheduleView classes={visibleClasses} />
      ) : (
        <CalendarScheduleView classes={visibleClasses} weekStart={currentWeekStart} />
      )}
    </div>
  )
}

function ListScheduleView({ classes }: { classes: ClassSessionType[] }) {
  const router = useRouter()

  // Group classes by day
  const classesByDay = useMemo(() => {
    return classes.reduce(
      (acc, cls) => {
        try {
          // Verify that start_time is a valid date string before parsing
          if (!cls.start_time || isNaN(Date.parse(cls.start_time))) {
            console.warn("Invalid date encountered:", cls.start_time)
            return acc
          }

          const day = format(parseISO(cls.start_time), "yyyy-MM-dd")
          if (!acc[day]) {
            acc[day] = []
          }
          acc[day].push(cls)
          return acc
        } catch (error) {
          console.error("Error processing class date:", error, cls)
          return acc
        }
      },
      {} as Record<string, ClassSessionType[]>,
    )
  }, [classes])

  // Sort days
  const sortedDays = useMemo(() => {
    return Object.keys(classesByDay).sort()
  }, [classesByDay])

  const handleClassClick = (classId: string) => {
    router.push(`/admin/schedule/${classId}`)
  }

  return (
    <div className="space-y-6">
      {sortedDays.map((day) => (
        <div key={day} className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">{format(parseISO(day), "EEEE, MMMM d, yyyy")}</h3>
          <div className="space-y-2">
            {classesByDay[day].map((cls) => (
              <div
                key={cls.session_id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleClassClick(cls.session_id)}
              >
                <div>
                  <div className="font-medium flex items-center">
                    {cls.title}
                    <ExternalLink className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                  </div>
                  <div className="text-sm text-muted-foreground">{cls.subject}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(cls.start_time), "h:mm a")} - {format(parseISO(cls.end_time), "h:mm a")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={cls.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {sortedDays.length === 0 && <div className="text-center py-8 text-muted-foreground">No classes scheduled</div>}
    </div>
  )
}

function CalendarScheduleView({ classes, weekStart }: { classes: ClassSessionType[]; weekStart: Date }) {
  const router = useRouter()

  // Create an array of the days of the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Find earliest and latest class times to determine time slots
  const timeRange = useMemo(() => {
    if (classes.length === 0) {
      return { earliestHour: 8, latestHour: 20 }
    }

    const validClasses = classes.filter(cls =>
      cls.start_time && cls.end_time &&
      !isNaN(Date.parse(cls.start_time)) &&
      !isNaN(Date.parse(cls.end_time))
    )

    if (validClasses.length === 0) {
      return { earliestHour: 8, latestHour: 20 }
    }

    const classStartTimes = validClasses.map((cls) => parseISO(cls.start_time).getHours())
    const classEndTimes = validClasses.map(
      (cls) => parseISO(cls.end_time).getHours() + (parseISO(cls.end_time).getMinutes() > 0 ? 1 : 0),
    )

    const earliestHour = Math.max(8, Math.min(...classStartTimes))
    const latestHour = Math.min(20, Math.max(...classEndTimes))

    return { earliestHour, latestHour }
  }, [classes])

  // Time slots for the day (dynamic based on class times, with defaults)
  const timeSlots = useMemo(() => {
    return Array.from(
      { length: timeRange.latestHour - timeRange.earliestHour + 1 },
      (_, i) => i + timeRange.earliestHour,
    )
  }, [timeRange])

  // Function to check if two classes overlap
  const doClassesOverlap = (class1: ClassSessionType, class2: ClassSessionType) => {
    const start1 = parseISO(class1.start_time)
    const end1 = parseISO(class1.end_time)
    const start2 = parseISO(class2.start_time)
    const end2 = parseISO(class2.end_time)

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
        try {
          // Validate date strings
          if (!cls.start_time || !cls.end_time ||
            isNaN(Date.parse(cls.start_time)) ||
            isNaN(Date.parse(cls.end_time))) {
            return false
          }

          return isSameDay(day, parseISO(cls.start_time))
        } catch (error) {
          return false
        }
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
    <div className="overflow-x-auto border rounded-lg">
      <div className="min-w-[800px]">
        {/* Calendar header - Days of the week */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 border-r bg-muted/30 font-medium text-sm"></div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-3 border-r last:border-r-0 font-medium text-center",
                isToday(day) ? "bg-blue-50 dark:bg-blue-950" : "bg-muted/30",
              )}
            >
              <div className="text-sm uppercase">{format(day, "EEE")}</div>
              <div className={cn("text-2xl font-normal", isToday(day) ? "text-blue-700 dark:text-blue-400" : "")}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-3 border-r bg-muted/20 text-sm flex items-center justify-end pr-4">
              {formatHour(hour)}
            </div>

            {weekDays.map((day, dayIndex) => (
              <div key={day.toISOString()} className="p-0 border-r last:border-r-0 text-sm relative min-h-[60px]">
                {classesByDay[dayIndex].map((extendedClass: any) => {
                  try {
                    const startTime = parseISO(extendedClass.start_time)
                    const endTime = parseISO(extendedClass.end_time)
                    const classStartHour = startTime.getHours()

                    // Skip if class doesn't start in this hour
                    if (classStartHour !== hour) {
                      return null
                    }

                    // Calculate duration in minutes and convert to pixels (60px per hour)
                    const durationMinutes = differenceInMinutes(endTime, startTime)
                    const heightPx = Math.max(60, Math.round((durationMinutes * 60) / 60))

                    // Calculate width based on group size
                    const width = 100 / extendedClass.groupSize
                    // Calculate left offset based on index within group
                    const left = extendedClass.classIndex * width

                    return (
                      <div
                        key={`${extendedClass.id}-${extendedClass.session_id}`}
                        className={cn(
                          "absolute rounded-md border p-2 flex flex-col justify-between overflow-hidden cursor-pointer transition-all hover:z-20 hover:shadow-md",
                          getStatusStyles(extendedClass.status),
                        )}
                        style={{
                          height: `${heightPx}px`,
                          top: `${(startTime.getMinutes() / 60) * 60}px`,
                          left: `${left}%`,
                          width: `${width}%`,
                          zIndex: 10,
                        }}
                        onClick={() => router.push(`/admin/schedule/${extendedClass.session_id}`)}
                      >
                        <div>
                          <p className="font-medium truncate text-xs sm:text-sm">{extendedClass.title}</p>
                          {heightPx >= 80 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {extendedClass.subject}
                            </p>
                          )}
                          {heightPx >= 100 && (
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
  )
}
