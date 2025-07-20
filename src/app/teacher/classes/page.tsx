"use client"

import { useEffect, useState } from "react"
import { Users, BookOpen, Clock, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getClassesByTeacherId } from "@/lib/get/get-classes"
import { ClassType } from "@/types"
import { createClient } from "@/utils/supabase/client"
import ClassesTable from "@/components/classes-table"

export default function TeacherClassesPage() {
    const [classes, setClasses] = useState<ClassType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [filteredClasses, setFilteredClasses] = useState<ClassType[]>([])

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
        const fetchClasses = async () => {
            if (!currentUserId) return

            try {
                const data = await getClassesByTeacherId(currentUserId)
                setClasses(data)
                setFilteredClasses(data)
            } catch (error) {
                console.error("Error fetching classes:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchClasses()
    }, [currentUserId])

    useEffect(() => {
        const filtered = classes.filter((classItem) => {
            const searchLower = searchQuery.toLowerCase()
            return (
                classItem.title.toLowerCase().includes(searchLower) ||
                classItem.subject.toLowerCase().includes(searchLower) ||
                classItem.teachers.some(
                    (teacher) =>
                        teacher.first_name.toLowerCase().includes(searchLower) ||
                        teacher.last_name.toLowerCase().includes(searchLower)
                )
            )
        }).sort((a, b) => {
            // First sort by status: active classes first, then archived
            const statusOrder = { active: 0, archived: 1 }
            const statusA = statusOrder[a.status.toLowerCase() as keyof typeof statusOrder] ?? 4
            const statusB = statusOrder[b.status.toLowerCase() as keyof typeof statusOrder] ?? 4

            if (statusA !== statusB) {
                return statusA - statusB
            }

            // Then sort alphabetically by title within each status group
            return a.title.localeCompare(b.title)
        })
        setFilteredClasses(filtered)
    }, [searchQuery, classes])

    return (
        <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
                    <p className="text-muted-foreground">View and manage your assigned classes</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search classes..."
                            className="w-full pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>My Classes</CardTitle>
                    <CardDescription>View and manage your assigned classes</CardDescription>
                </CardHeader>
                <CardContent>
                    <ClassesTable
                        classes={filteredClasses}
                        isLoading={isLoading}
                        userType="teacher"
                        emptyStateMessage={searchQuery ? "Try adjusting your search terms" : "You haven't been assigned to any classes yet"}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
