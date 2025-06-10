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
import { Edit, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { AdminType } from "@/types"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import AvatarIcon from "@/components/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


interface AdminsTableProps {
    admins: AdminType[]
}

export function AdminsTable({ admins }: AdminsTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Calculate pagination
    const totalItems = admins.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedAdmins = admins.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Join Date</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedAdmins.map((admin) => (
                            <TableRow
                                key={admin.admin_id}
                                className="hover:bg-muted/50 transition-colors"
                            >
                                <TableCell>
                                    <Link
                                        href={`/admin/admins/${admin.admin_id}`}
                                        className="flex items-center gap-3"
                                    >
                                        {admin.avatar_url ? (
                                            <AvatarIcon url={admin.avatar_url} size="medium" />
                                        ) : (
                                            <Avatar>
                                                <AvatarFallback>
                                                    {admin.first_name[0]}
                                                    {admin.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {admin.first_name} {admin.last_name}
                                            </p>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/admin/admins/${admin.admin_id}`}>
                                        {admin.gender}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/admin/admins/${admin.admin_id}`}>
                                        {admin.email}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/admin/admins/${admin.admin_id}`}>
                                        {admin.phone}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Link href={`/admin/admins/${admin.admin_id}`}>
                                        <StatusBadge status={admin.status} />
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/admin/admins/${admin.admin_id}`}>
                                        {format(parseISO(admin.created_at), "yyyy-MM-dd")}
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
                                                <Link href={`/admin/admins/edit/${admin.admin_id}`}>
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