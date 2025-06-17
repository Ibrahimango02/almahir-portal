"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { Edit, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getParentStudents } from "@/lib/get/get-parents"
import { ParentType } from "@/types"
import AvatarIcon from "./avatar"

// Define type for student data
type StudentType = {
  id: string;
  first_name: string;
  last_name: string;
}

interface ParentsTableProps {
  parents: ParentType[]
}

export function ParentsTable({ parents }: ParentsTableProps) {
  const router = useRouter()
  const [studentData, setStudentData] = useState<Record<string, StudentType[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const fetchStudentData = async () => {
      const results: Record<string, StudentType[]> = {}
      for (const parent of parents) {
        try {
          const students = await getParentStudents(parent.parent_id)
          results[parent.parent_id] = students || []
        } catch (error) {
          console.error(`Failed to fetch students for parent ${parent.parent_id}:`, error)
          results[parent.parent_id] = []
        }
      }
      setStudentData(results)
    }

    if (parents.length > 0) {
      fetchStudentData()
    }
  }, [parents])

  // Calculate pagination
  const totalItems = parents.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedParents = parents.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedParents.map((parent) => (
              <TableRow
                key={parent.parent_id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={(e) => {
                  // Prevent navigation if clicking on actions, the parent ID link, or other interactive elements
                  if (
                    e.target instanceof HTMLElement &&
                    (e.target.closest("button") ||
                      e.target.closest("a") ||
                      e.target.closest("[data-no-navigation]"))
                  ) {
                    return
                  }
                  router.push(`/admin/parents/${parent.parent_id}`)
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    {parent.avatar_url ? (
                      <AvatarIcon url={parent.avatar_url} size="medium" />
                    ) : (
                      <Avatar>
                        <AvatarFallback>
                          {parent.first_name[0]}
                          {parent.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">
                        {parent.first_name} {parent.last_name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{parent.gender}</TableCell>
                <TableCell>{parent.country}</TableCell>
                <TableCell>{parent.email}</TableCell>
                <TableCell>{parent.phone}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {studentData[parent.parent_id]?.map((student) => (
                      <Badge key={student.id} variant="outline">
                        {student.first_name} {student.last_name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={parent.status} />
                </TableCell>
                <TableCell>{new Date(parent.created_at).toLocaleDateString()}</TableCell>
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
                        <Link href={`/admin/parents/edit/${parent.parent_id}`}>
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
