"use client"

import type React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, GraduationCap, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getStudents, getStudentParents, getStudentTeachers } from "@/lib/get-students"

// Mock data based on the database schema
const students = await getStudents()

export function StudentsTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Calculate pagination
  const totalItems = students.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow
                key={student.student_id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell>
                  <Link href={`/admin/students/${student.student_id}`} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/students/${student.student_id}`}>
                    {student.age}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/students/${student.student_id}`}>
                    <div className="flex flex-wrap gap-1">
                      {(async () => {
                        const parents = await getStudentParents(student.student_id)
                        return parents?.map((parent) => (
                          <Badge key={parent.id} variant="outline">
                            {parent.first_name} {parent.last_name}
                          </Badge>
                        ))
                      })()}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/students/${student.student_id}`}>
                    <div className="flex flex-wrap gap-1">
                      {(async () => {
                        const teachers = await getStudentTeachers(student.student_id)
                        return teachers?.map((teacher) => (
                          <Badge key={teacher.id} variant="outline">
                            {teacher.first_name} {teacher.last_name}
                          </Badge>
                        ))
                      })()}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/students/${student.student_id}`}>
                    {student.email}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/admin/students/${student.student_id}`}>
                    <StatusBadge status={student.status} />
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/students/${student.student_id}`}>
                    {new Date(student.created_at).toLocaleDateString()}
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
                        <Link href={`/admin/students/${student.student_id}/assign-to-class`}>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Assign to Class
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/students/${student.student_id}/edit`}>
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
