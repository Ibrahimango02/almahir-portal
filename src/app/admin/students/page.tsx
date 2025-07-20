"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { StudentsTable } from "@/components/students-table"
import { useState, useEffect } from "react"
import { StudentType } from "@/types"
import { getStudents } from "@/lib/get/get-students"

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<StudentType[]>([])

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await getStudents()
      setStudents(data)
      setFilteredStudents(data)
    }
    fetchStudents()
  }, [])

  useEffect(() => {
    const filtered = students.filter(student => {
      const searchLower = searchQuery.toLowerCase()
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        student.first_name.toLowerCase().includes(searchLower) ||
        student.last_name.toLowerCase().includes(searchLower) ||
        (student.email?.toLowerCase().includes(searchLower) ?? false) ||
        (student.phone?.toLowerCase().includes(searchLower) ?? false) ||
        student.country.toLowerCase().includes(searchLower) ||
        student.language.toLowerCase().includes(searchLower) ||
        student.status.toLowerCase().includes(searchLower) ||
        student.age === parseInt(searchLower) ||
        student.gender.toLowerCase().includes(searchLower)
      )
    })
    setFilteredStudents(filtered)
  }, [searchQuery, students])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <StudentsTable students={filteredStudents} />
      </div>
    </div>
  )
}
