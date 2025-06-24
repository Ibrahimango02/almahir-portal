"use client"

import { notFound, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, X, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"
import { cn } from "@/lib/utils"
import { getParentById, getParentStudents } from "@/lib/get/get-parents"
import { getStudents } from "@/lib/get/get-students"
import { updateParent, updateParentStudents } from "@/lib/put/put-parents"
import { ParentType, StudentType } from "@/types"

export default function EditParentPage() {
  const params = useParams()
  const { id } = params as { id: string }
  const { toast } = useToast()
  const router = useRouter()

  // All hooks at the top
  const [parent, setParent] = useState<ParentType | null>(null)
  const [allStudents, setAllStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    status: "",
    students: [] as StudentType[],
  })
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [parentData, studentsData, parentStudents] = await Promise.all([
          getParentById(id),
          getStudents(),
          getParentStudents(id)
        ])

        setParent(parentData)
        setAllStudents(studentsData)
        if (parentData) {
          // Map parent students to full student data
          const associatedStudents = studentsData.filter(student =>
            (parentStudents || []).some(parentStudent => parentStudent.student_id === student.student_id)
          )

          setFormData({
            status: parentData.status || "",
            students: associatedStudents,
          })
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading parent information...</p>
      </div>
    )
  }

  if (!parent) {
    notFound()
  }

  // --- Handlers ---
  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  const handleAddStudent = () => {
    if (!selectedStudentId) return
    const studentToAdd = allStudents.find((student) => student.student_id === selectedStudentId)
    if (!studentToAdd) return
    // Check if student is already associated
    if (formData.students.some((student) => student.student_id === selectedStudentId)) {
      toast({
        title: "Student already associated",
        description: `${studentToAdd.first_name} ${studentToAdd.last_name} is already associated with this parent.`,
        variant: "destructive",
      })
      return
    }
    setFormData((prev) => ({ ...prev, students: [...prev.students, studentToAdd] }))
    setSelectedStudentId("")
  }

  const handleRemoveStudent = (studentId: string) => {
    setFormData((prev) => ({ ...prev, students: prev.students.filter((student) => student.student_id !== studentId) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Always update the parent's status first
      await updateParent(parent.parent_id, {
        status: formData.status
      })

      // Then update student relationships if there are any
      if (formData.students.length > 0) {
        for (const student of formData.students) {
          await updateParent(parent.parent_id, {
            student_id: student.student_id,
            status: formData.status
          })
        }
      }

      // Update parent students
      await updateParentStudents(parent.parent_id, {
        student_id: formData.students.map((student) => student.student_id)
      })

      toast({
        title: "Parent information updated",
        description: "The parent information has been successfully updated.",
      })

      // Redirect back to parent details page
      router.push(`/admin/parents/${parent.parent_id}`)
    } catch (error) {
      console.error("Error updating parent:", error)
      toast({
        title: "Error updating parent",
        description: "There was a problem updating the parent information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out already associated students from the dropdown
  const availableStudents = allStudents.filter((student) => !formData.students.some((s) => s.student_id === student.student_id))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/parents/${parent.parent_id}`} label="Back to Parent" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Parent Information</CardTitle>
          <CardDescription>Update {parent.first_name} {parent.last_name}&apos;s information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Associated Students</Label>
                <div className="flex gap-2">
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger
                      id="student"
                      className={cn("flex-1", !availableStudents.length && "opacity-50 cursor-not-allowed")}
                    >
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStudents.length > 0 ? (
                        availableStudents.map((student) => (
                          <SelectItem key={student.student_id} value={student.student_id}>
                            {student.first_name} {student.last_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No available students
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={handleAddStudent}
                    disabled={!selectedStudentId || !availableStudents.length}
                    size="icon"
                    style={{ backgroundColor: "#3d8f5b" }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 p-3 border rounded-md min-h-[100px]">
                  {formData.students.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.students.map((student) => (
                        <Badge key={student.student_id} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                          {student.first_name} {student.last_name}
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.student_id)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            aria-label={`Remove ${student.first_name} ${student.last_name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No students associated with this parent</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/parents/${parent.parent_id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2" style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
