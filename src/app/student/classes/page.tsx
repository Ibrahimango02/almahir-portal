"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, Calendar, BookOpen, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getClassesByStudentId } from "@/lib/get/get-classes"
import { ClassType } from "@/types"
import { formatDateTime } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"
import { createClient } from "@/utils/supabase/client"

export default function StudentClassesPage() {
    const router = useRouter()
    const [classes, setClasses] = useState<ClassType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const { timezone } = useTimezone()

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
                const data = await getClassesByStudentId(currentUserId)
                setClasses(data)
            } catch (error) {
                console.error("Error fetching classes:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchClasses()
    }, [currentUserId])

    const filteredClasses = classes.filter((classItem) => {
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

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            case "archived":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
        }
    }

    return (
        <div className="container mx-auto py-6">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
                    <p className="text-muted-foreground">View and manage your assigned classes</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                <CardHeader>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div>
                            <CardTitle>My Classes</CardTitle>
                            <CardDescription>View and manage your assigned classes</CardDescription>
                        </div>
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search classes, subjects, or teachers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                <p className="text-muted-foreground">Loading classes...</p>
                            </div>
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                No classes found
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery ? "Try adjusting your search terms" : "You haven't been assigned to any classes yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto pr-2">
                            <div className="grid gap-4">
                                {filteredClasses.map((classItem) => (
                                    <Card key={classItem.class_id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="font-semibold text-lg">
                                                                    {classItem.title}
                                                                </h3>
                                                                <Badge className={getStatusColor(classItem.status)}>
                                                                    {classItem.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-muted-foreground font-medium">
                                                                {classItem.subject}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>
                                                                {formatDateTime(classItem.start_date, "MMM d", timezone)} -{" "}
                                                                {formatDateTime(classItem.end_date, "MMM d", timezone)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            <span>{classItem.enrolled_students.length} Students</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <BookOpen className="h-4 w-4" />
                                                            <span>{classItem.teachers.length} Teacher{classItem.teachers.length !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex -space-x-2">
                                                        {classItem.teachers.slice(0, 3).map((teacher) => (
                                                            <Avatar
                                                                key={teacher.teacher_id}
                                                                className="border-2 border-background h-8 w-8"
                                                            >
                                                                {teacher.avatar_url ? (
                                                                    <AvatarImage
                                                                        src={teacher.avatar_url}
                                                                        alt={`${teacher.first_name} ${teacher.last_name}`}
                                                                    />
                                                                ) : null}
                                                                <AvatarFallback className="text-xs">
                                                                    {teacher.first_name[0]}
                                                                    {teacher.last_name[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                        {classItem.teachers.length > 3 && (
                                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs text-muted-foreground border-2 border-background">
                                                                +{classItem.teachers.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/student/classes/${classItem.class_id}`)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
