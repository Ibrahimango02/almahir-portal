"use client"

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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Mail, Phone, MapPin, CalendarPlus } from "lucide-react"
import { useState, useEffect } from "react"
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

    // Filter out non-admins, only show admins and sort alphabetically
    const adminsOnly = admins
        .filter(admin => admin.role === 'admin')
        .sort((a, b) => {
            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
            return nameA.localeCompare(nameB)
        })

    useEffect(() => {
        const fetchClassCounts = async () => {
            const counts: Record<string, number> = {}
            for (const admin of adminsOnly) {
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

        if (adminsOnly.length > 0) {
            fetchClassCounts()
        }
    }, [adminsOnly])

    // Calculate pagination
    const totalItems = adminsOnly.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedAdmins = adminsOnly.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
                            paginatedAdmins.map((admin, index) => (
                            <TableRow
                                key={admin.admin_id}
                                style={index % 2 !== 0 ? { backgroundColor: 'rgba(220, 252, 231, 0.27)' } : { backgroundColor: 'transparent' }}
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
                                        {(currentPage - 1) * pageSize + index + 1}
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
                        ))
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