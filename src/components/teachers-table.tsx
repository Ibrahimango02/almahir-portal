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
import { Edit, MoreHorizontal, CalendarPlus } from "lucide-react"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getTeacherClassCount } from "@/lib/get/get-classes"
import { TeacherType } from "@/types"
import AvatarIcon from "./avatar"

interface TeachersTableProps {
  teachers: TeacherType[]
}

export function TeachersTable({ teachers }: TeachersTableProps) {
  const router = useRouter()
  const [classCount, setClassCount] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Country</TableHead>
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
                className="hover:bg-muted/50 transition-colors cursor-pointer"
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
                <TableCell>
                  <div className="flex items-center gap-3">
                    {teacher.avatar_url ? (
                      <AvatarIcon url={teacher.avatar_url} size="medium" />
                    ) : (
                      <Avatar>
                        <AvatarFallback>
                          {teacher.first_name[0]}
                          {teacher.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">
                        {teacher.first_name} {teacher.last_name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{teacher.gender}</TableCell>
                <TableCell>{teacher.specialization}</TableCell>
                <TableCell>{teacher.language}</TableCell>
                <TableCell>{teacher.country}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.phone}</TableCell>
                <TableCell className="text-center">{classCount[teacher.teacher_id] || 0}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={teacher.status} />
                </TableCell>
                <TableCell>{format(parseISO(teacher.created_at), "yyyy-MM-dd")}</TableCell>
                <TableCell data-no-navigation>
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
                        <Link href={`/admin/teachers/assign-class/${teacher.teacher_id}`}>
                          <CalendarPlus className="mr-2 h-4 w-4" />
                          Assign Class
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/teachers/edit/${teacher.teacher_id}`}>
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