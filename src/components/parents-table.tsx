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
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getParents, getParentStudents } from "@/lib/get-parents"

const parents = await getParents()

export function ParentsTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
                  <Link href={`/admin/parents/${parent.parent_id}`} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {parent.first_name[0]}
                        {parent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{parent.first_name} {parent.last_name}</p>
                    </div>
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
                      {(async () => {
                        const students = await getParentStudents(parent.parent_id)
                        return students?.map((student) => (
                          <Badge key={student.id} variant="outline">
                            {student.first_name} {student.last_name}
                          </Badge>
                        ))
                      })()}
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
                        <Link href={`/admin/parents/${parent.parent_id}/edit`}>
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
