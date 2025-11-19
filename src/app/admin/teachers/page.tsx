"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { TeachersTable } from "@/components/teachers-table"
import { useState, useEffect, useMemo } from "react"
import { TeacherType } from "@/types"
import { getTeachers } from "@/lib/get/get-teachers"

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        const data = await getTeachers()
        setTeachers(data)
      } catch (error) {
        console.error('Error fetching teachers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTeachers()
  }, [])

  // Debounce search query to avoid filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Memoize filtered teachers to avoid recalculating on every render
  const filteredTeachers = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return teachers

    const searchLower = debouncedSearchQuery.toLowerCase()
    return teachers.filter(teacher => {
      const fullName = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        (teacher.first_name?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.last_name?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.email?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.phone?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.gender?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.country?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.language?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.status?.toLowerCase() ?? '').includes(searchLower) ||
        (teacher.specialization?.toLowerCase() ?? '').includes(searchLower)
      )
    })
  }, [debouncedSearchQuery, teachers])

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
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading teachers...</p>
            </div>
          </div>
        ) : (
          <TeachersTable teachers={filteredTeachers} />
        )}
      </div>
    </div>
  )
}
