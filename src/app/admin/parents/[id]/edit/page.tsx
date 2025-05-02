"use client"

import type React from "react"

import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, X, Plus } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"
import { cn } from "@/lib/utils"

// Mock data based on the database schema
const parents = [
  {
    id: "P001",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Anytown, CA 12345",
    students: [
      { id: "S001", name: "Emma Smith" },
      { id: "S002", name: "Noah Smith" },
    ],
    joinDate: "2021-08-15",
    notes: "Prefers to be contacted via email. Very responsive and engaged in children's education.",
    status: "active",
  },
  {
    id: "P002",
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    phone: "+1 (555) 234-5678",
    address: "456 Oak Ave, Somewhere, CA 12345",
    students: [{ id: "S003", name: "Sophia Garcia" }],
    joinDate: "2022-01-10",
    notes: "Prefers phone calls over emails. Works evening shifts, best to contact in the morning.",
    status: "active",
  },
]

// Mock list of all students
const allStudents = [
  { id: "S001", name: "Emma Smith" },
  { id: "S002", name: "Noah Smith" },
  { id: "S003", name: "Sophia Garcia" },
  { id: "S004", name: "William Johnson" },
  { id: "S005", name: "Olivia Brown" },
  { id: "S006", name: "James Davis" },
  { id: "S007", name: "Isabella Miller" },
  { id: "S008", name: "Benjamin Wilson" },
  { id: "S009", name: "Mia Moore" },
  { id: "S010", name: "Charlotte Taylor" },
]

export default function EditParentPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const parent = parents.find((p) => p.id === params.id)

  if (!parent) {
    notFound()
  }

  const [formData, setFormData] = useState({
    status: parent.status,
    notes: parent.notes || "",
  })

  const [associatedStudents, setAssociatedStudents] = useState<Array<{ id: string; name: string }>>(parent.students)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddStudent = () => {
    if (!selectedStudentId) return

    const studentToAdd = allStudents.find((student) => student.id === selectedStudentId)
    if (!studentToAdd) return

    // Check if student is already associated
    if (associatedStudents.some((student) => student.id === selectedStudentId)) {
      toast({
        title: "Student already associated",
        description: `${studentToAdd.name} is already associated with this parent.`,
        variant: "destructive",
      })
      return
    }

    setAssociatedStudents((prev) => [...prev, studentToAdd])
    setSelectedStudentId("")
  }

  const handleRemoveStudent = (studentId: string) => {
    setAssociatedStudents((prev) => prev.filter((student) => student.id !== studentId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Parent information updated",
      description: "The parent information has been successfully updated.",
    })

    setIsSubmitting(false)
  }

  // Filter out already associated students from the dropdown
  const availableStudents = allStudents.filter((student) => !associatedStudents.some((s) => s.id === student.id))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/parents/${parent.id}`} label="Back to Parent" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Parent Information</CardTitle>
          <CardDescription>Update {parent.name}'s information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
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
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 p-3 border rounded-md min-h-[100px]">
                  {associatedStudents.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {associatedStudents.map((student) => (
                        <Badge key={student.id} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                          {student.name}
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.id)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            aria-label={`Remove ${student.name}`}
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/parents/${parent.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
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
