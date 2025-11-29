"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "./status-badge"
import { ProfileType } from "@/types"

import AvatarIcon from "@/components/avatar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TablePagination } from "./table-pagination"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { Mail, Phone, MapPin, MoreHorizontal, Lock } from "lucide-react"
import { EmptyTableState } from "./empty-table-state"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResetPasswordDialog } from "./reset-password-dialog"

interface ModeratorsTableProps {
    moderators: ProfileType[]
    loading?: boolean
}

export function ModeratorsTable({ moderators, loading }: ModeratorsTableProps) {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(100)
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
    const [selectedModerator, setSelectedModerator] = useState<{ id: string; name: string } | null>(null)

    // Group and sort moderators by status, then alphabetically by name
    const groupedModerators = useMemo(() => {
        // Define status order (priority order) - pending first
        const statusOrder = ['pending', 'active', 'inactive', 'suspended', 'archived'] as const

        // Group moderators by status
        const groups: Record<string, ProfileType[]> = {
            'pending': [],
            'active': [],
            'inactive': [],
            'suspended': [],
            'archived': [],
        }

        // Group moderators
        moderators.forEach(moderator => {
            const status = moderator.status?.toLowerCase() || 'inactive'
            if (groups[status]) {
                groups[status].push(moderator)
            } else {
                // If status doesn't match known statuses, add to inactive
                groups['inactive'].push(moderator)
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
                moderators: groups[status],
            }))
            .filter(group => group.moderators.length > 0)
    }, [moderators])

    // Flatten grouped moderators for pagination
    const allModerators = useMemo(() => {
        return groupedModerators.flatMap(group => group.moderators)
    }, [groupedModerators])

    // Pagination logic
    const totalItems = allModerators.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedModerators = useMemo(() => {
        return allModerators.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    }, [allModerators, currentPage, pageSize])

    // Get which groups are visible on current page
    const getVisibleGroups = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        let currentIndex = 0
        const visibleGroups: Array<{ status: string; moderators: ProfileType[]; startIndex: number }> = []

        for (const group of groupedModerators) {
            const groupStart = currentIndex
            const groupEnd = currentIndex + group.moderators.length

            if (groupEnd > startIndex && groupStart < endIndex) {
                const visibleStart = Math.max(0, startIndex - groupStart)
                const visibleEnd = Math.min(group.moderators.length, endIndex - groupStart)
                visibleGroups.push({
                    status: group.status,
                    moderators: group.moderators.slice(visibleStart, visibleEnd),
                    startIndex: groupStart + visibleStart,
                })
            }

            currentIndex = groupEnd
            if (currentIndex >= endIndex) break
        }

        return visibleGroups
    }, [groupedModerators, currentPage, pageSize])

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
                            <TableHead className="w-[50px] px-4"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedModerators.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24">
                                    <EmptyTableState
                                        icon={ShieldCheck}
                                        title="No moderators found"
                                        description="There are no moderators to display. Moderators will appear here once they are added to the system."
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            getVisibleGroups.map((group) => {
                                const groupTotalCount = groupedModerators.find(g => g.status === group.status)?.moderators.length || 0
                                return (
                                    <React.Fragment key={group.status}>
                                        {/* Group Header */}
                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b-2 border-border">
                                            <TableCell 
                                                colSpan={6} 
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
                                        {/* Group Moderators */}
                                        {group.moderators.map((moderator, moderatorIndex) => {
                                            const globalIndex = group.startIndex + moderatorIndex
                                            return (
                                                <TableRow
                                                    key={moderator.id}
                                                    style={globalIndex % 2 !== 0 ? { backgroundColor: 'rgba(220, 252, 231, 0.27)' } : { backgroundColor: 'transparent' }}
                                                    className="hover:bg-muted/100 transition-all duration-200 border-b border-border/30 cursor-pointer"
                                                    onClick={(e) => {
                                                        // Prevent navigation if clicking on actions or other interactive elements
                                                        if (
                                                            e.target instanceof HTMLElement &&
                                                            (e.target.closest("button") ||
                                                                e.target.closest("a") ||
                                                                e.target.closest("[data-no-navigation]"))
                                                        ) {
                                                            return
                                                        }
                                                        router.push(`/admin/moderators/${moderator.id}`)
                                                    }}
                                                >
                                                    {/* ID */}
                                                    <TableCell className="py-3 px-4">
                                                        <span className="text-sm font-semibold text-muted-foreground">
                                                            {globalIndex + 1}
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
                                                                <DropdownMenuItem
                                                                    className="cursor-pointer text-sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setSelectedModerator({
                                                                            id: moderator.id,
                                                                            name: `${moderator.first_name} ${moderator.last_name}`
                                                                        })
                                                                        setResetPasswordDialogOpen(true)
                                                                    }}
                                                                >
                                                                    <Lock className="mr-2 h-4 w-4" />
                                                                    Reset Password
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
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />

            {/* Reset Password Dialog */}
            {selectedModerator && (
                <ResetPasswordDialog
                    open={resetPasswordDialogOpen}
                    onOpenChange={setResetPasswordDialogOpen}
                    userId={selectedModerator.id}
                    userName={selectedModerator.name}
                />
            )}
        </div>
    )
} 