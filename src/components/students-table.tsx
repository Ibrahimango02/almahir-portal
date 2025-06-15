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
import { Edit, GraduationCap, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getStudents, getStudentParents, getStudentTeachers } from "@/lib/get/get-students"
import { StudentType } from "@/types"
import AvatarIcon from "./avatar"

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

export function StudentsTable() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentType[]>([])
  const [parentData, setParentData] = useState<Record<string, ParentType[]>>({})
  const [teacherData, setTeacherData] = useState<Record<string, TeacherType[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getStudents()
        setStudents(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch students:", error)
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

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

  if (loading) {
    return <div>Loading students...</div>
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map((student) => (
              <TableRow
                key={student.student_id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
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
                <TableCell>
                  <div className="flex items-center gap-3">
                    {student.avatar_url ? (
                      <AvatarIcon url={student.avatar_url} size="medium" />
                    ) : (
                      <Avatar>
                        <AvatarFallback>
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{student.age}</TableCell>
                <TableCell>{student.gender}</TableCell>
                <TableCell>{student.language}</TableCell>
                <TableCell>{student.country}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {parentData[student.student_id]?.map((parent) => (
                      <Badge key={parent.id} variant="outline">
                        {parent.first_name} {parent.last_name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {teacherData[student.student_id]?.map((teacher) => (
                      <Badge key={teacher.id} variant="outline">
                        {teacher.first_name} {teacher.last_name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={student.status} />
                </TableCell>
                <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
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
                        <Link href={`/admin/students/assign-class/${student.student_id}`}>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Assign to Class
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/students/edit/${student.student_id}`}>
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
