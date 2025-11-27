"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import React from "react"
import { useRouter } from "next/navigation"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, MoreHorizontal, CalendarPlus, Mail, Phone, MapPin } from "lucide-react"

import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getTeacherClassCount } from "@/lib/get/get-classes"
import { TeacherType } from "@/types"
import AvatarIcon from "./avatar"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { getProfile } from "@/lib/get/get-profiles"
import { EmptyTableState } from "./empty-table-state"
import { UserPen } from "lucide-react"

interface TeachersTableProps {
  teachers: TeacherType[]
  userRole?: 'admin' | 'moderator' | 'teacher' | 'parent' | 'student'
}

export function TeachersTable({ teachers, userRole }: TeachersTableProps) {
  const router = useRouter()
  const [classCount, setClassCount] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const profile = await getProfile()
        setCurrentUserRole(profile.role)
      } catch {
        if (userRole) setCurrentUserRole(userRole)
      }
    }
    fetchUserRole()
  }, [userRole])

  // Filter out admins, only show teachers
  const teachersOnly = useMemo(() => {
    return teachers.filter(teacher => teacher.role === 'teacher')
  }, [teachers])

  // Group and sort teachers by status, then alphabetically by name
  const groupedTeachers = useMemo(() => {
    // Define status order (priority order) - pending first
    const statusOrder = ['pending', 'active', 'inactive', 'suspended', 'archived'] as const

    // Group teachers by status
    const groups: Record<string, TeacherType[]> = {
      'pending': [],
      'active': [],
      'inactive': [],
      'suspended': [],
      'archived': [],
    }

    // Group teachers
    teachersOnly.forEach(teacher => {
      const status = teacher.status?.toLowerCase() || 'inactive'
      if (groups[status]) {
        groups[status].push(teacher)
      } else {
        // If status doesn't match known statuses, add to inactive
        groups['inactive'].push(teacher)
      }
    })

    // Sort each group alphabetically
    Object.keys(groups).forEach(status => {
      groups[status].sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
        return nameA.localeCompare(nameB)
      })
    })

    // Return groups in explicit priority order (pending first)
    return statusOrder
      .map(status => ({
        status,
        teachers: groups[status],
      }))
      .filter(group => group.teachers.length > 0)
  }, [teachersOnly])

  // Flatten grouped teachers for pagination
  const allTeachers = useMemo(() => {
    return groupedTeachers.flatMap(group => group.teachers)
  }, [groupedTeachers])

  // Calculate pagination
  const totalItems = allTeachers.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedTeachers = useMemo(() => {
    return allTeachers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [allTeachers, currentPage, pageSize])

  // Get which groups are visible on current page
  const getVisibleGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    let currentIndex = 0
    const visibleGroups: Array<{ status: string; teachers: TeacherType[]; startIndex: number }> = []

    for (const group of groupedTeachers) {
      const groupStart = currentIndex
      const groupEnd = currentIndex + group.teachers.length

      if (groupEnd > startIndex && groupStart < endIndex) {
        const visibleStart = Math.max(0, startIndex - groupStart)
        const visibleEnd = Math.min(group.teachers.length, endIndex - groupStart)
        visibleGroups.push({
          status: group.status,
          teachers: group.teachers.slice(visibleStart, visibleEnd),
          startIndex: groupStart + visibleStart,
        })
      }

      currentIndex = groupEnd
      if (currentIndex >= endIndex) break
    }

    return visibleGroups
  }, [groupedTeachers, currentPage, pageSize])

  useEffect(() => {
    const fetchClassCounts = async () => {
      if (paginatedTeachers.length === 0) return

      const counts: Record<string, number> = {}
      for (const teacher of paginatedTeachers) {
        try {
          const count = await getTeacherClassCount(teacher.teacher_id)
          counts[teacher.teacher_id] = count ?? 0
        } catch (error) {
          console.error(`Failed to fetch class count for teacher ${teacher.teacher_id}:`, error)
          counts[teacher.teacher_id] = 0
        }
      }
      setClassCount(counts)
    }

    fetchClassCounts()
  }, [paginatedTeachers])

  const isAdmin = currentUserRole === 'admin'

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">ID</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Teacher</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Contact</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Specialization</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Location</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide text-center">Classes</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide text-center">Status</TableHead>
              <TableHead className="w-[50px] px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24">
                  <EmptyTableState
                    icon={UserPen}
                    title="No teachers found"
                    description="There are no teachers to display. Teachers will appear here once they are added to the system."
                  />
                </TableCell>
              </TableRow>
            ) : (
              getVisibleGroups.map((group) => {
                const groupTotalCount = groupedTeachers.find(g => g.status === group.status)?.teachers.length || 0
                return (
                  <React.Fragment key={group.status}>
                    {/* Group Header */}
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2 border-border">
                      <TableCell 
                        colSpan={8} 
                        className="py-3 px-4"
                      >
                        <div className="flex items-center gap-2">
                          <StatusBadge status={convertStatusToPrefixedFormat(group.status, 'user')} />
                          <span className="text-sm font-semibold text-foreground/80 capitalize">
                            {group.status} Teachers
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({groupTotalCount} {groupTotalCount === 1 ? 'teacher' : 'teachers'})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Group Teachers */}
                    {group.teachers.map((teacher, teacherIndex) => {
                      const globalIndex = group.startIndex + teacherIndex
                      return (
                        <TableRow
                          key={teacher.teacher_id}
                          style={globalIndex % 2 !== 0 ? { backgroundColor: 'rgba(220, 252, 231, 0.27)' } : { backgroundColor: 'transparent' }}
                          className="hover:bg-muted/100 transition-all duration-200 cursor-pointer border-b border-border/30"
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
                            router.push(`/admin/teachers/${teacher.teacher_id}`)
                          }}
                        >
                          {/* ID */}
                          <TableCell className="py-3 px-4">
                            <span className="text-sm font-semibold text-muted-foreground">
                              {globalIndex + 1}
                            </span>
                          </TableCell>
                          {/* Teacher Info */}
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {teacher.avatar_url ? (
                                <AvatarIcon url={teacher.avatar_url} size="medium" />
                              ) : (
                                <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                                  <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                                    {teacher.first_name[0]}
                                    {teacher.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="space-y-0.5">
                                <p className="font-semibold text-sm text-foreground">
                                  {teacher.first_name} {teacher.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {teacher.gender || ''}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Contact Info */}
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-foreground/80">{teacher.email || 'None'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <span className="text-foreground/80">{teacher.phone || 'None'}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Specialization */}
                          <TableCell className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm text-foreground/80">{teacher.specialization || 'None'}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Location */}
                          <TableCell className="py-3 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-foreground/80">{teacher.country || 'None'}</span>
                              </div>
                              <p className="text-xs text-muted-foreground ml-5">{teacher.language || 'None'}</p>
                            </div>
                          </TableCell>

                          {/* Classes Count */}
                          <TableCell className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="font-semibold text-primary text-sm">
                                {classCount[teacher.teacher_id] || 0}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 px-4 text-center">
                            <div className="max-w-[100px] mx-auto">
                              <StatusBadge status={convertStatusToPrefixedFormat(teacher.status, 'user')} />
                            </div>
                          </TableCell>

                          {/* Actions */}
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
                                  <Link href={`/admin/teachers/assign-class/${teacher.teacher_id}`} className="flex items-center">
                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                    Assign Class
                                  </Link>
                                </DropdownMenuItem>
                                {/* Only show edit for admin */}
                                {isAdmin && (
                                  <DropdownMenuItem asChild className="cursor-pointer text-sm">
                                    <Link href={`/admin/teachers/edit/${teacher.teacher_id}`} className="flex items-center">
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Teacher
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                )
              })
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