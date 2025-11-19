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
import { Edit, GraduationCap, MoreHorizontal, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getAllStudentParents } from "@/lib/get/get-students"
import { StudentType } from "@/types"
import AvatarIcon from "./avatar"

import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { getProfile } from "@/lib/get/get-profiles"
import { EmptyTableState } from "./empty-table-state"
import { Users } from "lucide-react"

// Define types for related data
type ParentType = {
  parent_id: string;
  first_name: string;
  last_name: string;
}

interface StudentsTableProps {
  students: StudentType[]
  userRole?: 'admin' | 'teacher' | 'parent'
}

export function StudentsTable({ students, userRole }: StudentsTableProps) {
  const router = useRouter()
  const [parentData, setParentData] = useState<Record<string, ParentType[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const profile = await getProfile()
        setCurrentUserRole(profile.role)
      } catch (error) {
        console.error("Error fetching user role:", error)
        // Fallback to the passed userRole prop if available
        if (userRole) {
          setCurrentUserRole(userRole)
        }
      }
    }

    fetchUserRole()
  }, [userRole])

  // Sort students alphabetically by name
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [students])

  // Calculate pagination
  const totalItems = sortedStudents.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedStudents = useMemo(() => {
    return sortedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [sortedStudents, currentPage, pageSize])

  useEffect(() => {
    const fetchRelatedData = async () => {
      if (paginatedStudents.length === 0) return

      try {
        // Only fetch parent data for the current page of students
        const studentIds = paginatedStudents.map(s => s.student_id)
        const parentResults = await getAllStudentParents(studentIds)
        setParentData(parentResults)
      } catch (error) {
        console.error('Failed to fetch parent data:', error)
        // Initialize with empty arrays for current page students
        const emptyParentData = paginatedStudents.reduce((acc, student) => {
          acc[student.student_id] = []
          return acc
        }, {} as Record<string, ParentType[]>)
        setParentData(emptyParentData)
      }
    }

    fetchRelatedData()
  }, [paginatedStudents])

  const isAdmin = currentUserRole === 'admin'
  const isModerator = currentUserRole === 'moderator'
  const isTeacher = currentUserRole === 'teacher'
  const isParent = currentUserRole === 'parent'

  const getStudentDetailUrl = (studentId: string) => {
    if (!currentUserRole) return '/'
    if (currentUserRole === 'moderator') return `/admin/students/${studentId}`
    return `/${currentUserRole}/students/${studentId}`
  }

  const getActionUrl = (action: 'assign-class' | 'edit', studentId: string) => {
    if (!currentUserRole) return '/'
    return `/${currentUserRole}/students/${action}/${studentId}`
  }



  return (
    <div className="space-y-6">
      {/* Table Container */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">ID</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Student</TableHead>
              {!isTeacher && !isParent && <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Contact</TableHead>}
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Location</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Parents</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide text-center">Status</TableHead>
              {(isAdmin || isModerator) && <TableHead className="w-[50px] px-4"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isTeacher || isParent ? 6 : (isAdmin || isModerator ? 7 : 6)} className="h-24">
                  <EmptyTableState
                    icon={Users}
                    title="No students found"
                    description="There are no students to display. Students will appear here once they are added to the system."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedStudents.map((student, index) => (
                <TableRow
                  key={student.student_id}
                  className="hover:bg-muted/100 transition-all duration-200 cursor-pointer border-b border-border/30"
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
                  {/* ID */}
                  <TableCell className="py-3 px-4">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </span>
                  </TableCell>
                  {/* Student Info */}
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {student.avatar_url ? (
                        <AvatarIcon url={student.avatar_url} size="medium" />
                      ) : (
                        <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                          <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                            {student.first_name[0]}
                            {student.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-foreground">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Age {student.age || 'N/A'} • {student.gender || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  {!isTeacher && !isParent && (
                    <TableCell className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground/80">
                            {student.student_type === 'dependent'
                              ? 'See parent contact'
                              : (student.email || 'None')
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground/80">
                            {student.student_type === 'dependent'
                              ? 'See parent contact'
                              : (student.phone || 'None')
                            }
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {/* Location */}
                  <TableCell className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground/80">{student.country || 'None'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-5">{student.language || 'N/A'}</p>
                    </div>
                  </TableCell>

                  {/* Parents */}
                  <TableCell className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-foreground/80">
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
                  <TableCell className="py-3 px-4 text-center">
                    <div className="max-w-[100px] mx-auto">
                      <StatusBadge status={convertStatusToPrefixedFormat(student.status, 'user')} />
                    </div>
                  </TableCell>

                  {/* Actions - Show for admin and moderator */}
                  {(isAdmin || isModerator) && (
                    <TableCell data-no-navigation className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="font-semibold text-xs">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="cursor-pointer text-sm">
                            <Link href={getActionUrl('assign-class', student.student_id)} className="flex items-center">
                              <GraduationCap className="mr-2 h-4 w-4" />
                              Assign to Class
                            </Link>
                          </DropdownMenuItem>
                          {/* Only show edit for admin */}
                          {isAdmin && (
                            <DropdownMenuItem asChild className="cursor-pointer text-sm">
                              <Link href={getActionUrl('edit', student.student_id)} className="flex items-center">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Student
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
  )
}
