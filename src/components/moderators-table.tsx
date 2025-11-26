"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import { ProfileType } from "@/types"

import AvatarIcon from "@/components/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TablePagination } from "./table-pagination"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { Mail, Phone, MapPin } from "lucide-react"
import { EmptyTableState } from "./empty-table-state"
import { ShieldCheck } from "lucide-react"

interface ModeratorsTableProps {
    moderators: ProfileType[]
    loading?: boolean
}

export function ModeratorsTable({ moderators, loading }: ModeratorsTableProps) {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(100)

    // Sort moderators alphabetically by name
    const sortedModerators = [...moderators].sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase()
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase()
        return nameA.localeCompare(nameB)
    })

    // Pagination logic
    const totalItems = sortedModerators.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedModerators = sortedModerators.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">ID</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Moderator</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Contact</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide">Location</TableHead>
                            <TableHead className="h-11 px-4 font-semibold text-foreground/90 text-sm tracking-wide text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedModerators.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24">
                                    <EmptyTableState
                                        icon={ShieldCheck}
                                        title="No moderators found"
                                        description="There are no moderators to display. Moderators will appear here once they are added to the system."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedModerators.map((moderator, index) => (
                            <TableRow
                                key={moderator.id}
                                style={index % 2 !== 0 ? { backgroundColor: 'rgba(220, 252, 231, 0.27)' } : { backgroundColor: 'transparent' }}
                                className="hover:bg-muted/100 transition-all duration-200 border-b border-border/30 cursor-pointer"
                                onClick={() => router.push(`/admin/moderators/${moderator.id}`)}
                            >
                                {/* ID */}
                                <TableCell className="py-3 px-4">
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {(currentPage - 1) * pageSize + index + 1}
                                    </span>
                                </TableCell>
                                {/* Moderator Info */}
                                <TableCell className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        {moderator.avatar_url ? (
                                            <AvatarIcon url={moderator.avatar_url} size="medium" />
                                        ) : (
                                            <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                                                <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                                                    {moderator.first_name?.[0]}
                                                    {moderator.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-sm text-foreground">
                                                {moderator.first_name} {moderator.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {moderator.gender || ''}
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                                {/* Contact Info */}
                                <TableCell className="py-3 px-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-foreground/80">{moderator.email || 'None'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-foreground/80">{moderator.phone || 'None'}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                {/* Location */}
                                <TableCell className="py-3 px-4">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm text-foreground/80">{moderator.country || 'None'}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground ml-5">{moderator.language || 'None'}</p>
                                    </div>
                                </TableCell>
                                {/* Status */}
                                <TableCell className="py-3 px-4 text-center">
                                    <div className="max-w-[100px] mx-auto">
                                        <StatusBadge status={convertStatusToPrefixedFormat(moderator.status, 'user')} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                        )}
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