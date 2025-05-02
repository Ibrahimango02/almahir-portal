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
import { useRouter } from "next/navigation"
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getStudents } from "@/lib/get-students"

// Mock data based on the database schema
const students = await getStudents()

//console.log(students)

const sstudents = [
  {
    id: "S001",
    first_name: "Emma",
    last_name: "Smith",
    grade_level: "10th",
    age: 16,
    parent: "John Smith",
    email: "emma.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Physics", "English"],
    created_at: "2021-09-01T00:00:00",
    teacher: "Sarah Johnson",
    status: "active",
  },
  {
    id: "S002",
    first_name: "Noah",
    last_name: "Smith",
    grade_level: "8th",
    age: 14,
    parent: "John Smith",
    email: "noah.smith@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Biology", "History"],
    created_at: "2021-09-01T00:00:00",
    teacher: "Michael Brown",
    status: "active",
  },
  {
    id: "S003",
    first_name: "Sophia",
    last_name: "Garcia",
    grade_level: "11th",
    age: 17,
    parent: "Maria Garcia",
    email: "sophia.garcia@student.almahir.edu",
    enrolledClasses: ["Chemistry", "Spanish", "Art"],
    created_at: "2022-01-15T00:00:00",
    teacher: "David Wilson",
    status: "pending",
  },
  {
    id: "S004",
    first_name: "William",
    last_name: "Johnson",
    grade_level: "9th",
    age: 15,
    parent: "James Johnson",
    email: "william.johnson@student.almahir.edu",
    enrolledClasses: ["Physics", "Computer Science", "English"],
    created_at: "2020-09-10T00:00:00",
    teacher: "Sarah Johnson",
    status: "suspended",
  },
  {
    id: "S005",
    first_name: "Olivia",
    last_name: "Johnson",
    grade_level: "7th",
    age: 13,
    parent: "James Johnson",
    email: "olivia.johnson@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Music", "Art"],
    created_at: "2020-09-10T00:00:00",
    teacher: "Jennifer Lee",
    status: "active",
  },
  {
    id: "S006",
    first_name: "Liam",
    last_name: "Johnson",
    grade_level: "12th",
    age: 18,
    parent: "James Johnson",
    email: "liam.johnson@student.almahir.edu",
    enrolledClasses: ["Physics", "Chemistry", "Mathematics"],
    created_at: "2020-09-10T00:00:00",
    teacher: "Michael Brown",
    status: "inactive",
  },
  {
    id: "S007",
    first_name: "Ava",
    last_name: "Brown",
    grade_level: "10th",
    age: 16,
    parent: "Patricia Brown",
    email: "ava.brown@student.almahir.edu",
    enrolledClasses: ["Biology", "English", "History"],
    created_at: "2021-11-25T00:00:00",
    teacher: "David Wilson",
    status: "active",
  },
  {
    id: "S008",
    first_name: "Isabella",
    last_name: "Davis",
    grade_level: "9th",
    age: 15,
    parent: "Robert Davis",
    email: "isabella.davis@student.almahir.edu",
    enrolledClasses: ["Mathematics", "Science", "Art"],
    created_at: "2021-08-20T00:00:00",
    teacher: "Emily Johnson",
    status: "active",
  },
  {
    id: "S009",
    first_name: "Mia",
    last_name: "Davis",
    grade_level: "11th",
    age: 17,
    parent: "Robert Davis",
    email: "mia.davis@student.almahir.edu",
    enrolledClasses: ["Physics", "Chemistry", "Mathematics"],
    created_at: "2021-08-20T00:00:00",
    teacher: "Michael Chen",
    status: "archived",
  },
  {
    id: "S010",
    first_name: "James",
    last_name: "Wilson",
    grade_level: "8th",
    age: 14,
    parent: "Jennifer Wilson",
    email: "james.wilson@student.almahir.edu",
    enrolledClasses: ["English", "History", "Geography"],
    created_at: "2020-07-05T00:00:00",
    teacher: "Sarah Johnson",
    status: "active",
  },
  {
    id: "S011",
    first_name: "Charlotte",
    last_name: "Miller",
    grade_level: "10th",
    age: 16,
    parent: "Michael Miller",
    email: "charlotte.miller@student.almahir.edu",
    enrolledClasses: ["Biology", "Chemistry", "Physics"],
    created_at: "2021-05-15T00:00:00",
    teacher: "Robert Wilson",
    status: "active",
  },
  {
    id: "S012",
    first_name: "Amelia",
    last_name: "Miller",
    grade_level: "7th",
    age: 13,
    parent: "Michael Miller",
    email: "amelia.miller@student.almahir.edu",
    enrolledClasses: ["Mathematics", "English", "Art"],
    created_at: "2021-05-15T00:00:00",
    teacher: "Emily Davis",
    status: "suspended",
  },
  {
    id: "S013",
    first_name: "Ethan",
    last_name: "Taylor",
    grade_level: "12th",
    age: 18,
    parent: "Daniel Taylor",
    email: "ethan.taylor@student.almahir.edu",
    enrolledClasses: ["Computer Science", "Mathematics", "Physics"],
    created_at: "2019-09-01T00:00:00",
    teacher: "Michael Chen",
    status: "active",
  },
  {
    id: "S014",
    first_name: "Harper",
    last_name: "Anderson",
    grade_level: "9th",
    age: 15,
    parent: "Thomas Anderson",
    email: "harper.anderson@student.almahir.edu",
    enrolledClasses: ["English", "History", "Spanish"],
    created_at: "2022-01-10T00:00:00",
    teacher: "Maria Rodriguez",
    status: "pending",
  },
  {
    id: "S015",
    first_name: "Benjamin",
    last_name: "Thomas",
    grade_level: "11th",
    age: 17,
    parent: "Richard Thomas",
    email: "benjamin.thomas@student.almahir.edu",
    enrolledClasses: ["Physics", "Chemistry", "Biology"],
    created_at: "2020-08-15T00:00:00",
    teacher: "Jennifer Lee",
    status: "active",
  },
]

export function StudentsTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Check if the click was on or inside a dropdown menu
    const target = e.target as HTMLElement
    if (target.closest("[data-no-row-click]")) {
      return
    }

    router.push(`/admin/students/${id}`)
  }

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
                key={student.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={(e) => handleRowClick(student.id, e)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
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
                  </div>
                </TableCell>
                <TableCell>{student.age}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {student.parents.map((parent) => (
                      <Badge key={parent?.id} variant="outline">
                        {parent?.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {student.teachers.map((teacher) => (
                      <Badge key={teacher?.id} variant="outline">
                        {teacher?.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={student.status} />
                </TableCell>
                <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild data-no-row-click>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" data-no-row-click>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/students/${student.id}/assign-to-class`}>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Assign to Class
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/students/${student.id}/edit`}>
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
