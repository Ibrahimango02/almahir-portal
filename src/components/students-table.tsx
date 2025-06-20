"use client"

import type React from "react"
import { useRouter } from "next/navigation"

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
import { Edit, GraduationCap, MoreHorizontal, Mail, Phone, MapPin, Users, UserPen, UserCheck } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getStudentParents, getStudentTeachers } from "@/lib/get/get-students"
import { StudentType } from "@/types"
import AvatarIcon from "./avatar"
import { format, parseISO } from "date-fns"
import { convertStatusToPrefixedFormat } from "@/lib/utils"

// Define types for related data
type ParentType = {
  id: string;
  first_name: string;
  last_name: string;
}

type TeacherType = {
  id: string;
  first_name: string;
  last_name: string;
}

interface StudentsTableProps {
  students: StudentType[]
}

export function StudentsTable({ students }: StudentsTableProps) {
  const router = useRouter()
  const [parentData, setParentData] = useState<Record<string, ParentType[]>>({})
  const [teacherData, setTeacherData] = useState<Record<string, TeacherType[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const fetchRelatedData = async () => {
      const parentResults: Record<string, ParentType[]> = {}
      const teacherResults: Record<string, TeacherType[]> = {}

      for (const student of students) {
        try {
          const parents = await getStudentParents(student.student_id)
          parentResults[student.student_id] = parents || []

          const teachers = await getStudentTeachers(student.student_id)
          teacherResults[student.student_id] = teachers || []
        } catch (error) {
          console.error(`Failed to fetch related data for student ${student.student_id}:`, error)
          parentResults[student.student_id] = []
          teacherResults[student.student_id] = []
        }
      }

      setParentData(parentResults)
      setTeacherData(teacherResults)
    }

    if (students.length > 0) {
      fetchRelatedData()
    }
  }, [students])

  // Calculate pagination
  const totalItems = students.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Student</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Contact</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Location</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Relations</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Status</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Joined</TableHead>
                <TableHead className="w-[50px] px-3"></TableHead>
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
                    router.push(`/admin/students/${student.student_id}`)
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
                          Age {student.age} • {student.gender}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell className="py-2 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground max-w-[120px]">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{student.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="py-2 px-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{student.country}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{student.language}</p>
                    </div>
                  </TableCell>

                  {/* Relations */}
                  <TableCell className="py-2 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium">Parents:</span>
                        <span className="text-xs text-muted-foreground">
                          {parentData[student.student_id]?.length > 0
                            ? parentData[student.student_id].map(parent =>
                              `${parent.first_name} ${parent.last_name}`
                            ).join(', ')
                            : 'None'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-primary" />
                        <span className="text-xs font-medium">Teachers:</span>
                        <span className="text-xs text-muted-foreground">
                          {teacherData[student.student_id]?.length > 0
                            ? teacherData[student.student_id].map(teacher =>
                              `${teacher.first_name} ${teacher.last_name}`
                            ).join(', ')
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

                  {/* Join Date */}
                  <TableCell className="py-2 px-3">
                    <div className="text-xs">
                      <p className="font-medium">
                        {format(parseISO(student.created_at), "MMM dd, yyyy")}
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
                          <Link href={`/admin/students/assign-class/${student.student_id}`} className="flex items-center">
                            <GraduationCap className="mr-2 h-3.5 w-3.5" />
                            Assign to Class
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer text-xs">
                          <Link href={`/admin/students/edit/${student.student_id}`} className="flex items-center">
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit Student
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
