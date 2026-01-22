"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Edit, MoreHorizontal, CheckCircle, XCircle, ArrowUpDown, CheckCheck } from "lucide-react"
import { useState } from "react"
import { format, parseISO } from "date-fns"
import { TeacherPaymentType } from "@/types"
import { InvoicePaymentStatusBadge } from "./invoice-payment-status-badge"
import { updateTeacherPayment, UpdateTeacherPaymentData } from "@/lib/put/put-teacher-payments"
import { EmptyTableState } from "./empty-table-state"
import { DollarSign } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface TeacherPaymentSessionsTableProps {
    payments: TeacherPaymentType[]
    onStatusUpdate: () => void
}

type SortDirection = 'asc' | 'desc' | 'none'

type SortConfig = {
    key: string
    direction: SortDirection
}

export function TeacherPaymentSessionsTable({ payments, onStatusUpdate }: TeacherPaymentSessionsTableProps) {
    const router = useRouter()
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
    const [updatingAll, setUpdatingAll] = useState(false)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'session', direction: 'none' })

    // Helper function to get status priority (lower number = higher priority)
    const getStatusPriority = (status: string): number => {
        switch (status.toLowerCase()) {
            case 'overdue': return 0
            case 'pending': return 1
            case 'paid': return 2
            case 'cancelled': return 3
            default: return 4
        }
    }

    // Sort payments
    const sortedPayments = [...payments].sort((a, b) => {
        // First, sort by status priority (overdue > pending > paid > cancelled)
        const aStatusPriority = getStatusPriority(a.status)
        const bStatusPriority = getStatusPriority(b.status)
        if (aStatusPriority !== bStatusPriority) {
            return aStatusPriority - bStatusPriority
        }

        // If statuses are the same, apply user-selected sort
        if (sortConfig.direction === 'none') {
            return 0 // No additional sorting
        }

        if (sortConfig.key === 'session') {
            const aDate = a.session ? new Date(a.session.start_date) : new Date(0)
            const bDate = b.session ? new Date(b.session.start_date) : new Date(0)
            return sortConfig.direction === 'asc'
                ? aDate.getTime() - bDate.getTime()
                : bDate.getTime() - aDate.getTime()
        }

        if (sortConfig.key === 'amount') {
            return sortConfig.direction === 'asc'
                ? a.amount - b.amount
                : b.amount - a.amount
        }

        if (sortConfig.key === 'paid_date') {
            const aDate = a.paid_date ? new Date(a.paid_date) : new Date(0)
            const bDate = b.paid_date ? new Date(b.paid_date) : new Date(0)
            return sortConfig.direction === 'asc'
                ? aDate.getTime() - bDate.getTime()
                : bDate.getTime() - aDate.getTime()
        }

        return 0 // No sorting for other columns
    })

    // Calculate totals from all payments passed to the component
    // The parent component already filters by status, so we calculate totals for what's displayed
    const totalHours = payments.reduce((sum, payment) => sum + (payment.hours || 0), 0)
    const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const firstPaymentCurrency = payments.length > 0 && payments[0].teacher?.currency ? payments[0].teacher.currency : ''

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

    const handleStatusUpdate = async (paymentId: string, newStatus: string) => {
        try {
            setUpdatingStatus(paymentId)

            const updateData: UpdateTeacherPaymentData = { id: paymentId, status: newStatus }

            // Set paid_date when status is changed to 'paid'
            if (newStatus === 'paid') {
                updateData.paid_date = new Date().toISOString()
            }

            await updateTeacherPayment(updateData)
            onStatusUpdate()
            router.refresh()
        } catch (err) {
            console.error('Error updating payment status:', err)
        } finally {
            setUpdatingStatus(null)
        }
    }

    const handleMarkAllAsPaid = async () => {
        // Get all pending and overdue payments
        const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue')

        if (pendingPayments.length === 0) {
            return
        }

        try {
            setUpdatingAll(true)
            const paidDate = new Date().toISOString()

            // Update all pending payments in parallel
            await Promise.all(
                pendingPayments.map(payment =>
                    updateTeacherPayment({
                        id: payment.payment_id,
                        status: 'paid',
                        paid_date: paidDate
                    })
                )
            )

            onStatusUpdate()
            router.refresh()
        } catch (err) {
            console.error('Error updating all payments:', err)
        } finally {
            setUpdatingAll(false)
        }
    }

    // Check if all payments are pending/overdue (to show the "Mark All as Paid" button)
    const allPaymentsArePending = payments.length > 0 && payments.every(p => p.status === 'pending' || p.status === 'overdue')

    const getActionUrl = (action: 'edit', paymentId: string) => {
        return `/admin/accounting/edit-payment/${paymentId}`
    }

    const handleRowClick = async (sessionId: string, e: React.MouseEvent) => {
        // Don't navigate if clicking on interactive elements
        const target = e.target as HTMLElement
        if (
            target.closest('[data-no-navigation]') ||
            target.closest('[data-status-update]') ||
            target.closest('a') ||
            target.closest('button') ||
            target.closest('[role="menuitem"]')
        ) {
            return
        }

        try {
            // Fetch class_id from session_id
            const supabase = createClient()
            const { data, error } = await supabase
                .from('class_sessions')
                .select('class_id')
                .eq('id', sessionId)
                .single()

            if (error || !data) {
                console.error('Error fetching class_id:', error)
                return
            }

            // Navigate to session details page
            router.push(`/admin/classes/${data.class_id}/${sessionId}`)
        } catch (err) {
            console.error('Error navigating to session:', err)
        }
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
            {/* Mark All as Paid Button - Only show if all payments are pending */}
            {allPaymentsArePending && (
                <div className="flex justify-end">
                    <Button
                        onClick={handleMarkAllAsPaid}
                        disabled={updatingAll}
                        size="sm"
                        style={{ backgroundColor: "#3d8f5b", color: "white" }}
                    >
                        <CheckCheck className="mr-2 h-3.5 w-3.5" />
                        {updatingAll ? 'Updating...' : 'Mark All as Paid'}
                    </Button>
                </div>
            )}

            {/* Table Container */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Class</TableHead>
                                <SortableHeader label="Session" sortKey="session" />
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Hours</TableHead>
                                <SortableHeader label="Amount" sortKey="amount" />
                                <SortableHeader label="Paid Date" sortKey="paid_date" />
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Status</TableHead>
                                <TableHead className="w-[50px] px-3"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24">
                                        <EmptyTableState
                                            icon={DollarSign}
                                            title="No payments found"
                                            description="There are no payments to display for this teacher."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedPayments.map((payment, idx) => (
                                    <TableRow
                                        key={payment.payment_id || idx}
                                        className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                                        onClick={(e) => payment.session?.session_id && handleRowClick(payment.session.session_id, e)}
                                    >
                                        {/* Class Title */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">
                                                    {payment.session?.class_title || 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Session Date */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">
                                                    {payment.session ? format(parseISO(payment.session.start_date), "MMM dd, yyyy") : 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Hours */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm">
                                                    {payment.hours} h
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Amount */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-sm text-green-600">
                                                    {payment.amount.toFixed(2)} {payment.teacher.currency || ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Paid Date */}
                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center gap-1.5">
                                                <span>
                                                    {payment.paid_date ? format(parseISO(payment.paid_date), "MMM dd, yyyy") : "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        {/* Status */}
                                        <TableCell className="py-2 px-3 text-center">
                                            <div className="max-w-[100px] mx-auto">
                                                <InvoicePaymentStatusBadge status={payment.status} />
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
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel className="font-semibold text-xs">Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild className="cursor-pointer text-xs">
                                                        <Link href={getActionUrl('edit', payment.payment_id)} className="flex items-center">
                                                            <Edit className="mr-2 h-3.5 w-3.5" />
                                                            Edit Payment
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel className="font-semibold text-xs">Update Status</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        data-status-update
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleStatusUpdate(payment.payment_id, 'paid')
                                                        }}
                                                        disabled={updatingStatus === payment.payment_id || payment.status === 'paid'}
                                                        className="cursor-pointer text-xs"
                                                    >
                                                        <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                                        Mark as Paid
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        data-status-update
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleStatusUpdate(payment.payment_id, 'cancelled')
                                                        }}
                                                        disabled={updatingStatus === payment.payment_id || payment.status === 'cancelled'}
                                                        className="cursor-pointer text-xs"
                                                    >
                                                        <XCircle className="mr-2 h-3.5 w-3.5" />
                                                        Cancel Payment
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>

                        {sortedPayments.length > 0 && (
                            <tfoot>
                                <TableRow className="bg-muted/60 border-t-2 border-t-foreground/20 font-semibold">
                                    <TableCell colSpan={2} className="py-3 px-3 text-right">
                                        <span className="text-sm font-semibold">Total</span>
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        <span className="text-sm font-semibold">
                                            {totalHours.toFixed(1)} h
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        <span className="text-sm font-semibold text-green-600">
                                            {totalAmount.toFixed(2)} {firstPaymentCurrency}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        {/* Paid Date column - empty in footer */}
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        {/* Status column - empty in footer */}
                                    </TableCell>
                                    <TableCell className="py-3 px-3">
                                        {/* Actions column - empty in footer */}
                                    </TableCell>
                                </TableRow>
                            </tfoot>
                        )}
                    </Table>
                </div>
            </div>
        </div>
    )
}

