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
import { useRouter } from "next/navigation"


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
                                className="hover:bg-muted/50 transition-colors cursor-pointer"
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
                                <TableCell>
                                    <div className="flex items-center gap-3">
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
                                    </div>
                                </TableCell>
                                <TableCell>{admin.gender}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>{admin.phone}</TableCell>
                                <TableCell className="text-center">
                                    <StatusBadge status={admin.status} />
                                </TableCell>
                                <TableCell>{format(parseISO(admin.created_at), "yyyy-MM-dd")}</TableCell>
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