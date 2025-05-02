"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { TablePagination } from "./table-pagination"

// Define the student data type
type Student = {
  id: string
  name: string
  email: string
  grade: string
  subjects: string[]
  progress: "excellent" | "good" | "average" | "needs-improvement"
  lastAttendance: string
}

// Sample data
const students: Student[] = [
  {
    id: "STU001",
    name: "Ahmed Ali",
    email: "ahmed.ali@example.com",
    grade: "10th",
    subjects: ["Mathematics", "Physics"],
    progress: "excellent",
    lastAttendance: "2023-04-15",
  },
  {
    id: "STU002",
    name: "Fatima Khan",
    email: "fatima.khan@example.com",
    grade: "10th",
    subjects: ["Mathematics"],
    progress: "good",
    lastAttendance: "2023-04-15",
  },
  {
    id: "STU003",
    name: "Zainab Hussein",
    email: "zainab.hussein@example.com",
    grade: "10th",
    subjects: ["Mathematics", "Chemistry"],
    progress: "average",
    lastAttendance: "2023-04-14",
  },
  {
    id: "STU004",
    name: "Omar Farooq",
    email: "omar.farooq@example.com",
    grade: "10th",
    subjects: ["Mathematics"],
    progress: "needs-improvement",
    lastAttendance: "2023-04-13",
  },
  {
    id: "STU005",
    name: "Layla Mohammed",
    email: "layla.mohammed@example.com",
    grade: "11th",
    subjects: ["Mathematics", "Biology"],
    progress: "good",
    lastAttendance: "2023-04-15",
  },
  {
    id: "STU006",
    name: "Ibrahim Yusuf",
    email: "ibrahim.yusuf@example.com",
    grade: "11th",
    subjects: ["Mathematics"],
    progress: "excellent",
    lastAttendance: "2023-04-15",
  },
  {
    id: "STU007",
    name: "Aisha Mahmoud",
    email: "aisha.mahmoud@example.com",
    grade: "11th",
    subjects: ["Mathematics", "Physics"],
    progress: "good",
    lastAttendance: "2023-04-14",
  },
  {
    id: "STU008",
    name: "Yousef Ahmed",
    email: "yousef.ahmed@example.com",
    grade: "11th",
    subjects: ["Mathematics"],
    progress: "average",
    lastAttendance: "2023-04-13",
  },
  {
    id: "STU009",
    name: "Noor Abdullah",
    email: "noor.abdullah@example.com",
    grade: "10th",
    subjects: ["Physics", "Chemistry"],
    progress: "excellent",
    lastAttendance: "2023-04-15",
  },
  {
    id: "STU010",
    name: "Hassan Rahman",
    email: "hassan.rahman@example.com",
    grade: "10th",
    subjects: ["Mathematics", "Biology"],
    progress: "good",
    lastAttendance: "2023-04-14",
  },
  {
    id: "STU011",
    name: "Mariam Khalid",
    email: "mariam.khalid@example.com",
    grade: "11th",
    subjects: ["Chemistry", "Biology"],
    progress: "average",
    lastAttendance: "2023-04-13",
  },
  {
    id: "STU012",
    name: "Tariq Aziz",
    email: "tariq.aziz@example.com",
    grade: "11th",
    subjects: ["Physics", "Mathematics"],
    progress: "needs-improvement",
    lastAttendance: "2023-04-12",
  },
  {
    id: "STU013",
    name: "Leila Hasan",
    email: "leila.hasan@example.com",
    grade: "10th",
    subjects: ["English", "History"],
    progress: "good",
    lastAttendance: "2023-04-15",
  },
  {
    id: "STU014",
    name: "Karim Mustafa",
    email: "karim.mustafa@example.com",
    grade: "10th",
    subjects: ["Mathematics", "Computer Science"],
    progress: "excellent",
    lastAttendance: "2023-04-15",
  },
  {
    id: "STU015",
    name: "Samira Nasser",
    email: "samira.nasser@example.com",
    grade: "11th",
    subjects: ["Biology", "Chemistry"],
    progress: "good",
    lastAttendance: "2023-04-14",
  },
]

// Helper function to get progress badge variant
const getProgressBadgeVariant = (progress: Student["progress"]) => {
  switch (progress) {
    case "excellent":
      return "default"
    case "good":
      return "secondary"
    case "average":
      return "outline"
    case "needs-improvement":
      return "destructive"
    default:
      return "outline"
  }
}

// Define the columns
const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const student = row.original
      const initials = student.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="font-medium">{student.name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "grade",
    header: "Grade",
    cell: ({ row }) => <div>{row.getValue("grade")}</div>,
  },
  {
    accessorKey: "subjects",
    header: "Subjects",
    cell: ({ row }) => {
      const subjects = row.original.subjects
      return (
        <div className="flex flex-wrap gap-1">
          {subjects.map((subject) => (
            <Badge key={subject} variant="outline" className="mr-1">
              {subject}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => {
      const progress = row.getValue("progress") as Student["progress"]
      return <Badge variant={getProgressBadgeVariant(progress)}>{progress.replace("-", " ")}</Badge>
    },
  },
  {
    accessorKey: "lastAttendance",
    header: "Last Attendance",
    cell: ({ row }) => {
      const date = new Date(row.getValue("lastAttendance"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/teacher/students/${student.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/teacher/students/${student.id}/progress`}>View Progress</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Contact Student</DropdownMenuItem>
            <DropdownMenuItem>Contact Parent</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function TeacherStudentsTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: false,
    pageCount: Math.ceil(students.length / pageSize),
  })

  // Calculate pagination values for our custom pagination component
  const currentPage = pageIndex + 1
  const totalPages = Math.ceil(students.length / pageSize)
  const totalItems = students.length

  // Handle page change from our custom pagination component
  const handlePageChange = (page: number) => {
    setPageIndex(page - 1)
  }

  // Handle page size change from our custom pagination component
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPageIndex(0) // Reset to first page when changing page size
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
