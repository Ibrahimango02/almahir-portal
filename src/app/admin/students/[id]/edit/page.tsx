"use client"

import type React from "react"

import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { BackButton } from "@/components/back-button"

// Mock data based on the database schema
const students = [
  {
    id: "S001",
    first_name: "Emma",
    last_name: "Smith",
    grade_level: "10th",
    age: 16,
    parent: "John Smith",
    email: "emma.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Physics", "English"],
    birth_date: "2007-05-15T00:00:00",
    notes: "Excellent student with a keen interest in mathematics and science.",
    created_at: "2021-09-01T00:00:00",
    updated_at: "2023-01-15T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S002",
    first_name: "Noah",
    last_name: "Smith",
    grade_level: "8th",
    age: 14,
    parent: "John Smith",
    email: "noah.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Biology", "History"],
    birth_date: "2009-08-22T00:00:00",
    notes: "Shows great potential in history and social studies.",
    created_at: "2021-09-01T00:00:00",
    updated_at: "2023-01-15T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S003",
    first_name: "Sophia",
    last_name: "Garcia",
    grade_level: "11th",
    age: 17,
    parent: "Maria Garcia",
    email: "sophia.garcia@student.almahir.edu",
    enrolledClasses: ["Chemistry", "Spanish", "Art"],
    birth_date: "2006-03-10T00:00:00",
    notes: "Bilingual student with exceptional artistic abilities.",
    created_at: "2022-01-15T00:00:00",
    updated_at: "2023-02-20T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S004",
    first_name: "William",
    last_name: "Johnson",
    grade_level: "9th",
    age: 15,
    parent: "James Johnson",
    email: "william.johnson@student.almahir.edu",
    enrolledClasses: ["Physics", "Computer Science", "English"],
    birth_date: "2008-11-05T00:00:00",
    notes: "Shows strong aptitude for computer science and programming.",
    created_at: "2020-09-10T00:00:00",
    updated_at: "2023-01-10T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S005",
    first_name: "Olivia",
    last_name: "Johnson",
    grade_level: "7th",
    age: 13,
    parent: "James Johnson",
    email: "olivia.johnson@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Music", "Art"],
    birth_date: "2010-07-18T00:00:00",
    notes: "Talented musician with a focus on piano and violin.",
    created_at: "2020-09-10T00:00:00",
    updated_at: "2023-01-10T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S006",
    first_name: "Liam",
    last_name: "Johnson",
    grade_level: "12th",
    age: 18,
    parent: "James Johnson",
    email: "liam.johnson@student.almahir.edu",
    enrolledClasses: ["Physics", "Chemistry", "Mathematics"],
    birth_date: "2005-02-28T00:00:00",
    notes: "Preparing for college with a focus on engineering programs.",
    created_at: "2020-09-10T00:00:00",
    updated_at: "2023-01-10T00:00:00",
    status: "active",
    classes_count: 3,
  },
  {
    id: "S007",
    first_name: "Ava",
    last_name: "Brown",
    grade_level: "10th",
    age: 16,
    parent: "Patricia Brown",
    email: "ava.brown@student.almahir.edu",
    enrolledClasses: ["Biology", "English", "History"],
    birth_date: "2007-09-12T00:00:00",
    notes: "Interested in pursuing a career in medicine or healthcare.",
    created_at: "2021-11-25T00:00:00",
    updated_at: "2023-03-05T00:00:00",
    status: "active",
    classes_count: 3,
  },
]

export default function EditStudentPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const student = students.find((s) => s.id === params.id)

  if (!student) {
    notFound()
  }

  const [formData, setFormData] = useState({
    grade_level: student.grade_level,
    parent: student.parent,
    status: student.status,
    notes: student.notes || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Student information updated",
      description: "The student information has been successfully updated.",
    })

    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/students/${student.id}`} label="Back to Student" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Student Information</CardTitle>
          <CardDescription>
            Update {student.first_name} {student.last_name}'s information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="parent">Parent/Guardian</Label>
                <Input id="parent" name="parent" value={formData.parent} onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade_level">Grade Level</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value) => handleSelectChange("grade_level", value)}
                >
                  <SelectTrigger id="grade_level">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6th">6th Grade</SelectItem>
                    <SelectItem value="7th">7th Grade</SelectItem>
                    <SelectItem value="8th">8th Grade</SelectItem>
                    <SelectItem value="9th">9th Grade</SelectItem>
                    <SelectItem value="10th">10th Grade</SelectItem>
                    <SelectItem value="11th">11th Grade</SelectItem>
                    <SelectItem value="12th">12th Grade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
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
                <Link href={`/admin/students/${student.id}`}>Cancel</Link>
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
