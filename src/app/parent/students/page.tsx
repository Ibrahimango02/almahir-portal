"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { StudentsTable } from "@/components/students-table"
import { useState, useEffect } from "react"
import { StudentType } from "@/types"
import { getParentStudents } from "@/lib/get/get-parents"
import { createClient } from "@/utils/supabase/client"

export default function StudentsPage() {
    const [students, setStudents] = useState<StudentType[]>([])
    const [filteredStudents, setFilteredStudents] = useState<StudentType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const getCurrentUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
            }
        }

        getCurrentUser()
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUserId) return

            try {
                setLoading(true)
                setError(null)

                const data = await getParentStudents(currentUserId)
                setStudents(data)
                setFilteredStudents(data)
            } catch (err) {
                console.error('Error fetching students:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch students')
                setStudents([])
                setFilteredStudents([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [currentUserId])

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
                (student.country?.toLowerCase().includes(searchLower) ?? false) ||
                (student.language?.toLowerCase().includes(searchLower) ?? false) ||
                student.status.toLowerCase().includes(searchLower) ||
                student.age === parseInt(searchLower) ||
                (student.gender?.toLowerCase().includes(searchLower) ?? false)
            )
        })
        setFilteredStudents(filtered)
    }, [searchQuery, students])

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                </div>
                <div className="p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading students...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                </div>
                <div className="p-6 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-destructive mb-2">Error loading students</p>
                        <p className="text-muted-foreground text-sm">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

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
                <StudentsTable students={filteredStudents} userRole="parent" />
            </div>
        </div>
    )
}
