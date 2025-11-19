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
import { useState, useEffect, useMemo } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getAllParentStudents } from "@/lib/get/get-parents"
import { ParentType, StudentType } from "@/types"
import AvatarIcon from "./avatar"

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
  const [pageSize, setPageSize] = useState(100)
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

  // Sort parents alphabetically by name
  const sortedParents = useMemo(() => {
    return [...parents].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }, [parents])

  // Calculate pagination
  const totalItems = sortedParents.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedParents = useMemo(() => {
    return sortedParents.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [sortedParents, currentPage, pageSize])

  useEffect(() => {
    const fetchStudentData = async () => {
      if (paginatedParents.length === 0) return

      try {
        // Only fetch student data for the current page of parents
        const parentIds = paginatedParents.map(p => p.parent_id)
        const studentResults = await getAllParentStudents(parentIds)
        setStudentData(studentResults)
      } catch (error) {
        console.error('Failed to fetch student data:', error)
        // Initialize with empty arrays for current page parents
        const emptyStudentData = paginatedParents.reduce((acc, parent) => {
          acc[parent.parent_id] = []
          return acc
        }, {} as Record<string, StudentType[]>)
        setStudentData(emptyStudentData)
      }
    }

    fetchStudentData()
  }, [paginatedParents])

  const isAdmin = currentUserRole === 'admin'

  const getParentDetailUrl = (parentId: string) => {
    if (!currentUserRole) return '/'
    if (currentUserRole === 'moderator') return `/admin/parents/${parentId}`
    return `/${currentUserRole}/parents/${parentId}`
  }

  const getActionUrl = (action: 'edit', parentId: string) => {
    if (!currentUserRole) return '/'
    return `/${currentUserRole}/parents/${action}/${parentId}`
  }

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">ID</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Parent</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Contact</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Location</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Students</TableHead>
              <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide text-center">Status</TableHead>
              {isAdmin && <TableHead className="w-[50px] px-4"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedParents.map((parent, index) => (
              <TableRow
                key={parent.parent_id}
                className="hover:bg-muted/100 transition-all duration-200 cursor-pointer border-b border-border/30"
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
                {/* ID */}
                <TableCell className="py-3 px-4">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {(currentPage - 1) * pageSize + index + 1}
                  </span>
                </TableCell>
                {/* Parent Info */}
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {parent.avatar_url ? (
                      <AvatarIcon url={parent.avatar_url} size="medium" />
                    ) : (
                      <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                        <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                          {parent.first_name[0]}
                          {parent.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-foreground">
                        {parent.first_name} {parent.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {parent.gender || ''}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Contact Info */}
                <TableCell className="py-3 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground/80">{parent.email || 'None'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground/80">{parent.phone || 'None'}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell className="py-3 px-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground/80">{parent.country || 'None'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">{parent.language || 'None'}</p>
                  </div>
                </TableCell>

                {/* Students */}
                <TableCell className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-foreground/80">
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
                <TableCell className="py-3 px-4 text-center">
                  <div className="max-w-[100px] mx-auto">
                    <StatusBadge status={convertStatusToPrefixedFormat(parent.status, 'user')} />
                  </div>
                </TableCell>

                {/* Actions - Only show for admin */}
                {isAdmin && (
                  <TableCell data-no-navigation className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="font-semibold text-xs">Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {/* Only show edit for admin */}
                        {isAdmin && (
                          <DropdownMenuItem asChild className="cursor-pointer text-sm">
                            <Link href={getActionUrl('edit', parent.parent_id)} className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Parent
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
