"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getClassesByParentId, getClassesByStudentId } from "@/lib/get/get-classes"
import { ClassType } from "@/types"
import ClassesTable from "@/components/classes-table"
import { useStudentSwitcher } from "@/contexts/StudentSwitcherContext"

interface ClassesContentProps {
    currentUserId: string;
}

export function ClassesContent({ currentUserId }: ClassesContentProps) {
    const { selectedStudent, isParentView } = useStudentSwitcher();
    const [classes, setClasses] = useState<ClassType[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [filteredClasses, setFilteredClasses] = useState<ClassType[]>([])

    useEffect(() => {
        const fetchClasses = async () => {
            if (!currentUserId) return

            try {
                setIsLoading(true);
                let data: ClassType[];

                if (isParentView) {
                    data = await getClassesByParentId(currentUserId);
                } else if (selectedStudent) {
                    data = await getClassesByStudentId(selectedStudent.student_id);
                } else {
                    data = [];
                }

                setClasses(data)
                setFilteredClasses(data)
            } catch (error) {
                console.error("Error fetching classes:", error)
                setClasses([])
                setFilteredClasses([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchClasses()
    }, [currentUserId, selectedStudent, isParentView])

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
                    {!isParentView && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Switch to Parent View to see all classes
                        </p>
                    )}
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
            {/* Main Content */}
            <div>
                <ClassesTable
                    classes={filteredClasses}
                    isLoading={isLoading}
                    userType={isParentView ? "parent" : "student"}
                    emptyStateMessage={
                        searchQuery
                            ? "Try adjusting your search terms"
                            : isParentView
                                ? "You haven't been assigned to any classes yet"
                                : `${selectedStudent?.first_name} isn't enrolled in any classes yet`
                    }
                />
            </div>
        </div>
    )
} 