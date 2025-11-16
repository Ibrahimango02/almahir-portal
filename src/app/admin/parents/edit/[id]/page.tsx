"use client"

import { notFound, useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Save, X, Plus, UserPlus } from "lucide-react"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"
import { getParentById, getParentStudents } from "@/lib/get/get-parents"
import { getStudents } from "@/lib/get/get-students"
import { updateParents } from "@/lib/put/put-parents"
import { createDependentStudent } from "@/lib/post/post-students"
import { ParentType, StudentType } from "@/types"
import { countries } from "@/lib/utils/countries"

export default function EditParentPage() {
  const params = useParams()
  const { id } = params as { id: string }
  const { toast } = useToast()
  const router = useRouter()

  // All hooks at the top
  const [parent, setParent] = useState<ParentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    status: "",
    students: [] as StudentType[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New state for dependent student form
  const [showAddStudentForm, setShowAddStudentForm] = useState(false)
  const [newStudentData, setNewStudentData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    country: "",
    language: "",
    birth_date: "",
    grade_level: ""
  })
  const [isAddingStudent, setIsAddingStudent] = useState(false)

  // New state for pending students (students to be added when saving)
  const [pendingStudents, setPendingStudents] = useState<Array<{
    first_name: string
    last_name: string
    gender: string
    country: string
    language: string
    birth_date: string
    grade_level: string
  }>>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [parentData, studentsData, parentStudents] = await Promise.all([
          getParentById(id),
          getStudents(),
          getParentStudents(id)
        ])

        setParent(parentData)
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

  const handleRemoveStudent = (studentId: string) => {
    setFormData((prev) => ({ ...prev, students: prev.students.filter((student) => student.student_id !== studentId) }))
  }

  const handleRemovePendingStudent = (index: number) => {
    setPendingStudents(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddDependentStudent = async () => {
    setIsAddingStudent(true)

    try {
      // Validate required fields
      if (!newStudentData.first_name || !newStudentData.last_name || !newStudentData.gender) {
        throw new Error("First name, last name, and gender are required")
      }

      // Add to pending students list
      setPendingStudents(prev => [...prev, { ...newStudentData }])

      // Reset form and hide it
      setNewStudentData({
        first_name: "",
        last_name: "",
        gender: "",
        country: "",
        language: "",
        birth_date: "",
        grade_level: ""
      })
      setShowAddStudentForm(false)

      toast({
        title: "Student added to pending list",
        description: `${newStudentData.first_name} ${newStudentData.last_name} has been added to the pending list and will be created when you save changes.`,
      })
    } catch (error) {
      console.error("Error adding student to pending list:", error)
      toast({
        title: "Error adding student",
        description: error instanceof Error ? error.message : "There was a problem adding the student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingStudent(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const newlyCreatedStudentIds: string[] = []

      // First, create all pending students
      if (pendingStudents.length > 0) {
        for (const studentData of pendingStudents) {
          try {
            const result = await createDependentStudent({
              ...studentData,
              parent_profile_id: parent.parent_id
            })

            if (!result.success) {
              throw new Error(`Failed to create student ${studentData.first_name} ${studentData.last_name}`)
            }

            // Store the newly created student ID
            if (result.student_id) {
              newlyCreatedStudentIds.push(result.student_id)
            }
          } catch (studentError) {
            console.error('Error creating individual student:', studentError)
            throw new Error(`Failed to create student ${studentData.first_name} ${studentData.last_name}: ${studentError}`)
          }
        }

        // Clear pending students after successful creation
        setPendingStudents([])
      }

      // Always update the parent's status first
      await updateParents(parent.parent_id, {
        status: formData.status,
        student_id: [...formData.students.map(student => student.student_id), ...newlyCreatedStudentIds]
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
        description: error instanceof Error ? error.message : "There was a problem updating the parent information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Associated Students</Label>
                  <Button
                    type="button"
                    onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {showAddStudentForm ? "Cancel" : `Add Student${pendingStudents.length > 0 ? ` (${pendingStudents.length} pending)` : ''}`}
                  </Button>
                </div>

                {/* Display Pending Students */}
                {pendingStudents.length > 0 && (
                  <div className="p-3 border border-orange-200 rounded-md bg-orange-50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-orange-800 font-medium">Pending Students (will be created when saving)</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pendingStudents.map((student, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1 px-3 py-1.5 border-orange-300 text-orange-700">
                          {student.first_name} {student.last_name}
                          <button
                            type="button"
                            onClick={() => handleRemovePendingStudent(index)}
                            className="ml-1 rounded-full hover:bg-orange-200 p-0.5"
                            aria-label={`Remove ${student.first_name} ${student.last_name} from pending list`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Dependent Student Form */}
                {showAddStudentForm && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                              id="first_name"
                              value={newStudentData.first_name}
                              onChange={(e) => setNewStudentData(prev => ({ ...prev, first_name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                              id="last_name"
                              value={newStudentData.last_name}
                              onChange={(e) => setNewStudentData(prev => ({ ...prev, last_name: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="gender">Gender *</Label>
                            <Select
                              value={newStudentData.gender}
                              onValueChange={(value) => setNewStudentData(prev => ({ ...prev, gender: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="birth_date">Birth Date</Label>
                            <Input
                              id="birth_date"
                              type="date"
                              value={newStudentData.birth_date}
                              onChange={(e) => setNewStudentData(prev => ({ ...prev, birth_date: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select
                              value={newStudentData.language}
                              onValueChange={(value) => setNewStudentData(prev => ({ ...prev, language: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Arabic">Arabic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="grade_level">Grade Level</Label>
                            <Select
                              value={newStudentData.grade_level}
                              onValueChange={(value) => setNewStudentData(prev => ({ ...prev, grade_level: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Grade 1</SelectItem>
                                <SelectItem value="2">Grade 2</SelectItem>
                                <SelectItem value="3">Grade 3</SelectItem>
                                <SelectItem value="4">Grade 4</SelectItem>
                                <SelectItem value="5">Grade 5</SelectItem>
                                <SelectItem value="6">Grade 6</SelectItem>
                                <SelectItem value="7">Grade 7</SelectItem>
                                <SelectItem value="8">Grade 8</SelectItem>
                                <SelectItem value="9">Grade 9</SelectItem>
                                <SelectItem value="10">Grade 10</SelectItem>
                                <SelectItem value="11">Grade 11</SelectItem>
                                <SelectItem value="12">Grade 12</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Select
                            value={newStudentData.country}
                            onValueChange={(value) => setNewStudentData(prev => ({ ...prev, country: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] overflow-y-auto">
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddStudentForm(false)
                              setNewStudentData({
                                first_name: "",
                                last_name: "",
                                gender: "",
                                country: "",
                                language: "",
                                birth_date: "",
                                grade_level: ""
                              })
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleAddDependentStudent}
                            disabled={isAddingStudent}
                            className="gap-2"
                            style={{ backgroundColor: "#3d8f5b", color: "white" }}
                          >
                            {isAddingStudent ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Add Student
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Display Associated Students */}
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
                    {pendingStudents.length > 0 ? `Save Changes & Create ${pendingStudents.length} Student${pendingStudents.length > 1 ? 's' : ''}` : 'Save Changes'}
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