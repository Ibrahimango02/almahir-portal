"use client"

import { useRouter } from "next/navigation"
import { Users, UserPen, Calendar, BookOpen, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ClassType } from "@/types"
import { formatDateTime } from "@/lib/utils/timezone"
import { useTimezone } from "@/contexts/TimezoneContext"

interface ClassesTableProps {
    classes: ClassType[]
    isLoading: boolean
    userType?: 'admin' | 'teacher' | 'student' | 'parent'
    emptyStateMessage?: string
    showExpirationWarning?: boolean
}

export default function ClassesTable({
    classes,
    isLoading,
    userType = 'admin',
    emptyStateMessage = "No classes found",
    showExpirationWarning = false
}: ClassesTableProps) {
    const router = useRouter()
    const { timezone } = useTimezone()

    // Function to check if a class is expiring within a week
    const isClassExpiringSoon = (classItem: ClassType): boolean => {
        if (classItem.status.toLowerCase() !== 'active') return false

        const endDate = new Date(classItem.end_date)
        const currentDate = new Date()
        const oneWeekFromNow = new Date()
        oneWeekFromNow.setDate(currentDate.getDate() + 7)

        return endDate <= oneWeekFromNow && endDate > currentDate
    }

    const getNavigationPath = (classId: string) => {
        switch (userType) {
            case 'admin':
                return `/admin/classes/${classId}`
            case 'teacher':
                return `/teacher/classes/${classId}`
            case 'student':
                return `/student/classes/${classId}`
            case 'parent':
                return `/parent/classes/${classId}`
            default:
                return `/admin/classes/${classId}`
        }
    }

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-muted-foreground">Loading classes...</p>
                </div>
            </div>
        )
    }

    if (classes.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                    No classes found
                </h3>
                <p className="text-muted-foreground mb-4">
                    {emptyStateMessage}
                </p>
            </div>
        )
    }

    return (
        <div className="max-h-[600px] overflow-y-auto pr-2">
            <div className="grid gap-4">
                {classes.map((classItem) => (
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
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getStatusColor(classItem.status)}>
                                                        {classItem.status}
                                                    </Badge>
                                                    {showExpirationWarning && isClassExpiringSoon(classItem) && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
                                                        >
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Expires Soon
                                                        </Badge>
                                                    )}
                                                </div>
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
                                            <span>{classItem.students.length} Students</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <UserPen className="h-4 w-4" />
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
                                    <button
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                        onClick={() => router.push(getNavigationPath(classItem.class_id))}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
} 