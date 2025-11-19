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
import { Edit, MoreHorizontal, CheckCircle, XCircle, ArrowUpDown } from "lucide-react"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { format, parseISO } from "date-fns"
import { TeacherPaymentType } from "@/types"
import { getProfile } from "@/lib/get/get-profiles"
import { InvoicePaymentStatusBadge } from "./invoice-payment-status-badge"
import { updateTeacherPayment, UpdateTeacherPaymentData } from "@/lib/put/put-teacher-payments"
import { EmptyTableState } from "./empty-table-state"
import { DollarSign } from "lucide-react"

// TeacherPaymentType now includes teacher and session data from the server

interface TeacherPaymentsTableProps {
    payments: TeacherPaymentType[]
    onStatusUpdate: () => void
}

type SortDirection = 'asc' | 'desc' | 'none'

type SortConfig = {
    key: string
    direction: SortDirection
}

export function TeacherPaymentsTable({ payments, onStatusUpdate }: TeacherPaymentsTableProps) {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'session', direction: 'none' })
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                const profile = await getProfile()
                setCurrentUserRole(profile.role)
            } catch (error) {
                console.error("Error fetching user role:", error)
            }
        }

        fetchUserRole()
    }, [])

    // No longer needed - data is fetched on the server side

    // Calculate pagination
    const totalItems = payments.length
    const totalPages = Math.ceil(totalItems / pageSize)

    // Sort payments
    const sortedPayments = [...payments].sort((a, b) => {
        if (sortConfig.direction === 'none') {
            return 0 // No sorting
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

    const paginatedPayments = sortedPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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

    const getActionUrl = (action: 'edit', paymentId: string) => {
        if (!currentUserRole) return '/'
        if (currentUserRole === 'admin') {
            return `/admin/accounting/edit-payment/${paymentId}`
        }
        return `/${currentUserRole}/payments/${action}/${paymentId}`
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
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Teacher</TableHead>
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Class</TableHead>
                                <SortableHeader label="Session" sortKey="session" />
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Hours</TableHead>
                                <SortableHeader label="Amount" sortKey="amount" />
                                <SortableHeader label="Paid Date" sortKey="paid_date" />
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Status</TableHead>
                                {currentUserRole === 'admin' && (
                                    <TableHead className="w-[50px] px-3"></TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={currentUserRole === 'admin' ? 8 : 7} className="h-24">
                                        <EmptyTableState
                                            icon={DollarSign}
                                            title="No payments found"
                                            description="There are no payments to display. Payments will appear here once they are created."
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPayments.map((payment, idx) => (
                                <TableRow
                                    key={payment.payment_id || idx}
                                    className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                                >
                                    {/* Teacher Name */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">
                                                {payment.teacher ? `${payment.teacher.first_name} ${payment.teacher.last_name}` : 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
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
                                                {payment.amount.toFixed(2)} CAD
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
                                    {currentUserRole === 'admin' && (
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
                                    )}
                                </TableRow>
                            ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={totalItems}
            />
        </div>
    )
} 