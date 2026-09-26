"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getActiveClasses, getClassStudentCount, getClassesByStudentId } from "@/lib/get/get-classes"
import { getStudentById } from "@/lib/get/get-students"
import { assignStudentToClasses } from "@/lib/post/post-students"
import { StudentType, ClassType } from "@/types"
import { formatDate, formatTime, utcToLocal } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { Calendar, Clock, Users, BookOpen, GraduationCap, CheckCircle2, Search, AlertTriangle } from "lucide-react"
import Image from "next/image"
import { checkMultipleStudentConflicts, ConflictInfo } from "@/lib/utils/conflict-checker"
import { StudentConflictDisplay } from "@/components/student-conflict-display"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AssignToClassPage() {
  const params = useParams()
  const { id } = params as { id: string }
  const router = useRouter()
  const { timezone } = useTimezone()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [student, setStudent] = useState<StudentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [studentConflicts, setStudentConflicts] = useState<Record<string, ConflictInfo>>({})
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  // Fetch student data and classes on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const student = await getStudentById(id)
        setStudent(student)

        // Fetch active classes and student's current classes
        const [activeClasses, studentClasses] = await Promise.all([
          getActiveClasses(),
          getClassesByStudentId(id)
        ])

        // Get IDs of classes student is already enrolled in
        const enrolledClassIds = new Set(studentClasses.map(cls => cls.class_id))

        // Filter out classes student is already enrolled in
        const availableClasses = activeClasses.filter(cls => !enrolledClassIds.has(cls.class_id))
        setClasses(availableClasses)

        // Fetch student counts for each class
        const counts: Record<string, number> = {}
        for (const cls of availableClasses) {
          counts[cls.class_id] = await getClassStudentCount(cls.class_id) || 0
        }
        setStudentCounts(counts)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Function to check conflicts for selected classes
  const checkConflicts = useCallback(async () => {
    if (selectedClasses.length === 0) {
      setStudentConflicts({})
      return
    }

    setCheckingConflicts(true)
    try {
      // Get the selected classes data
      const selectedClassData = classes.filter(cls => selectedClasses.includes(cls.class_id))

      // Check conflicts for each selected class
      const conflicts: Record<string, ConflictInfo> = {}

      for (const cls of selectedClassData) {
        if (cls.days_repeated && typeof cls.days_repeated === 'object') {
          // Convert the days_repeated object to the format expected by conflict checker
          const classTimes: Record<string, { start: string; end: string }> = {}

          Object.entries(cls.days_repeated).forEach(([day, timeSlot]) => {
            if (timeSlot && typeof timeSlot === 'object' && 'start' in timeSlot && 'end' in timeSlot) {
              // Convert UTC times to local times for comparison
              const startDate = utcToLocal(cls.start_date, timezone)
              const startUtc = new Date(startDate)
              startUtc.setHours(parseInt(timeSlot.start.split(':')[0]), parseInt(timeSlot.start.split(':')[1]))

              const endDate = utcToLocal(cls.end_date, timezone)
              const endUtc = new Date(endDate)
              endUtc.setHours(parseInt(timeSlot.end.split(':')[0]), parseInt(timeSlot.end.split(':')[1]))

              classTimes[day.toLowerCase()] = {
                start: startUtc.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                end: endUtc.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
              }
            }
          })

          if (Object.keys(classTimes).length > 0) {
            const classConflicts = await checkMultipleStudentConflicts(
              [id],
              classTimes,
              utcToLocal(cls.start_date, timezone),
              utcToLocal(cls.end_date, timezone),
              timezone
            )

            if (classConflicts[id]) {
              conflicts[cls.class_id] = classConflicts[id]
            }
          }
        }
      }

      setStudentConflicts(conflicts)
    } catch (error) {
      console.error("Error checking conflicts:", error)
      toast({
        title: "Error",
        description: "Failed to check conflicts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckingConflicts(false)
    }
  }, [selectedClasses, classes, id, timezone])

  // Check conflicts when selected classes change
  useEffect(() => {
    const timeoutId = setTimeout(checkConflicts, 500)
    return () => clearTimeout(timeoutId)
  }, [checkConflicts])

  // Filter classes based on search query
  const filteredClasses = classes.filter(
    (cls) =>
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.keys(cls.days_repeated || {}).join(' ').toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${cls.teachers[0]?.first_name} ${cls.teachers[0]?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAssignClasses = async () => {
    if (selectedClasses.length === 0) {
      toast({
        title: "No classes selected",
        description: "Please select at least one class to assign.",
        variant: "destructive",
      })
      return
    }

    // Check for conflicts before assigning
    const hasConflicts = Object.values(studentConflicts).some(conflict => conflict.hasConflict)

    if (hasConflicts) {
      const confirmed = window.confirm(
        "Some selected classes have schedule conflicts. Do you want to proceed with assigning the classes anyway?"
      )
      if (!confirmed) {
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Get the class names for the toast message
      const selectedClassData = classes.filter((cls) => selectedClasses.includes(cls.class_id))
      const classNames = selectedClassData.map((cls) => cls.title).join(", ")

      // Assign student to classes and teachers
      await assignStudentToClasses({
        student_id: student!.student_id,
        class_ids: selectedClasses
      })

      // Show success message
      toast({
        title: "Student assigned to classes successfully",
        description: `${student?.first_name} ${student?.last_name} has been assigned to: ${classNames}`,
      })

      // Navigate back to the student's page
      router.push(`/admin/students/${student?.student_id}`)
    } catch (error) {
      console.error("Error assigning student to classes:", error)
      toast({
        title: "Error",
        description: "There was a problem assigning the student to classes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to format class schedule information
  const formatClassSchedule = (cls: ClassType) => {
    try {
      const startDate = utcToLocal(cls.start_date, timezone)
      const endDate = utcToLocal(cls.end_date, timezone)

      const formattedStartDate = formatDate(startDate, 'MMM dd, yyyy')
      const formattedEndDate = formatDate(endDate, 'MMM dd, yyyy')
      const formattedStartTime = formatTime(startDate, 'HH:mm')
      const formattedEndTime = formatTime(endDate, 'HH:mm')

      return {
        dateRange: `${formattedStartDate} - ${formattedEndDate}`,
        timeRange: `${formattedStartTime} - ${formattedEndTime}`,
        daysRepeated: Object.keys(cls.days_repeated || {}).join(", ")
      }
    } catch (error) {
      console.error("Error formatting class schedule:", error)
      return {
        dateRange: "Invalid date range",
        timeRange: "Invalid time range",
        daysRepeated: Object.keys(cls.days_repeated || {}).join(", ")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#3d8f5b" }}></div>
          <p className="text-muted-foreground">Loading available classes...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6 p-4 rounded-full bg-muted">
          <GraduationCap className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">The student you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button asChild>
          <Link href="/admin/students">Return to Students List</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/students/${id}`} label="Back to Student" />
      </div>

      {/* Main Content */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full" style={{ backgroundColor: "#3d8f5b20" }}>
              <BookOpen className="h-6 w-6" style={{ color: "#3d8f5b" }} />
            </div>
            <div>
              <CardTitle className="text-xl">Available Classes</CardTitle>
              <CardDescription className="text-base">
                Choose the classes you want to assign to {student.first_name} {student.last_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes by title, subject, description, schedule, or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredClasses.length} of {classes.length} classes available
            </span>
            {searchQuery && (
              <span>
                Filtered by &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {/* Conflict Checking Status */}
          {checkingConflicts && (
            <Alert className="border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <AlertDescription className="text-blue-800">
                  Checking student schedule conflicts...
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Student Conflicts Display */}
          {Object.values(studentConflicts).some(conflict => conflict.hasConflict) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <h4 className="text-sm font-medium text-gray-900">Student Conflicts Found</h4>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {Object.entries(studentConflicts).map(([classId, conflictInfo]) => {
                  const cls = classes.find(c => c.class_id === classId);
                  if (!cls || !conflictInfo.hasConflict) return null;

                  return (
                    <StudentConflictDisplay
                      key={classId}
                      student={student}
                      conflictInfo={conflictInfo}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-3 p-3 rounded-full bg-muted mx-auto w-fit">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium mb-1">No Classes Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms." : "All classes have already been assigned to this student."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredClasses.map((cls) => {
                const schedule = formatClassSchedule(cls)
                const isSelected = selectedClasses.includes(cls.class_id)
                const hasConflict = studentConflicts[cls.class_id]?.hasConflict

                return (
                  <div
                    key={cls.class_id}
                    className={`relative p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${isSelected
                      ? 'shadow-sm'
                      : 'border-border hover:border-[#3d8f5b]/50 bg-card'
                      } ${hasConflict ? 'border-red-300 bg-red-50/30' : ''}`}
                    style={{
                      borderColor: isSelected ? "#3d8f5b" : hasConflict ? "#ef4444" : undefined,
                      backgroundColor: isSelected ? "#3d8f5b10" : hasConflict ? "#fef2f2" : undefined
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClasses([...selectedClasses, cls.class_id])
                            } else {
                              setSelectedClasses(selectedClasses.filter(id => id !== cls.class_id))
                            }
                          }}
                          style={{
                            backgroundColor: isSelected ? "#3d8f5b" : undefined,
                            borderColor: isSelected ? "#3d8f5b" : "#3d8f5b"
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Class Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-foreground truncate">{cls.title}</h3>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <BookOpen className="h-3 w-3 mr-1 flex-shrink-0" />
                              {cls.subject}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex items-center space-x-1 ml-2 flex-shrink-0">
                            <Users className="h-3 w-3" />
                            <span>{studentCounts[cls.class_id] || 0}</span>
                          </Badge>
                        </div>

                        {/* Teacher Information */}
                        <div className="flex items-center mb-2">
                          <Avatar className="h-5 w-5 mr-2">
                            {cls.teachers[0]?.avatar_url ? (
                              <Image
                                src={cls.teachers[0].avatar_url}
                                alt={`${cls.teachers[0].first_name} ${cls.teachers[0].last_name}`}
                                width={20}
                                height={20}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xs">
                                {cls.teachers[0]?.first_name?.[0] || "?"}
                                {cls.teachers[0]?.last_name?.[0] || "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <p className="text-xs text-muted-foreground">
                            {cls.teachers[0]?.first_name || "Unknown"} {cls.teachers[0]?.last_name || "Teacher"}
                          </p>
                        </div>

                        {/* Schedule Information - Compact */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{schedule.dateRange}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{schedule.daysRepeated}</span>
                          </div>
                        </div>

                        {/* Description - Truncated */}
                        {cls.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {cls.description}
                          </p>
                        )}

                        {/* Conflict Warning */}
                        {hasConflict && (
                          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="font-medium">Schedule conflicts detected</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="h-4 w-4" style={{ color: "#3d8f5b" }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-4 border-t bg-muted/20">
          <Button variant="outline" asChild>
            <Link href={`/admin/students/${student?.student_id}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleAssignClasses}
            disabled={isSubmitting || selectedClasses.length === 0}
            variant="green"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Assigning...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Assign {selectedClasses.length} Class{selectedClasses.length !== 1 ? 'es' : ''}</span>
              </div>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
