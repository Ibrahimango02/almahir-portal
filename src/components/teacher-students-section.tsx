"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, User } from "lucide-react"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getStudentParents } from "@/lib/get/get-students"
import { StudentType } from "@/types"
import AvatarIcon from "./avatar"

import { convertStatusToPrefixedFormat } from "@/lib/utils"

// Define types for related data
type ParentType = {
    parent_id: string;
    first_name: string;
    last_name: string;
}

interface TeacherStudentsSectionProps {
    students: StudentType[]
    teacherName: string
}

export function TeacherStudentsSection({ students, teacherName }: TeacherStudentsSectionProps) {
    const router = useRouter()
    const [parentData, setParentData] = useState<Record<string, ParentType[]>>({})
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)


    useEffect(() => {
        const fetchRelatedData = async () => {
            const parentResults: Record<string, ParentType[]> = {}

            for (const student of students) {
                try {
                    const parents = await getStudentParents(student.student_id)
                    parentResults[student.student_id] = parents || []
                } catch (error) {
                    console.error(`Failed to fetch related data for student ${student.student_id}:`, error)
                    parentResults[student.student_id] = []
                }
            }

            setParentData(parentResults)
        }

        if (students.length > 0) {
            fetchRelatedData()
        }
    }, [students])

    // Calculate pagination
    const totalItems = students.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const getStudentDetailUrl = (studentId: string) => {
        return `/admin/students/${studentId}`
    }

    if (students.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Students <span className="text-xs bg-muted px-2 py-1 rounded-full">{students.length}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No students are currently enrolled in {teacherName}&apos;s classes.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Students <span className="text-xs bg-muted px-2 py-1 rounded-full">{students.length}</span>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Table Container */}
                    <div className="rounded-lg border bg-card shadow-sm">
                        <div className="overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[250px]">Student</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[250px]">Contact</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[150px]">Location</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[250px]">Parents</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 text-center w-[150px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedStudents.map((student, index) => (
                                        <TableRow
                                            key={student.student_id}
                                            className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                }`}
                                            onClick={(e) => {
                                                // Prevent navigation if clicking on actions, the student ID link, or other interactive elements
                                                if (
                                                    e.target instanceof HTMLElement &&
                                                    (e.target.closest("button") ||
                                                        e.target.closest("a") ||
                                                        e.target.closest("[data-no-navigation]"))
                                                ) {
                                                    return
                                                }
                                                router.push(getStudentDetailUrl(student.student_id))
                                            }}
                                        >
                                            {/* Student Info */}
                                            <TableCell className="py-2 px-3">
                                                <div className="flex items-center gap-3">
                                                    {student.avatar_url ? (
                                                        <AvatarIcon url={student.avatar_url} size="medium" />
                                                    ) : (
                                                        <Avatar className="h-10 w-10 border border-primary/10">
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                                                                {student.first_name[0]}
                                                                {student.last_name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className="space-y-0.5">
                                                        <p className="font-medium text-sm">
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Age {student.age || ''} • {student.gender}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Contact Info */}
                                            <TableCell className="py-2 px-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span>{student.email || 'None'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span>{student.phone || 'None'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Location */}
                                            <TableCell className="py-2 px-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs">{student.country || 'None'}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{student.language}</p>
                                                </div>
                                            </TableCell>

                                            {/* Parents */}
                                            <TableCell className="py-2 px-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs">
                                                            {parentData[student.student_id]?.length > 0
                                                                ? parentData[student.student_id].map((parent, index) => (
                                                                    <span key={`${student.student_id}-parent-${parent.parent_id}-${index}`}>
                                                                        {parent.first_name} {parent.last_name}
                                                                        {index < parentData[student.student_id].length - 1 ? ', ' : ''}
                                                                    </span>
                                                                ))
                                                                : 'None'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="py-2 px-3 text-center">
                                                <div className="max-w-[100px] mx-auto">
                                                    <StatusBadge status={convertStatusToPrefixedFormat(student.status, 'user')} />
                                                </div>
                                            </TableCell>

                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>
            </CardContent>
        </Card>
    )
} 