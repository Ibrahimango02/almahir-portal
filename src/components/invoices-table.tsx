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
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { format } from "date-fns"
import { getInvoices } from "@/lib/get/get-invoices"
import { InvoiceType } from "@/types"
import { updateInvoice } from "@/lib/put/put-invoices"

export function InvoicesTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [invoices, setInvoices] = useState<InvoiceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const checkAndUpdateOverdueInvoices = async (invoices: InvoiceType[]) => {
    const currentDate = new Date()
    const overdueInvoices = invoices.filter(invoice => {
      const dueDate = new Date(invoice.due_date + 'T00:00:00')
      return invoice.status === 'pending' && dueDate < currentDate
    })

    // Update each overdue invoice
    for (const invoice of overdueInvoices) {
      await handleStatusUpdate(invoice.invoice_id, 'overdue')
    }
  }

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true)
        const data = await getInvoices()
        // Sort invoices by due date
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.due_date + 'T00:00:00').getTime()
          const dateB = new Date(b.due_date + 'T00:00:00').getTime()
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })
        setInvoices(sortedData)
        // Check and update overdue invoices
        await checkAndUpdateOverdueInvoices(sortedData)
        setError(null)
      } catch (err) {
        setError('Failed to fetch invoices')
        console.error('Error fetching invoices:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [sortOrder])

  // Calculate pagination
  const totalItems = invoices.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedInvoices = invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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

      // Update the local state
      setInvoices(invoices.map(inv =>
        inv.invoice_id === invoiceId
          ? { ...inv, status: newStatus }
          : inv
      ))
    } catch (err) {
      console.error('Error updating invoice status:', err)
      setError('Failed to update invoice status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading invoices...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[120px] text-left">
                <Button
                  variant="ghost"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 h-8 px-2 justify-start"
                >
                  Due Date
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
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
