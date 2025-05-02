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
import { useRouter } from "next/navigation"
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getTeachers } from "@/lib/get-teachers"

const teachers = await getTeachers()

// Mock data based on the database schema
const tteachers = [
  {
    id: "T001",
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.johnson@almahir.edu",
    phone: "+1 (555) 123-4567",
    subjects: ["Mathematics"],
    hourly_rate: 45,
    classes_count: 5,
    status: "active",
    created_at: "2020-05-12T00:00:00",
  },
  {
    id: "T002",
    first_name: "Michael",
    last_name: "Chen",
    email: "michael.chen@almahir.edu",
    phone: "+1 (555) 234-5678",
    subjects: ["Physics", "Computer Science"],
    hourly_rate: 50,
    classes_count: 4,
    status: "active",
    created_at: "2019-09-03T00:00:00",
  },
  {
    id: "T003",
    first_name: "Emily",
    last_name: "Davis",
    email: "emily.davis@almahir.edu",
    phone: "+1 (555) 345-6789",
    subjects: ["English", "Art"],
    hourly_rate: 40,
    classes_count: 6,
    status: "active",
    created_at: "2021-01-15T00:00:00",
  },
  {
    id: "T004",
    first_name: "Robert",
    last_name: "Wilson",
    email: "robert.wilson@almahir.edu",
    phone: "+1 (555) 456-7890",
    subjects: ["Chemistry"],
    hourly_rate: 45,
    classes_count: 3,
    status: "suspended",
    created_at: "2018-08-22T00:00:00",
  },
  {
    id: "T005",
    first_name: "Jennifer",
    last_name: "Lee",
    email: "jennifer.lee@almahir.edu",
    phone: "+1 (555) 567-8901",
    subjects: ["Biology", "Music"],
    hourly_rate: 42,
    classes_count: 5,
    status: "active",
    created_at: "2020-11-07T00:00:00",
  },
  {
    id: "T006",
    first_name: "David",
    last_name: "Brown",
    email: "david.brown@almahir.edu",
    phone: "+1 (555) 678-9012",
    subjects: ["History", "Physical Education"],
    hourly_rate: 38,
    classes_count: 4,
    status: "active",
    created_at: "2019-03-18T00:00:00",
  },
  {
    id: "T007",
    first_name: "Maria",
    last_name: "Rodriguez",
    email: "maria.rodriguez@almahir.edu",
    phone: "+1 (555) 789-0123",
    subjects: ["Spanish"],
    hourly_rate: 40,
    classes_count: 3,
    status: "inactive",
    created_at: "2022-02-01T00:00:00",
  },
  {
    id: "T008",
    first_name: "James",
    last_name: "Taylor",
    email: "james.taylor@almahir.edu",
    phone: "+1 (555) 890-1234",
    subjects: ["Geography", "Social Studies"],
    hourly_rate: 41,
    classes_count: 4,
    status: "active",
    created_at: "2021-06-15T00:00:00",
  },
  {
    id: "T009",
    first_name: "Linda",
    last_name: "Martinez",
    email: "linda.martinez@almahir.edu",
    phone: "+1 (555) 901-2345",
    subjects: ["French", "Italian"],
    hourly_rate: 43,
    classes_count: 5,
    status: "active",
    created_at: "2020-08-30T00:00:00",
  },
  {
    id: "T010",
    first_name: "William",
    last_name: "Anderson",
    email: "william.anderson@almahir.edu",
    phone: "+1 (555) 012-3456",
    subjects: ["Physics", "Mathematics"],
    hourly_rate: 47,
    classes_count: 6,
    status: "pending",
    created_at: "2019-11-22T00:00:00",
  },
  {
    id: "T011",
    first_name: "Elizabeth",
    last_name: "Thomas",
    email: "elizabeth.thomas@almahir.edu",
    phone: "+1 (555) 123-4567",
    subjects: ["Chemistry", "Biology"],
    hourly_rate: 46,
    classes_count: 4,
    status: "active",
    created_at: "2021-03-10T00:00:00",
  },
  {
    id: "T012",
    first_name: "Richard",
    last_name: "Jackson",
    email: "richard.jackson@almahir.edu",
    phone: "+1 (555) 234-5678",
    subjects: ["Computer Science"],
    hourly_rate: 49,
    classes_count: 3,
    status: "archived",
    created_at: "2020-01-05T00:00:00",
  },
  {
    id: "T013",
    first_name: "Susan",
    last_name: "White",
    email: "susan.white@almahir.edu",
    phone: "+1 (555) 345-6789",
    subjects: ["English Literature"],
    hourly_rate: 44,
    classes_count: 5,
    status: "active",
    created_at: "2019-07-20T00:00:00",
  },
  {
    id: "T014",
    first_name: "Joseph",
    last_name: "Harris",
    email: "joseph.harris@almahir.edu",
    phone: "+1 (555) 456-7890",
    subjects: ["History", "Political Science"],
    hourly_rate: 42,
    classes_count: 4,
    status: "active",
    created_at: "2022-04-18T00:00:00",
  },
  {
    id: "T015",
    first_name: "Margaret",
    last_name: "Martin",
    email: "margaret.martin@almahir.edu",
    phone: "+1 (555) 567-8901",
    subjects: ["Art", "Design"],
    hourly_rate: 40,
    classes_count: 3,
    status: "inactive",
    created_at: "2021-09-12T00:00:00",
  },
]

export function TeachersTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Check if the click was on or inside a dropdown menu
    const target = e.target as HTMLElement
    if (target.closest("[data-no-row-click]")) {
      return
    }

    router.push(`/admin/teachers/${id}`)
  }

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
                key={teacher.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={(e) => handleRowClick(teacher.id, e)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
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
                  </div>
                </TableCell>
                <TableCell>{teacher.specialization}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.phone}</TableCell>
                <TableCell>{5}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={teacher.status} />
                </TableCell>
                <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
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
                        <Link href={`/admin/teachers/${teacher.id}/assign-class`}>
                          <CalendarPlus className="mr-2 h-4 w-4" />
                          Assign Class
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/teachers/${teacher.id}/edit`}>
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
