"use client"

import React from "react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Mail, Phone, MapPin, CalendarPlus } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { AdminType } from "@/types"
import Link from "next/link"

import AvatarIcon from "@/components/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { getTeacherClassCount } from "@/lib/get/get-classes"
import { EmptyTableState } from "./empty-table-state"
import { Shield } from "lucide-react"

interface AdminsTableProps {
    admins: AdminType[]
}

export function AdminsTable({ admins }: AdminsTableProps) {
    const router = useRouter()
    const [classCount, setClassCount] = useState<Record<string, number>>({})
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(100)

    // Filter out non-admins, only show admins
    const adminsOnly = useMemo(() => {
        return admins.filter(admin => admin.role === 'admin')
    }, [admins])

    // Group and sort admins by status, then alphabetically by name
    const groupedAdmins = useMemo(() => {
        // Define status order (priority order) - pending first
        const statusOrder = ['pending', 'active', 'inactive', 'suspended', 'archived'] as const

        // Group admins by status
        const groups: Record<string, AdminType[]> = {
            'pending': [],
            'active': [],
            'inactive': [],
            'suspended': [],
            'archived': [],
        }

        // Group admins
        adminsOnly.forEach(admin => {
            const status = admin.status?.toLowerCase() || 'inactive'
            if (groups[status]) {
                groups[status].push(admin)
            } else {
                // If status doesn't match known statuses, add to inactive
                groups['inactive'].push(admin)
            }
        })

        // Sort each group alphabetically
        Object.keys(groups).forEach(status => {
            groups[status].sort((a, b) => {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
                return nameA.localeCompare(nameB)
            })
        })

        // Return groups in explicit priority order (pending first)
        return statusOrder
            .map(status => ({
                status,
                admins: groups[status],
            }))
            .filter(group => group.admins.length > 0)
    }, [adminsOnly])

    // Flatten grouped admins for pagination
    const allAdmins = useMemo(() => {
        return groupedAdmins.flatMap(group => group.admins)
    }, [groupedAdmins])

    // Calculate pagination
    const totalItems = allAdmins.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedAdmins = useMemo(() => {
        return allAdmins.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    }, [allAdmins, currentPage, pageSize])

    // Get which groups are visible on current page
    const getVisibleGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        let currentIndex = 0
        const visibleGroups: Array<{ status: string; admins: AdminType[]; startIndex: number }> = []

        for (const group of groupedAdmins) {
            const groupStart = currentIndex
            const groupEnd = currentIndex + group.admins.length

            if (groupEnd > startIndex && groupStart < endIndex) {
                const visibleStart = Math.max(0, startIndex - groupStart)
                const visibleEnd = Math.min(group.admins.length, endIndex - groupStart)
                visibleGroups.push({
                    status: group.status,
                    admins: group.admins.slice(visibleStart, visibleEnd),
                    startIndex: groupStart + visibleStart,
                })
            }

            currentIndex = groupEnd
            if (currentIndex >= endIndex) break
        }

        return visibleGroups
    }, [groupedAdmins, currentPage, pageSize])

    useEffect(() => {
        const fetchClassCounts = async () => {
            if (paginatedAdmins.length === 0) return

            const counts: Record<string, number> = {}
            for (const admin of paginatedAdmins) {
                try {
                    const count = await getTeacherClassCount(admin.admin_id)
                    counts[admin.admin_id] = count ?? 0
                } catch (error) {
                    console.error(`Failed to fetch class count for admin ${admin.admin_id}:`, error)
                    counts[admin.admin_id] = 0
                }
            }
            setClassCount(counts)
        }

        fetchClassCounts()
    }, [paginatedAdmins])

    return (
        <div className="space-y-6">
            {/* Table Container */}
            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">ID</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Admin</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Contact</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Location</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide text-center">Classes</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide text-center">Status</TableHead>
                            <TableHead className="w-[50px] px-4"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedAdmins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24">
                                    <EmptyTableState
                                        icon={Shield}
                                        title="No admins found"
                                        description="There are no admins to display. Admins will appear here once they are added to the system."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            getVisibleGroups.map((group) => {
                                const groupTotalCount = groupedAdmins.find(g => g.status === group.status)?.admins.length || 0
                                return (
                                    <React.Fragment key={group.status}>
                                        {/* Group Header */}
                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2 border-border">
                                            <TableCell
                                                colSpan={7}
                                                className="py-3 px-4"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status={convertStatusToPrefixedFormat(group.status, 'user')} />
                                                    <span className="text-xs text-muted-foreground">
                                                        ({groupTotalCount})
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {/* Group Admins */}
                                        {group.admins.map((admin, adminIndex) => {
                                            const globalIndex = group.startIndex + adminIndex
                                            return (
                                                <TableRow
                                                    key={admin.admin_id}
                                                    style={globalIndex % 2 !== 0 ? { backgroundColor: 'rgba(220, 252, 231, 0.27)' } : { backgroundColor: 'transparent' }}
                                                    className="hover:bg-muted/100 transition-all duration-200 cursor-pointer border-b border-border/30"
                                                    onClick={(e) => {
                                                        // Prevent navigation if clicking on actions, the admin ID link, or other interactive elements
                                                        if (
                                                            e.target instanceof HTMLElement &&
                                                            (e.target.closest("button") ||
                                                                e.target.closest("a") ||
                                                                e.target.closest("[data-no-navigation]"))
                                                        ) {
                                                            return
                                                        }
                                                        router.push(`/admin/admins/${admin.admin_id}`)
                                                    }}
                                                >
                                                    {/* ID */}
                                                    <TableCell className="py-3 px-4">
                                                        <span className="text-sm font-semibold text-muted-foreground">
                                                            {globalIndex + 1}
                                                        </span>
                                                    </TableCell>
                                                    {/* Admin Info */}
                                                    <TableCell className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            {admin.avatar_url ? (
                                                                <AvatarIcon url={admin.avatar_url} size="medium" />
                                                            ) : (
                                                                <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                                                                    <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                                                                        {admin.first_name[0]}
                                                                        {admin.last_name[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            )}
                                                            <div className="space-y-0.5">
                                                                <p className="font-semibold text-sm text-foreground">
                                                                    {admin.first_name} {admin.last_name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground capitalize">
                                                                    {admin.gender || ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Contact Info */}
                                                    <TableCell className="py-3 px-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-sm">
                                                                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                                <span className="text-foreground/80">{admin.email || 'None'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-sm">
                                                                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                                <span className="text-foreground/80">{admin.phone || 'None'}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Location */}
                                                    <TableCell className="py-3 px-4">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className="text-sm text-foreground/80">{admin.country || 'None'}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground ml-5">{admin.language || 'None'}</p>
                                                        </div>
                                                    </TableCell>

                                                    {/* Classes Count */}
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <span className="font-semibold text-primary text-sm">
                                                                {classCount[admin.admin_id] || 0}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <div className="max-w-[100px] mx-auto">
                                                            <StatusBadge status={convertStatusToPrefixedFormat(admin.status, 'user')} />
                                                        </div>
                                                    </TableCell>

                                                    {/* Actions */}
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
                                                                <DropdownMenuItem asChild className="cursor-pointer text-sm">
                                                                    <Link href={`/admin/admins/assign-class/${admin.admin_id}`} className="flex items-center">
                                                                        <CalendarPlus className="mr-2 h-4 w-4" />
                                                                        Assign Class
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </React.Fragment>
                                )
                            })
                        )}
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