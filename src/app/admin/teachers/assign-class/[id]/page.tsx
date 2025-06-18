"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { getTeacherById } from "@/lib/get/get-teachers"
import { getClasses } from "@/lib/get/get-classes"
import { assignTeacherToClass } from "@/lib/post/post-teachers"
import { TeacherType, ClassType } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export default function AssignClassPage() {
  const params = useParams()
  const id = (params as { id: string }).id
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teacher, setTeacher] = useState<TeacherType | null>(null)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const t = await getTeacherById(id)
      setTeacher(t)

      const allClasses = await getClasses()
      const teacherClasses = allClasses.filter(cls =>
        !cls.teachers.some(t => t.teacher_id === id)
      )
      setClasses(teacherClasses)
      setLoading(false)
    }
    fetchData()
  }, [id])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Teacher Not Found</h2>
        <p className="text-muted-foreground mb-6">The teacher you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/admin/teachers">Return to Teachers List</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/teachers/${id}`} label="Back to Teacher" />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            Assign Classes to {teacher.first_name} {teacher.last_name}
          </CardTitle>
          <CardDescription>Select the classes you want to assign to this teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No available classes to assign.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls.class_id}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedClasses.includes(cls.class_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedClasses([...selectedClasses, cls.class_id])
                      } else {
                        setSelectedClasses(selectedClasses.filter(id => id !== cls.class_id))
                      }
                    }}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium leading-none">{cls.title}</p>
                        <p className="text-sm text-muted-foreground">{cls.subject}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {cls.enrolled_students.length} students
                      </Badge>
                    </div>
                    <div className="flex items-center mt-2">
                      <p className="text-sm text-muted-foreground">
                        {cls.days_repeated.join(", ")} • {cls.start_date} to {cls.end_date}
                      </p>
                    </div>
                    {cls.description && (
                      <p className="text-sm text-muted-foreground mt-2">{cls.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/admin/teachers/${id}`}>Cancel</Link>
          </Button>
          <Button
            onClick={handleAssignClasses}
            disabled={isSubmitting || selectedClasses.length === 0}
            style={{ backgroundColor: "#3d8f5b", color: "white" }}
          >
            {isSubmitting ? "Assigning..." : `Assign ${selectedClasses.length} Class${selectedClasses.length !== 1 ? 'es' : ''}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
