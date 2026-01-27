"use client"

import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRight, ArrowUpDown } from "lucide-react"
import { useState } from "react"
import { TeacherPaymentType } from "@/types"
import { EmptyTableState } from "./empty-table-state"
import { DollarSign } from "lucide-react"

interface TeacherPaymentsTableProps {
    payments: TeacherPaymentType[]
}

type SortDirection = 'asc' | 'desc' | 'none'

type SortConfig = {
    key: string
    direction: SortDirection
}

type TeacherAggregate = {
    teacher_id: string
    teacher_name: string
    currency: string | null
    total_hours: number
    total_pending_amount: number
}

export function TeacherPaymentsTable({ payments }: TeacherPaymentsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'teacher', direction: 'none' })

    // Aggregate payments by teacher - only count pending payments for hours and amount
    const teacherAggregates = payments.reduce((acc, payment) => {
        const teacherId = payment.teacher?.teacher_id || ''
        const teacherName = payment.teacher
            ? `${payment.teacher.first_name} ${payment.teacher.last_name}`
            : 'Unknown Teacher'
        const currency = payment.teacher?.currency || null

        if (!acc[teacherId]) {
            acc[teacherId] = {
                teacher_id: teacherId,
                teacher_name: teacherName,
                currency: currency,
                total_hours: 0,
                total_pending_amount: 0
            }
        }

        // Only add hours and amount for pending payments
        if (payment.status === 'pending') {
            acc[teacherId].total_hours += payment.hours || 0
            acc[teacherId].total_pending_amount += payment.amount || 0
        }

        return acc
    }, {} as Record<string, TeacherAggregate>)

    // Convert to array - show all teachers with payments, even if they have no pending payments
    let aggregatedTeachers = Object.values(teacherAggregates)

    // Sort aggregated teachers
    if (sortConfig.direction !== 'none') {
        aggregatedTeachers = [...aggregatedTeachers].sort((a, b) => {
            if (sortConfig.key === 'teacher') {
                return sortConfig.direction === 'asc'
                    ? a.teacher_name.localeCompare(b.teacher_name)
                    : b.teacher_name.localeCompare(a.teacher_name)
            }
            if (sortConfig.key === 'hours') {
                return sortConfig.direction === 'asc'
                    ? a.total_hours - b.total_hours
                    : b.total_hours - a.total_hours
            }
            if (sortConfig.key === 'amount') {
                return sortConfig.direction === 'asc'
                    ? a.total_pending_amount - b.total_pending_amount
                    : b.total_pending_amount - a.total_pending_amount
            }
            return 0
        })
    }


    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current.key !== key) {
                return { key, direction: 'asc' }
            }

            // Cycle through sort directions: asc -> desc -> none -> asc
            const directions: SortDirection[] = ['asc', 'desc', 'none']
            const currentIndex = directions.indexOf(current.direction)
            const nextIndex = (currentIndex + 1) % directions.length

            return {
                key,
                direction: directions[nextIndex]
            }
        })
    }

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
        <TableHead
            className="h-10 px-3 font-semibold text-foreground/80 cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort(sortKey)}
        >
            <div className="flex items-center gap-1.5">
                {label}
                <ArrowUpDown className="h-3 w-3" />
                {sortConfig.key === sortKey && sortConfig.direction !== 'none' && (
                    <span className="text-xs text-muted-foreground">
                        ({sortConfig.direction === 'asc' ? '↑' : '↓'})
                    </span>
                )}
            </div>
        </TableHead>
    )

    return (
        <div className="space-y-4">
            {/* Table Container */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                                <SortableHeader label="Teacher" sortKey="teacher" />
                                <SortableHeader label="Total Hours" sortKey="hours" />
                                <SortableHeader label="Total Amount" sortKey="amount" />
                                <TableHead className="w-[50px] px-3"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aggregatedTeachers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24">
                                        <EmptyTableState
                                            icon={DollarSign}
                                            title="No teachers found"
                                            description="There are no teachers with payments to display."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                aggregatedTeachers.map((teacher, idx) => (
                                    <TableRow
                                        key={teacher.teacher_id || idx}
                                        className={`hover:bg-muted/30 transition-all duration-150 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                                    >
                                        {/* Teacher Name */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium">
                                                    {teacher.teacher_name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Total Hours */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">
                                                    {teacher.total_hours.toFixed(1)} h
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Total Pending Amount */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-sm text-green-600">
                                                    {teacher.total_pending_amount.toFixed(2)} {teacher.currency || ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Arrow Navigation */}
                                        <TableCell className="py-2 px-3">
                                            <Link
                                                href={`/admin/accounting/teacher-payments/${teacher.teacher_id}`}
                                                className="flex items-center justify-center"
                                            >
                                                <ArrowRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
