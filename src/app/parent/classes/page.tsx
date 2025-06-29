"use client"

import { useEffect, useState } from "react"
import { BookOpen, Clock, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getClassesByParentId } from "@/lib/get/get-classes"
import { ClassType } from "@/types"
import { createClient } from "@/utils/supabase/client"
import ClassesTable from "@/components/classes-table"

export default function ParentClassesPage() {
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
                const data = await getClassesByParentId(currentUserId)
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
        <div className="container mx-auto py-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                                <p className="text-3xl font-bold">{classes.length}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Active Classes</p>
                                <p className="text-3xl font-bold">
                                    {classes.filter(c => c.status === 'active').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
                        userType="parent"
                        emptyStateMessage={searchQuery ? "Try adjusting your search terms" : "You haven't been assigned to any classes yet"}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
