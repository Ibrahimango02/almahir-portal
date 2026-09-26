"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Plus, BookOpen, Clock, Search, Archive, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getActiveClasses, getArchivedClasses } from "@/lib/get/get-classes"
import { ClassType } from "@/types"
import ClassesTable from "@/components/classes-table"
import { parseISO, isValid } from "date-fns"

export default function ClassesPage() {
    const [activeClasses, setActiveClasses] = useState<ClassType[]>([])
    const [archivedClasses, setArchivedClasses] = useState<ClassType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived" | "expires-soon">("all")

    // Memoized function to check if a class is expiring within a week
    // Using parseISO for better Safari compatibility
    const isClassExpiringSoon = useCallback((classItem: ClassType): boolean => {
        if (classItem.status.toLowerCase() !== 'active') return false

        // Use parseISO instead of new Date() for better Safari compatibility
        const endDateParsed = parseISO(classItem.end_date)
        if (!isValid(endDateParsed)) return false

        const currentDate = new Date()
        const oneWeekFromNow = new Date()
        oneWeekFromNow.setDate(currentDate.getDate() + 7)

        return endDateParsed <= oneWeekFromNow && endDateParsed > currentDate
    }, [])

    // Memoize expiring classes to avoid recalculating
    const expiringClasses = useMemo(() => {
        return activeClasses.filter(isClassExpiringSoon)
    }, [activeClasses, isClassExpiringSoon])

    // Get count of expiring classes
    const expiringClassesCount = useMemo(() => {
        return expiringClasses.length
    }, [expiringClasses])

    // Get filtered classes based on status filter - memoized for performance
    const filteredClasses = useMemo((): ClassType[] => {
        let filtered: ClassType[] = []

        // Apply status filter
        switch (statusFilter) {
            case "active":
                filtered = activeClasses
                break
            case "archived":
                filtered = archivedClasses
                break
            case "expires-soon":
                filtered = expiringClasses
                break
            case "all":
            default:
                filtered = [...activeClasses, ...archivedClasses]
                break
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const searchLower = searchQuery.toLowerCase()
            filtered = filtered.filter((classItem) => {
                return (
                    classItem.title.toLowerCase().includes(searchLower) ||
                    classItem.subject.toLowerCase().includes(searchLower) ||
                    classItem.teachers.some(
                        (teacher) =>
                            teacher.first_name.toLowerCase().includes(searchLower) ||
                            teacher.last_name.toLowerCase().includes(searchLower)
                    )
                )
            })
        }

        // Sort filtered results
        return filtered.sort((a, b) => {
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
    }, [activeClasses, archivedClasses, statusFilter, searchQuery, expiringClasses])

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const [activeData, archivedData] = await Promise.all([
                    getActiveClasses(),
                    getArchivedClasses()
                ])
                setActiveClasses(activeData)
                setArchivedClasses(archivedData)
            } catch (error) {
                console.error("Error fetching classes:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchClasses()
    }, [])

    const totalClasses = activeClasses.length + archivedClasses.length

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search classes..."
                            className="w-full pl-8 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                        <Link href="/admin/classes/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Class
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                                <p className="text-3xl font-bold">{totalClasses}</p>
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
                                <p className="text-3xl font-bold">{activeClasses.length}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Archived Classes</p>
                                <p className="text-3xl font-bold">{archivedClasses.length}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <Archive className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                                <p className="text-3xl font-bold">{expiringClassesCount}</p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div>
                {/* Filter Options */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
                    <Button
                        variant={statusFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("all")}
                        className="h-8"
                        style={statusFilter === "all" ? { backgroundColor: "#3d8f5b", color: "white" } : {}}
                    >
                        All
                    </Button>
                    <Button
                        variant={statusFilter === "active" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("active")}
                        className="h-8"
                        style={statusFilter === "active" ? { backgroundColor: "#3d8f5b", color: "white" } : {}}
                    >
                        Active
                    </Button>
                    <Button
                        variant={statusFilter === "archived" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("archived")}
                        className="h-8"
                        style={statusFilter === "archived" ? { backgroundColor: "#3d8f5b", color: "white" } : {}}
                    >
                        Archived
                    </Button>
                    <Button
                        variant={statusFilter === "expires-soon" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter("expires-soon")}
                        className="h-8"
                        style={statusFilter === "expires-soon" ? { backgroundColor: "#3d8f5b", color: "white" } : {}}
                    >
                        Expires Soon
                    </Button>
                </div>

                <ClassesTable
                    classes={filteredClasses}
                    isLoading={isLoading}
                    userType="admin"
                    emptyStateMessage={searchQuery ? "Try adjusting your search terms" : "Get started by creating your first class"}
                    showExpirationWarning={true}
                />
            </div>
        </div>
    )
}
