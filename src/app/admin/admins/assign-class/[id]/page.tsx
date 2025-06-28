"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getTeacherById } from "@/lib/get/get-teachers"
import { getActiveClasses } from "@/lib/get/get-classes"
import { assignTeacherToClass } from "@/lib/post/post-teachers"
import { TeacherType, ClassType } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDate, formatTime, utcToLocal } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { Calendar, Clock, Users, BookOpen, GraduationCap, CheckCircle2, Search } from "lucide-react"

export default function AssignClassPage() {
  const params = useParams()
  const id = (params as { id: string }).id
  const router = useRouter()
  const { timezone } = useTimezone()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teacher, setTeacher] = useState<TeacherType | null>(null)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchData() {
      const t = await getTeacherById(id)
      setTeacher(t)

      const allClasses = await getActiveClasses()
      const teacherClasses = allClasses.filter(cls =>
        !cls.teachers.some(t => t.teacher_id === id)
      )
      setClasses(teacherClasses)
      setLoading(false)
    }
    fetchData()
  }, [id])

  // Filter classes based on search query
  const filteredClasses = classes.filter(cls =>
    cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.days_repeated.some(day => day.toLowerCase().includes(searchQuery.toLowerCase()))
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

    setIsSubmitting(true)

    try {
      await assignTeacherToClass({
        teacher_id: id,
        class_ids: selectedClasses
      })

      toast({
        title: "Classes assigned successfully",
        description: `${selectedClasses.length} class(es) have been assigned to ${teacher!.first_name} ${teacher!.last_name}`,
      })

      router.push(`/admin/teachers/${id}`)
    } catch (error) {
      console.error("Error assigning classes:", error)
      toast({
        title: "Error",
        description: "There was a problem assigning the classes. Please try again.",
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
        daysRepeated: cls.days_repeated.join(", ")
      }
    } catch (error) {
      console.error("Error formatting class schedule:", error)
      return {
        dateRange: "Invalid date range",
        timeRange: "Invalid time range",
        daysRepeated: cls.days_repeated.join(", ")
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

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6 p-4 rounded-full bg-muted">
          <GraduationCap className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Teacher Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">The teacher you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button asChild>
          <Link href="/admin/teachers">Return to Teachers List</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/admins/${id}`} label="Back to Admin" />
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
                Choose the classes you want to assign to {teacher.first_name} {teacher.last_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes by title, subject, description, or schedule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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

          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-3 p-3 rounded-full bg-muted mx-auto w-fit">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium mb-1">No Classes Found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms." : "All classes have already been assigned to teachers."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredClasses.map((cls) => {
                const schedule = formatClassSchedule(cls)
                const isSelected = selectedClasses.includes(cls.class_id)

                return (
                  <div
                    key={cls.class_id}
                    className={`relative p-4 border rounded-lg transition-all duration-200 hover:shadow-sm ${isSelected
                      ? 'shadow-sm'
                      : 'border-border hover:border-[#3d8f5b]/50 bg-card'
                      }`}
                    style={{
                      borderColor: isSelected ? "#3d8f5b" : undefined,
                      backgroundColor: isSelected ? "#3d8f5b10" : undefined
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
                            <span>{cls.enrolled_students.length}</span>
                          </Badge>
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
            <Link href={`/admin/teachers/${id}`}>Cancel</Link>
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

