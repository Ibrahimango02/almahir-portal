"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { TeachersTable } from "@/components/teachers-table"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TeacherType } from "@/types"
import { getTeachers } from "@/lib/get/get-teachers"

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherType[]>([])

  useEffect(() => {
    const fetchTeachers = async () => {
      const data = await getTeachers()
      setTeachers(data)
      setFilteredTeachers(data)
    }
    fetchTeachers()
  }, [])

  useEffect(() => {
    const filtered = teachers.filter(teacher => {
      const searchLower = searchQuery.toLowerCase()
      const fullName = `${teacher.first_name} ${teacher.last_name}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        teacher.first_name.toLowerCase().includes(searchLower) ||
        teacher.last_name.toLowerCase().includes(searchLower) ||
        teacher.email.toLowerCase().includes(searchLower) ||
        (teacher.phone?.toLowerCase().includes(searchLower) ?? false) ||
        teacher.gender.toLowerCase().includes(searchLower) ||
        teacher.country.toLowerCase().includes(searchLower) ||
        teacher.language.toLowerCase().includes(searchLower) ||
        teacher.status.toLowerCase().includes(searchLower) ||
        (teacher.specialization?.toLowerCase().includes(searchLower) ?? false)
      )
    })
    setFilteredTeachers(filtered)
  }, [searchQuery, teachers])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search teachers..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
            <Link href="/admin/teachers/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Teachers</CardTitle>
          <CardDescription>Manage your teaching staff and their information</CardDescription>
        </CardHeader>
        <CardContent>
          <TeachersTable teachers={filteredTeachers} />
        </CardContent>
      </Card>
    </div>
  )
}
