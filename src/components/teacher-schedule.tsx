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
} from "date-fns"
import { Button } from "@/components/ui/button"
import { List, CalendarDays, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { StatusBadge } from "./status-badge"

type Class = {
  id: number
  teacher_id: string
  title: string
  description: string
  subject: string
  start_time: string
  end_time: string
  status: string
  class_link: string
  teacher?: {
    first_name: string
    last_name: string
  }
  attendance_status?: string
}

type TeacherScheduleProps = {
  classes: Class[]
}

export function TeacherSchedule({ classes }: TeacherScheduleProps) {
  const [view, setView] = useState<"list" | "calendar">("list")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()))
  const [visibleClasses, setVisibleClasses] = useState<Class[]>([])

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

function ListScheduleView({ classes }: { classes: Class[] }) {
  const router = useRouter()

  // Group classes by day
  const classesByDay = useMemo(() => {
    return classes.reduce(
      (acc, cls) => {
        const day = format(parseISO(cls.start_time), "yyyy-MM-dd")
        if (!acc[day]) {
          acc[day] = []
        }
        acc[day].push(cls)
        return acc
      },
      {} as Record<string, Class[]>,
    )
  }, [classes])

  // Sort days
  const sortedDays = useMemo(() => {
    return Object.keys(classesByDay).sort()
  }, [classesByDay])

  const handleClassClick = (classId: number) => {
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
                key={cls.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleClassClick(cls.id)}
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
                  {cls.attendance_status && <StatusBadge status={cls.attendance_status} />}
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

function CalendarScheduleView({ classes, weekStart }: { classes: Class[]; weekStart: Date }) {
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

    const classStartTimes = classes.map((cls) => parseISO(cls.start_time).getHours())
    const classEndTimes = classes.map(
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

  // Helper function to get classes for a specific day and time slot
  const getClassesForDayAndTime = (day: Date, hour: number) => {
    return classes.filter((cls) => {
      const classStartDate = parseISO(cls.start_time)
      const classEndDate = parseISO(cls.end_time)
      const classStartHour = classStartDate.getHours()
      const classEndHour = classEndDate.getHours() + (classEndDate.getMinutes() > 0 ? 1 : 0)

      return isSameDay(day, classStartDate) && hour >= classStartHour && hour < classEndHour
    })
  }

  const handleClassClick = (classId: number) => {
    router.push(`/admin/schedule/${classId}`)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 border-r bg-muted/50 font-medium text-sm">Time</div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="p-3 border-r last:border-r-0 bg-muted/50 font-medium text-sm text-center"
            >
              {format(day, "EEE")}
              <div className="text-xs text-muted-foreground">{format(day, "MMM d")}</div>
            </div>
          ))}
        </div>

        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
            <div className="p-3 border-r bg-muted/20 text-sm flex items-center">
              {format(new Date().setHours(hour, 0, 0), "h:mm a")}
            </div>

            {weekDays.map((day) => {
              const classItems = getClassesForDayAndTime(day, hour)

              return (
                <div key={day.toISOString()} className="p-3 border-r last:border-r-0 text-sm min-h-[80px]">
                  {classItems.length > 0 ? (
                    <div className="h-full flex flex-col gap-2">
                      {classItems.map((classItem) => (
                        <div
                          key={classItem.id}
                          className="rounded-md border border-primary/20 bg-primary/5 p-2 flex flex-col justify-between hover:bg-primary/10 cursor-pointer transition-colors"
                          onClick={() => handleClassClick(classItem.id)}
                        >
                          <div>
                            <p className="font-medium flex items-center">
                              {classItem.title}
                              <ExternalLink className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                            </p>
                            <p className="text-xs text-muted-foreground">{classItem.subject}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(parseISO(classItem.start_time), "h:mm a")} -{" "}
                              {format(parseISO(classItem.end_time), "h:mm a")}
                            </p>
                          </div>
                          <div className="flex justify-end items-center mt-2">
                            <StatusBadge status={classItem.status} className="text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
