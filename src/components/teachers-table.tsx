"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type React from "react"

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
import { Edit, MoreHorizontal, CalendarPlus } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getTeachers } from "@/lib/get-teachers"
import { getTeacherClassCount } from "@/lib/get-classes"
import { TeacherType } from "@/types"

export function TeachersTable() {
  const [teachers, setTeachers] = useState<TeacherType[]>([])
  const [classCount, setClassCount] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await getTeachers()
        setTeachers(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch teachers:", error)
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  useEffect(() => {
    const fetchClassCounts = async () => {
      const counts: Record<string, number> = {}
      for (const teacher of teachers) {
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

    if (teachers.length > 0) {
      fetchClassCounts()
    }
  }, [teachers])

  // Calculate pagination
  const totalItems = teachers.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedTeachers = teachers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (loading) {
    return <div>Loading teachers...</div>
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTeachers.map((teacher) => (
              <TableRow
                key={teacher.teacher_id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell>
                  <Link
                    href={`/admin/teachers/${teacher.teacher_id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {teacher.first_name[0]}
                        {teacher.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {teacher.first_name} {teacher.last_name}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/teachers/${teacher.teacher_id}`}>
                    {teacher.specialization}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/teachers/${teacher.teacher_id}`}>
                    {teacher.email}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/teachers/${teacher.teacher_id}`}>
                    {teacher.phone}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/teachers/${teacher.teacher_id}`}>
                    {classCount[teacher.teacher_id] || 0}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/admin/teachers/${teacher.teacher_id}`}>
                    <StatusBadge status={teacher.status} />
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/teachers/${teacher.teacher_id}`}>
                    {new Date(teacher.created_at).toLocaleDateString()}
                  </Link>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/teachers/${teacher.teacher_id}/assign-class`}>
                          <CalendarPlus className="mr-2 h-4 w-4" />
                          Assign Class
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/teachers/${teacher.teacher_id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
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
