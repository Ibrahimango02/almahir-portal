"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getClasses } from "@/lib/get/get-classes"
import { ClassType } from "@/types"

export default function ClassesPage() {
    const router = useRouter()
    const [classes, setClasses] = useState<ClassType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await getClasses()
                setClasses(data)
            } catch (error) {
                console.error("Error fetching classes:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchClasses()
    }, [])

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
    })

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
        }
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                    <p className="text-muted-foreground">Manage and view all classes</p>
                </div>
                <Button onClick={() => router.push("/admin/classes/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Class
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Classes</CardTitle>
                            <CardDescription>View and manage all classes in the system</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search classes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No classes found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredClasses.map((classItem) => (
                                <Card key={classItem.class_id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-lg">{classItem.title}</h3>
                                                    <Badge
                                                        className={`${classItem.status === "active" ? "bg-green-600" : "bg-gray-500"}`}
                                                    >
                                                        {classItem.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{classItem.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span>Subject: {classItem.subject}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {format(new Date(classItem.start_date), "MMM d, yyyy")} -{" "}
                                                        {format(new Date(classItem.end_date), "MMM d, yyyy")}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{classItem.enrolled_students.length} Students</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-2">
                                                    {classItem.teachers.map((teacher) => (
                                                        <Avatar key={teacher.teacher_id} className="border-2 border-background">
                                                            {teacher.avatar_url ? (
                                                                <AvatarImage
                                                                    src={teacher.avatar_url}
                                                                    alt={`${teacher.first_name} ${teacher.last_name}`}
                                                                />
                                                            ) : null}
                                                            <AvatarFallback>
                                                                {teacher.first_name[0]}
                                                                {teacher.last_name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    ))}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => router.push(`/admin/classes/${classItem.class_id}`)}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
