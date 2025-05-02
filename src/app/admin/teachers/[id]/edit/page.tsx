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

// Mock data for teacher details
const getTeacherById = (id: string) => {
  const teachers = [
    {
      id: "T001",
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarah.johnson@almahir.edu",
      phone: "+1 (555) 123-4567",
      subjects: ["Mathematics"],
      hourly_rate: 45,
      bio: "Experienced mathematics teacher with a passion for making complex concepts accessible to all students.",
      status: "active",
      created_at: "2020-05-12T00:00:00",
    },
    {
      id: "T002",
      first_name: "Michael",
      last_name: "Chen",
      email: "michael.chen@almahir.edu",
      phone: "+1 (555) 234-5678",
      subjects: ["Physics", "Computer Science"],
      hourly_rate: 50,
      bio: "Dual-specialized in Physics and Computer Science with 10+ years of teaching experience.",
      status: "active",
      created_at: "2019-09-03T00:00:00",
    },
    {
      id: "T003",
      first_name: "Emily",
      last_name: "Davis",
      email: "emily.davis@almahir.edu",
      phone: "+1 (555) 345-6789",
      subjects: ["English", "Art"],
      hourly_rate: 40,
      bio: "Creative educator specializing in English literature and visual arts.",
      status: "active",
      created_at: "2021-01-15T00:00:00",
    },
    {
      id: "T004",
      first_name: "Robert",
      last_name: "Wilson",
      email: "robert.wilson@almahir.edu",
      phone: "+1 (555) 456-7890",
      subjects: ["Chemistry"],
      hourly_rate: 45,
      bio: "Chemistry specialist with a background in pharmaceutical research.",
      status: "on leave",
      created_at: "2018-08-22T00:00:00",
    },
    {
      id: "T005",
      first_name: "Jennifer",
      last_name: "Lee",
      email: "jennifer.lee@almahir.edu",
      phone: "+1 (555) 567-8901",
      subjects: ["Biology", "Music"],
      hourly_rate: 42,
      bio: "Unique combination of expertise in biological sciences and music education.",
      status: "active",
      created_at: "2020-11-07T00:00:00",
    },
    {
      id: "T006",
      first_name: "David",
      last_name: "Brown",
      email: "david.brown@almahir.edu",
      phone: "+1 (555) 678-9012",
      subjects: ["History", "Physical Education"],
      hourly_rate: 38,
      bio: "History teacher and certified physical education instructor.",
      status: "active",
      created_at: "2019-03-18T00:00:00",
    },
    {
      id: "T007",
      first_name: "Maria",
      last_name: "Rodriguez",
      email: "maria.rodriguez@almahir.edu",
      phone: "+1 (555) 789-0123",
      subjects: ["Spanish"],
      hourly_rate: 40,
      bio: "Native Spanish speaker with a focus on conversational language learning.",
      status: "inactive",
      created_at: "2022-02-01T00:00:00",
    },
  ]

  return teachers.find((teacher) => teacher.id === id)
}

export default function EditTeacherPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const teacherId = params.id
  const teacher = getTeacherById(teacherId)

  if (!teacher) {
    notFound()
  }

  const [formData, setFormData] = useState({
    specialization: teacher.subjects.join(", "),
    hourly_rate: teacher.hourly_rate.toString(),
    status: teacher.status,
    bio: teacher.bio || "",
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
      title: "Teacher information updated",
      description: "The teacher information has been successfully updated.",
    })

    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton href={`/admin/teachers/${teacher.id}`} label="Back to Teacher" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Teacher Information</CardTitle>
          <CardDescription>
            Update {teacher.first_name} {teacher.last_name}'s information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization (Subjects)</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  placeholder="e.g. Mathematics, Physics"
                  value={formData.specialization}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  placeholder="e.g. 45"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href={`/admin/teachers/${teacher.id}`}>Cancel</Link>
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
