"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import { ProfileType } from "@/types"

import AvatarIcon from "@/components/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TablePagination } from "./table-pagination"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { Mail, Phone, MapPin } from "lucide-react"

interface ModeratorsTableProps {
    moderators: ProfileType[]
    loading?: boolean
}

export function ModeratorsTable({ moderators, loading }: ModeratorsTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Pagination logic
    const totalItems = moderators.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedModerators = moderators.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[230px]">Moderator</TableHead>
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[250px]">Contact</TableHead>
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 w-[150px]">Location</TableHead>
                                <TableHead className="h-12 px-4 font-semibold text-foreground/80 text-center w-[150px]">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedModerators.map((moderator, index) => (
                                <TableRow
                                    key={moderator.id}
                                    className={`hover:bg-muted/30 transition-all duration-150 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                                >
                                    {/* Moderator Info */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-3">
                                            {moderator.avatar_url ? (
                                                <AvatarIcon url={moderator.avatar_url} size="medium" />
                                            ) : (
                                                <Avatar className="h-10 w-10 border border-primary/10">
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                                                        {moderator.first_name?.[0]}
                                                        {moderator.last_name?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className="space-y-0.5">
                                                <p className="font-medium text-sm">
                                                    {moderator.first_name} {moderator.last_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {moderator.gender}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    {/* Contact Info */}
                                    <TableCell className="py-2 px-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span>{moderator.email || 'None'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span>{moderator.phone || 'None'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    {/* Location */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs">{moderator.country || 'None'}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{moderator.language}</p>
                                    </TableCell>
                                    {/* Status */}
                                    <TableCell className="py-2 px-3 text-center">
                                        <div className="max-w-[100px] mx-auto">
                                            <StatusBadge status={convertStatusToPrefixedFormat(moderator.status, 'user')} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
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