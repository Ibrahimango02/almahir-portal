"use client"

import type React from "react"

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
import { getParents, getParentStudents } from "@/lib/get/get-parents"
import { ParentType } from "@/types"
import AvatarIcon from "./avatar"

// Define type for student data
type StudentType = {
  id: string;
  first_name: string;
  last_name: string;
}

export function ParentsTable() {
  const [parents, setParents] = useState<ParentType[]>([])
  const [studentData, setStudentData] = useState<Record<string, StudentType[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const data = await getParents()
        setParents(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch parents:", error)
        setLoading(false)
      }
    }

    fetchParents()
  }, [])

  useEffect(() => {
    const fetchStudentData = async () => {
      const studentResults: Record<string, StudentType[]> = {}

      for (const parent of parents) {
        try {
          const students = await getParentStudents(parent.parent_id)
          studentResults[parent.parent_id] = students || []
        } catch (error) {
          console.error(`Failed to fetch students for parent ${parent.parent_id}:`, error)
          studentResults[parent.parent_id] = []
        }
      }

      setStudentData(studentResults)
    }

    if (parents.length > 0) {
      fetchStudentData()
    }
  }, [parents])

  // Calculate pagination
  const totalItems = parents.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedParents = parents.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (loading) {
    return <div>Loading parents...</div>
  }

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
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell>
                  <Link
                    href={`/admin/parents/${parent.parent_id}`}
                    className="flex items-center gap-3"
                  >
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
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/parents/${parent.parent_id}`}>
                    {parent.gender}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/parents/${parent.parent_id}`}>
                    {parent.country}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/parents/${parent.parent_id}`}>
                    {parent.email}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/parents/${parent.parent_id}`}>
                    {parent.phone}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/parents/${parent.parent_id}`}>
                    <div className="flex flex-wrap gap-1">
                      {studentData[parent.parent_id]?.map((student) => (
                        <Badge key={student.id} variant="outline">
                          {student.first_name} {student.last_name}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/admin/parents/${parent.parent_id}`}>
                    <StatusBadge status={parent.status} />
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/parents/${parent.parent_id}`}>
                    {new Date(parent.created_at).toLocaleDateString()}
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
