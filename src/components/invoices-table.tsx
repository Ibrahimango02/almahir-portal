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
import { Edit, MoreHorizontal, CheckCircle, Clock, AlertCircle, XCircle, ArrowUpDown } from "lucide-react"
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { format } from "date-fns"
import { InvoiceType } from "@/types"
import { updateInvoice } from "@/lib/put/put-invoices"

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

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-4 w-4" />
        {sortConfig.key === sortKey && sortConfig.direction !== 'none' && (
          <span className="text-xs text-muted-foreground">
            ({sortConfig.direction === 'asc' ? '↑' : '↓'})
          </span>
        )}
      </div>
    </TableHead>
  )

  return (
    <div>
      <div className="rounded-md border">
        <div className="flex justify-end p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSorting}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear Sorting
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader label="Invoice" sortKey="invoice_id" />
              <SortableHeader label="Student" sortKey="student" />
              <SortableHeader label="Amount" sortKey="amount" />
              <SortableHeader label="Date" sortKey="created_at" />
              <SortableHeader label="Due Date" sortKey="due_date" />
              <SortableHeader label="Status" sortKey="status" />
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow
                key={invoice.invoice_id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
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
                  router.push(`/admin/invoices/${invoice.invoice_id}`)
                }}
              >
                <TableCell>
                  <Link href={`/admin/invoices/${invoice.invoice_id}`} className="font-medium hover:underline">
                    {invoice.invoice_id}
                  </Link>
                </TableCell>
                <TableCell>{invoice.student.first_name} {invoice.student.last_name}</TableCell>
                <TableCell>{invoice.amount.toFixed(2)} {invoice.currency}</TableCell>
                <TableCell>{format(new Date(invoice.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>{format(new Date(invoice.due_date + 'T00:00:00'), "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={invoice.status} />
                </TableCell>
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
                        <Link href={`/admin/invoices/edit/${invoice.invoice_id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                      <DropdownMenuItem
                        data-status-update
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusUpdate(invoice.invoice_id, 'pending')
                        }}
                        disabled={updatingStatus === invoice.invoice_id || invoice.status === 'pending'}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Set Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-status-update
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusUpdate(invoice.invoice_id, 'paid')
                        }}
                        disabled={updatingStatus === invoice.invoice_id || invoice.status === 'paid'}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-status-update
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusUpdate(invoice.invoice_id, 'overdue')
                        }}
                        disabled={updatingStatus === invoice.invoice_id || invoice.status === 'overdue'}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Mark as Overdue
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        data-status-update
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusUpdate(invoice.invoice_id, 'cancelled')
                        }}
                        disabled={updatingStatus === invoice.invoice_id || invoice.status === 'cancelled'}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
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
      <div className="mt-4">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={totalItems}
        />
      </div>
    </div>
  )
}
