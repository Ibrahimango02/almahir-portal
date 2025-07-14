"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, GraduationCap, MoreHorizontal, Mail, Phone, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { TeacherType } from "@/types"
import AvatarIcon from "./avatar"
import { format, parseISO } from "date-fns"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { getProfile } from "@/lib/get/get-profiles"

interface StudentTeachersSectionProps {
    teachers: TeacherType[]
    studentName: string
}

export function StudentTeachersSection({ teachers, studentName }: StudentTeachersSectionProps) {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const profile = await getProfile()
                setCurrentUserRole(profile.role)
            } catch (error) {
                console.error("Error fetching user role:", error)
                // Don't default to admin - let it be null so actions are hidden
                setCurrentUserRole(null)
            }
        }

        fetchUserRole()
    }, [])

    // Calculate pagination
    const totalItems = teachers.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedTeachers = teachers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const getTeacherDetailUrl = (teacherId: string, teacherRole: string) => {
        if (!currentUserRole) return '/'
        if (teacherRole === 'admin') {
            return `/admin/admins/${teacherId}`
        }
        return `/admin/teachers/${teacherId}`
    }

    const getActionUrl = (action: 'assign-class' | 'edit', teacherId: string, teacherRole: string) => {
        if (!currentUserRole) return '/'
        if (teacherRole === 'admin') {
            return `/admin/admins/${action}/${teacherId}`
        }
        return `/admin/teachers/${action}/${teacherId}`
    }

    if (teachers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {studentName}&apos;s Teachers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No teachers are currently assigned to {studentName}&apos;s classes.</p>
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
                        <Users className="h-5 w-5" />
                        Teachers <span className="text-xs bg-muted px-2 py-1 rounded-full">{teachers.length}</span>
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
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[250px]">Teacher</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[250px]">Contact</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[150px]">Location</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[200px]">Specialization</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 text-center w-[150px]">Status</TableHead>
                                        <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[150px]">Joined</TableHead>
                                        <TableHead className="w-[50px] px-4"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedTeachers.map((teacher, index) => (
                                        <TableRow
                                            key={teacher.teacher_id}
                                            className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                                }`}
                                            onClick={(e) => {
                                                // Prevent navigation if clicking on actions, the teacher ID link, or other interactive elements
                                                if (
                                                    e.target instanceof HTMLElement &&
                                                    (e.target.closest("button") ||
                                                        e.target.closest("a") ||
                                                        e.target.closest("[data-no-navigation]"))
                                                ) {
                                                    return
                                                }
                                                router.push(getTeacherDetailUrl(teacher.teacher_id, teacher.role))
                                            }}
                                        >
                                            {/* Teacher Info */}
                                            <TableCell className="py-2 px-3">
                                                <div className="flex items-center gap-3">
                                                    {teacher.avatar_url ? (
                                                        <AvatarIcon url={teacher.avatar_url} size="medium" />
                                                    ) : (
                                                        <Avatar className="h-10 w-10 border border-primary/10">
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                                                                {teacher.first_name[0]}
                                                                {teacher.last_name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <div className="space-y-0.5">
                                                        <p className="font-medium text-sm">
                                                            {teacher.first_name} {teacher.last_name}
                                                            {teacher.role === 'admin' && (
                                                                <span className="text-xs text-muted-foreground"> (Admin)</span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {teacher.gender}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Contact Info */}
                                            <TableCell className="py-2 px-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span>{teacher.email || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                        <span>{teacher.phone || 'None'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Location */}
                                            <TableCell className="py-2 px-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-xs">{teacher.country || 'None'}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{teacher.language}</p>
                                                </div>
                                            </TableCell>

                                            {/* Specialization */}
                                            <TableCell className="py-2 px-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs">
                                                            {teacher.specialization || 'None'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="py-2 px-3 text-center">
                                                <div className="max-w-[100px] mx-auto">
                                                    <StatusBadge status={convertStatusToPrefixedFormat(teacher.status, 'user')} />
                                                </div>
                                            </TableCell>

                                            {/* Join Date */}
                                            <TableCell className="py-2 px-3">
                                                <div className="text-xs">
                                                    <p className="font-medium">
                                                        {format(parseISO(teacher.created_at), "MMM dd, yyyy")}
                                                    </p>
                                                </div>
                                            </TableCell>

                                            {/* Actions - Only show for admin */}

                                            <TableCell data-no-navigation className="py-2 px-3">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                            <span className="sr-only">Open menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuLabel className="font-semibold text-xs">Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild className="cursor-pointer text-xs">
                                                            <Link href={getActionUrl('assign-class', teacher.teacher_id, teacher.role)} className="flex items-center">
                                                                <GraduationCap className="mr-2 h-3.5 w-3.5" />
                                                                Assign to Class
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild className="cursor-pointer text-xs">
                                                            <Link href={getActionUrl('edit', teacher.teacher_id, teacher.role)} className="flex items-center">
                                                                <Edit className="mr-2 h-3.5 w-3.5" />
                                                                Edit {teacher.role === 'admin' ? 'Admin' : 'Teacher'}
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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