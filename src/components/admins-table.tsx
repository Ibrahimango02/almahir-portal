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
import { Edit, MoreHorizontal, Mail, Phone, User, MapPin } from "lucide-react"
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { AdminType } from "@/types"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import AvatarIcon from "@/components/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { convertStatusToPrefixedFormat } from "@/lib/utils"

interface AdminsTableProps {
    admins: AdminType[]
}

export function AdminsTable({ admins }: AdminsTableProps) {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Calculate pagination
    const totalItems = admins.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedAdmins = admins.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div className="space-y-4">
            {/* Table Container */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[180px]">Admin</TableHead>
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[200px]">Contact</TableHead>
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[140px]">Location</TableHead>
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 text-center w-[200px]">Status</TableHead>
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[120px]">Joined</TableHead>
                                <TableHead className="w-[50px] px-4"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedAdmins.map((admin, index) => (
                                <TableRow
                                    key={admin.admin_id}
                                    className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                        }`}
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
                                    {/* Admin Info */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-3">
                                            {admin.avatar_url ? (
                                                <AvatarIcon url={admin.avatar_url} size="medium" />
                                            ) : (
                                                <Avatar className="h-10 w-10 border border-primary/10">
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                                                        {admin.first_name[0]}
                                                        {admin.last_name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className="space-y-0.5">
                                                <p className="font-medium text-sm">
                                                    {admin.first_name} {admin.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {admin.gender}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Contact Info */}
                                    <TableCell className="py-2 px-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-muted-foreground max-w-[120px]">{admin.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-muted-foreground">{admin.phone}</span>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Location */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs">{admin.country}</span>
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell className="py-2 px-3 text-center">
                                        <div className="max-w-[100px] mx-auto">
                                            <StatusBadge status={convertStatusToPrefixedFormat(admin.status, 'user')} />
                                        </div>
                                    </TableCell>

                                    {/* Join Date */}
                                    <TableCell className="py-2 px-3">
                                        <div className="text-xs">
                                            <p className="font-medium">
                                                {format(parseISO(admin.created_at), "MMM dd, yyyy")}
                                            </p>
                                        </div>
                                    </TableCell>

                                    {/* Actions */}
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
                                                    <Link href={`/admin/admins/edit/${admin.admin_id}`} className="flex items-center">
                                                        <Edit className="mr-2 h-3.5 w-3.5" />
                                                        Edit Admin
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