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
import { StudentInvoiceType } from "@/types"
import { getProfile } from "@/lib/get/get-profiles"
import { updateStudentInvoice } from "@/lib/put/put-student-invoices"
import { InvoicePaymentStatusBadge } from "./invoice-payment-status-badge"

// Function to convert month numbers to month names
const formatMonthRange = (monthRange: string): string => {
    if (!monthRange) return '-'

    const months = monthRange.split('-')
    if (months.length !== 2) return monthRange

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const startMonth = parseInt(months[0]) - 1 // Convert to 0-based index
    const endMonth = parseInt(months[1]) - 1

    if (isNaN(startMonth) || isNaN(endMonth) || startMonth < 0 || startMonth > 11 || endMonth < 0 || endMonth > 11) {
        return monthRange // Return original if invalid
    }

    const startName = monthNames[startMonth]
    const endName = monthNames[endMonth]

    return startMonth === endMonth ? startName : `${startName} - ${endName}`
}

interface StudentInvoicesTableProps {
    invoices: StudentInvoiceType[]
    onStatusUpdate: () => void
}

type SortDirection = 'asc' | 'desc' | 'none'

type SortConfig = {
    key: string
    direction: SortDirection
}

export function StudentInvoicesTable({ invoices, onStatusUpdate }: StudentInvoicesTableProps) {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'due_date', direction: 'none' })
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

    // Calculate pagination
    const totalItems = invoices.length
    const totalPages = Math.ceil(totalItems / pageSize)

    // Sort invoices
    const sortedInvoices = [...invoices].sort((a, b) => {
        if (sortConfig.direction === 'none') {
            return 0 // No sorting
        }

        if (sortConfig.key === 'amount') {
            const aAmount = a.subscription?.total_amount || 0
            const bAmount = b.subscription?.total_amount || 0
            return sortConfig.direction === 'asc'
                ? aAmount - bAmount
                : bAmount - aAmount
        }

        if (sortConfig.key === 'due_date') {
            const aDate = new Date(a.due_date)
            const bDate = new Date(b.due_date)
            return sortConfig.direction === 'asc'
                ? aDate.getTime() - bDate.getTime()
                : bDate.getTime() - aDate.getTime()
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

    const paginatedInvoices = sortedInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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



    const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
        try {
            setUpdatingStatus(invoiceId)

            // Find the invoice to get its current data
            const invoice = invoices.find(inv => inv.invoice_id === invoiceId)
            if (!invoice) {
                throw new Error('Invoice not found')
            }

            // Update the invoice status
            await updateStudentInvoice({
                id: invoiceId,
                student_subscription: invoice.student_subscription,
                months: invoice.months,
                issue_date: invoice.issue_date,
                due_date: invoice.due_date,
                paid_date: newStatus === 'paid' ? new Date().toISOString() : invoice.paid_date,
                status: newStatus
            })

            // Notify parent component to refresh data
            onStatusUpdate()

            // Refresh the page to get updated data
            router.refresh()
        } catch (err) {
            console.error('Error updating invoice status:', err)
        } finally {
            setUpdatingStatus(null)
        }
    }

    const getActionUrl = (action: 'edit', invoiceId: string) => {
        if (!currentUserRole) return '/'
        return `/${currentUserRole}/invoices/${action}/${invoiceId}`
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
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Student</TableHead>
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Parents</TableHead>
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80">Months</TableHead>
                                <SortableHeader label="Amount" sortKey="amount" />
                                <SortableHeader label="Due Date" sortKey="due_date" />
                                <SortableHeader label="Paid Date" sortKey="paid_date" />
                                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Status</TableHead>
                                <TableHead className="w-[50px] px-3"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedInvoices.map((invoice, idx) => (
                                <TableRow
                                    key={invoice.invoice_id || idx}
                                    className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                                        }`}
                                >


                                    {/* Student Info */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">
                                                {invoice.student ? `${invoice.student.first_name} ${invoice.student.last_name}` : 'Loading...'}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Parents */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">
                                                {invoice.parent ? `${invoice.parent.first_name} ${invoice.parent.last_name}` : 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Months */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">
                                                {formatMonthRange(invoice.months)}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Amount */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-sm text-green-600">
                                                {invoice.subscription?.total_amount?.toFixed(2) || '0.00'} CAD
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Due Date */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <span>
                                                {format(parseISO(invoice.due_date), "MMM dd, yyyy")}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Paid Date */}
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                            <span>
                                                {invoice.paid_date ? format(parseISO(invoice.paid_date), "MMM dd, yyyy") : "-"}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell className="py-2 px-3 text-center">
                                        <div className="max-w-[100px] mx-auto">
                                            <InvoicePaymentStatusBadge status={invoice.status} />
                                        </div>
                                    </TableCell>

                                    {/* Actions - Always show for admin */}
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
                                                    <Link href={getActionUrl('edit', invoice.invoice_id)} className="flex items-center">
                                                        <Edit className="mr-2 h-3.5 w-3.5" />
                                                        Edit Invoice
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel className="font-semibold text-xs">Update Status</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    data-status-update
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleStatusUpdate(invoice.invoice_id, 'paid')
                                                    }}
                                                    disabled={updatingStatus === invoice.invoice_id || invoice.status === 'paid'}
                                                    className="cursor-pointer text-xs"
                                                >
                                                    <CheckCircle className="mr-2 h-3.5 w-3.5" />
                                                    Mark as Paid
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    data-status-update
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleStatusUpdate(invoice.invoice_id, 'cancelled')
                                                    }}
                                                    disabled={updatingStatus === invoice.invoice_id || invoice.status === 'cancelled'}
                                                    className="cursor-pointer text-xs"
                                                >
                                                    <XCircle className="mr-2 h-3.5 w-3.5" />
                                                    Cancel Invoice
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
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={totalItems}
            />
        </div>
    )
} 