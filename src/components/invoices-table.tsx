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
import { Edit, MoreHorizontal, CheckCircle, Clock, AlertCircle, XCircle, ArrowUpDown, Receipt, User, DollarSign, Calendar, CalendarDays } from "lucide-react"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { format, parseISO } from "date-fns"
import { InvoiceType } from "@/types"
import { updateInvoice } from "@/lib/put/put-invoices"
import { convertStatusToPrefixedFormat } from "@/lib/utils"
import { getProfile } from "@/lib/get/get-profiles"

interface InvoicesTableProps {
  invoices: InvoiceType[]
  onStatusUpdate: () => void
}

type SortDirection = 'asc' | 'desc' | 'none'

type SortConfig = {
  key: string
  direction: SortDirection
}

export function InvoicesTable({ invoices, onStatusUpdate }: InvoicesTableProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'none' })
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

    if (sortConfig.key === 'student') {
      const aName = `${a.student.first_name} ${a.student.last_name}`
      const bName = `${b.student.first_name} ${b.student.last_name}`
      return sortConfig.direction === 'asc'
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName)
    }

    if (sortConfig.key === 'created_at' || sortConfig.key === 'due_date') {
      const aDate = new Date(a[sortConfig.key])
      const bDate = new Date(b[sortConfig.key])
      return sortConfig.direction === 'asc'
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime()
    }

    if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc'
        ? a.amount - b.amount
        : b.amount - a.amount
    }

    // Default string comparison for other fields
    const aValue = String(a[sortConfig.key as keyof InvoiceType])
    const bValue = String(b[sortConfig.key as keyof InvoiceType])
    return sortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue)
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

  const clearSorting = () => {
    setSortConfig({ key: 'created_at', direction: 'none' })
  }

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      setUpdatingStatus(invoiceId)
      const invoice = invoices.find(inv => inv.invoice_id === invoiceId)
      if (!invoice) return

      const invoiceData = {
        invoice_id: invoice.invoice_id,
        student_id: invoice.student.student_id,
        parent_id: invoice.parent.parent_id,
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        due_date: new Date(invoice.due_date),
        status: newStatus,
      }

      await updateInvoice(invoiceData)

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

  const getInvoiceDetailUrl = (invoiceId: string) => {
    if (!currentUserRole) return '/'
    return `/${currentUserRole}/invoices/${invoiceId}`
  }

  const getActionUrl = (action: 'edit', invoiceId: string) => {
    if (!currentUserRole) return '/'
    return `/${currentUserRole}/invoices/${action}/${invoiceId}`
  }

  const isAdmin = currentUserRole === 'admin'

  const SortableHeader = ({ label, sortKey, icon: Icon }: { label: string, sortKey: string, icon?: React.ComponentType<{ className?: string }> }) => (
    <TableHead
      className="h-10 px-3 font-semibold text-foreground/80 cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}
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
        <div className="flex justify-end p-3 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSorting}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Clear Sorting
          </Button>
        </div>
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                <SortableHeader label="Invoice" sortKey="invoice_id" icon={Receipt} />
                <SortableHeader label="Student" sortKey="student" icon={User} />
                <SortableHeader label="Amount" sortKey="amount" icon={DollarSign} />
                <SortableHeader label="Created" sortKey="created_at" icon={Calendar} />
                <SortableHeader label="Due Date" sortKey="due_date" icon={CalendarDays} />
                <TableHead className="h-10 px-3 font-semibold text-foreground/80 text-center">Status</TableHead>
                {isAdmin && <TableHead className="w-[50px] px-3"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice, index) => (
                <TableRow
                  key={invoice.invoice_id}
                  className={`hover:bg-muted/30 transition-all duration-150 cursor-pointer ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                  onClick={(e) => {
                    // Prevent navigation if clicking on actions, the invoice ID link, or status update items
                    if (
                      e.target instanceof HTMLElement &&
                      (e.target.closest("button") ||
                        e.target.closest("a") ||
                        e.target.closest("[data-no-navigation]") ||
                        e.target.closest("[data-status-update]"))
                    ) {
                      return
                    }
                    router.push(getInvoiceDetailUrl(invoice.invoice_id))
                  }}
                >
                  {/* Invoice Info */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <Link href={getInvoiceDetailUrl(invoice.invoice_id)} className="font-medium text-sm hover:underline">
                        {invoice.invoice_id}
                      </Link>
                    </div>
                  </TableCell>

                  {/* Student Info */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {invoice.student.first_name} {invoice.student.last_name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-green-600">
                        {invoice.amount.toFixed(2)} {invoice.currency}
                      </span>
                    </div>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">
                        {format(parseISO(invoice.created_at), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </TableCell>

                  {/* Due Date */}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">
                        {format(parseISO(invoice.due_date + 'T00:00:00'), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-2 px-3 text-center">
                    <div className="max-w-[100px] mx-auto">
                      <StatusBadge status={convertStatusToPrefixedFormat(invoice.status, 'invoice')} />
                    </div>
                  </TableCell>

                  {/* Actions - Only show for admin */}
                  {isAdmin && (
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
                              handleStatusUpdate(invoice.invoice_id, 'pending')
                            }}
                            disabled={updatingStatus === invoice.invoice_id || invoice.status === 'pending'}
                            className="cursor-pointer text-xs"
                          >
                            <Clock className="mr-2 h-3.5 w-3.5" />
                            Set Pending
                          </DropdownMenuItem>
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
                              handleStatusUpdate(invoice.invoice_id, 'overdue')
                            }}
                            disabled={updatingStatus === invoice.invoice_id || invoice.status === 'overdue'}
                            className="cursor-pointer text-xs"
                          >
                            <AlertCircle className="mr-2 h-3.5 w-3.5" />
                            Mark as Overdue
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
                  )}
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
