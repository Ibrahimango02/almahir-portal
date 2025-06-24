"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Edit, MoreHorizontal, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getParentStudents } from "@/lib/get/get-parents"
import { ParentType, StudentType } from "@/types"
import AvatarIcon from "./avatar"
import { format, parseISO } from "date-fns"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { getProfile } from "@/lib/get/get-profiles"

interface ParentsTableProps {
  parents: ParentType[]
  userRole?: 'admin' | 'teacher'
}

export function ParentsTable({ parents, userRole }: ParentsTableProps) {
  const router = useRouter()
  const [studentData, setStudentData] = useState<Record<string, StudentType[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const profile = await getProfile()
        setCurrentUserRole(profile.role)
      } catch (error) {
        console.error("Error fetching user role:", error)
        // Fallback to the passed userRole prop if available
        if (userRole) {
          setCurrentUserRole(userRole)
        }
      }
    }

    fetchUserRole()
  }, [userRole])

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

  const isAdmin = currentUserRole === 'admin'

  const getParentDetailUrl = (parentId: string) => {
    if (!currentUserRole) return '/'
    return `/${currentUserRole}/parents/${parentId}`
  }

  const getActionUrl = (action: 'edit', parentId: string) => {
    if (!currentUserRole) return '/'
    return `/${currentUserRole}/parents/${action}/${parentId}`
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Parent</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Contact</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Location</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Students</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Status</TableHead>
                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Joined</TableHead>
                {isAdmin && <TableHead className="w-[50px] px-3"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParents.map((parent, index) => (
                <TableRow
                  key={parent.parent_id}
                  className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
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
                    router.push(getParentDetailUrl(parent.parent_id))
                  }}
                >
                  {/* Parent Info */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-3">
                      {parent.avatar_url ? (
                        <AvatarIcon url={parent.avatar_url} size="medium" />
                      ) : (
                        <Avatar className="h-10 w-10 border border-primary/10">
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                            {parent.first_name[0]}
                            {parent.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">
                          {parent.first_name} {parent.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {parent.gender}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell className="py-2 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[120px]">{parent.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{parent.phone}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{parent.country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{parent.language}</p>
                  </TableCell>

                  {/* Students */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">
                        {studentData[parent.parent_id]?.length > 0
                          ? studentData[parent.parent_id].map(student =>
                            `${student.first_name} ${student.last_name}`
                          ).join(', ')
                          : 'None'
                        }
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2 px-3 text-center">
                    <div className="max-w-[100px] mx-auto">
                      <StatusBadge status={convertStatusToPrefixedFormat(parent.status, 'user')} />
                    </div>
                  </TableCell>

                  {/* Join Date */}
                  <TableCell className="py-2 px-3">
                    <div className="text-xs">
                      <p className="font-medium">
                        {format(parseISO(parent.created_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </TableCell>

                  {/* Actions - Only show for admin */}
                  {isAdmin && (
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
                            <Link href={getActionUrl('edit', parent.parent_id)} className="flex items-center">
                              <Edit className="mr-2 h-3.5 w-3.5" />
                              Edit Parent
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
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
