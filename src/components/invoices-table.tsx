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
import { Edit, MoreHorizontal } from "lucide-react"
import { useState, useEffect } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { format } from "date-fns"
import { getInvoices } from "@/lib/get/get-invoices"
import { InvoiceType } from "@/types"

export function InvoicesTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [invoices, setInvoices] = useState<InvoiceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true)
        const data = await getInvoices()
        setInvoices(data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch invoices')
        console.error('Error fetching invoices:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  // Calculate pagination
  const totalItems = invoices.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedInvoices = invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
              <TableHead>Due Date</TableHead>
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
                  // Prevent navigation if clicking on actions or the invoice ID link
                  if (
                    e.target instanceof HTMLElement &&
                    (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-no-navigation]"))
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
                <TableCell>{format(new Date(invoice.due_date), "dd/MM/yyyy")}</TableCell>
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
                        <Link href={`/admin/invoices/${invoice.invoice_id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
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
