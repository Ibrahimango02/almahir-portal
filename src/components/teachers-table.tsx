"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type React from "react"
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
import { Edit, MoreHorizontal, CalendarPlus, Mail, Phone, MapPin, BookOpen } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getTeacherClassCount } from "@/lib/get/get-classes"
import { TeacherType } from "@/types"
import AvatarIcon from "./avatar"
import { convertStatusToPrefixedFormat } from "@/lib/utils"

interface TeachersTableProps {
  teachers: TeacherType[]
}

export function TeachersTable({ teachers }: TeachersTableProps) {
  const router = useRouter()
  const [classCount, setClassCount] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter out admins, only show teachers
  const teachersOnly = teachers.filter(teacher => teacher.role === 'teacher')

  useEffect(() => {
    const fetchClassCounts = async () => {
      const counts: Record<string, number> = {}
      for (const teacher of teachersOnly) {
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

    if (teachersOnly.length > 0) {
      fetchClassCounts()
    }
  }, [teachersOnly])

  // Calculate pagination
  const totalItems = teachersOnly.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedTeachers = teachersOnly.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-4">

      {/* Table Container */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Teacher</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Contact</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Specialization</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Location</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Classes</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Status</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Joined</TableHead>
                <TableHead className="w-[50px] px-3"></TableHead>
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
                    router.push(`/admin/teachers/${teacher.teacher_id}`)
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
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {teacher.gender}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell className="py-2 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[120px]">{teacher.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{teacher.phone}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Specialization */}
                  <TableCell className="py-2 px-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span className="font-medium text-sm">{teacher.specialization}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{teacher.country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{teacher.language}</p>
                  </TableCell>

                  {/* Classes Count */}
                  <TableCell className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-primary text-sm">
                        {classCount[teacher.teacher_id] || 0}
                      </span>
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

                  {/* Actions */}
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
                          <Link href={`/admin/teachers/assign-class/${teacher.teacher_id}`} className="flex items-center">
                            <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                            Assign Class
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer text-xs">
                          <Link href={`/admin/teachers/edit/${teacher.teacher_id}`} className="flex items-center">
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit Teacher
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
  )
}