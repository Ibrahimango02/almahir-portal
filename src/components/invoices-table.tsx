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
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { format } from "date-fns"

const invoices = [
  {
    id: "INV-001",
    parent: "John Smith",
    student: "Emma Smith",
    amount: 250.0,
    status: "paid",
    date: "2023-03-15",
    dueDate: "2023-04-15",
    items: ["Mathematics Tuition", "Physics Tuition"],
  },
  {
    id: "INV-002",
    parent: "Maria Garcia",
    student: "Sophia Garcia",
    amount: 175.0,
    status: "pending",
    date: "2023-03-20",
    dueDate: "2023-04-20",
    items: ["Chemistry Tuition", "Spanish Tuition"],
  },
  {
    id: "INV-003",
    parent: "James Johnson",
    student: "William Johnson",
    amount: 300.0,
    status: "paid",
    date: "2023-03-10",
    dueDate: "2023-04-10",
    items: ["Physics Tuition", "Computer Science Tuition", "English Tuition"],
  },
  {
    id: "INV-004",
    parent: "Patricia Brown",
    student: "Ava Brown",
    amount: 200.0,
    status: "overdue",
    date: "2023-02-15",
    dueDate: "2023-03-15",
    items: ["Biology Tuition", "English Tuition"],
  },
  {
    id: "INV-005",
    parent: "John Smith",
    student: "Noah Smith",
    amount: 225.0,
    status: "paid",
    date: "2023-03-15",
    dueDate: "2023-04-15",
    items: ["Mathematics Tuition", "Biology Tuition", "History Tuition"],
  },
  {
    id: "INV-006",
    parent: "James Johnson",
    student: "Olivia Johnson",
    amount: 150.0,
    status: "pending",
    date: "2023-03-25",
    dueDate: "2023-04-25",
    items: ["Mathematics Tuition", "Music Tuition"],
  },
  {
    id: "INV-007",
    parent: "James Johnson",
    student: "Liam Johnson",
    amount: 275.0,
    status: "paid",
    date: "2023-03-10",
    dueDate: "2023-04-10",
    items: ["Physics Tuition", "Chemistry Tuition", "Mathematics Tuition"],
  },
  {
    id: "INV-008",
    parent: "Robert Davis",
    student: "Isabella Davis",
    amount: 225.0,
    status: "pending",
    date: "2023-03-18",
    dueDate: "2023-04-18",
    items: ["English Tuition", "History Tuition"],
  },
  {
    id: "INV-009",
    parent: "Jennifer Wilson",
    student: "James Wilson",
    amount: 175.0,
    status: "paid",
    date: "2023-03-05",
    dueDate: "2023-04-05",
    items: ["Geography Tuition", "Science Tuition"],
  },
  {
    id: "INV-010",
    parent: "Michael Miller",
    student: "Charlotte Miller",
    amount: 300.0,
    status: "overdue",
    date: "2023-02-20",
    dueDate: "2023-03-20",
    items: ["Mathematics Tuition", "Physics Tuition", "Chemistry Tuition"],
  },
  {
    id: "INV-011",
    parent: "Sarah Johnson",
    student: "Ethan Johnson",
    amount: 200.0,
    status: "paid",
    date: "2023-03-12",
    dueDate: "2023-04-12",
    items: ["Computer Science Tuition", "Mathematics Tuition"],
  },
  {
    id: "INV-012",
    parent: "David Wilson",
    student: "Olivia Wilson",
    amount: 150.0,
    status: "pending",
    date: "2023-03-22",
    dueDate: "2023-04-22",
    items: ["Art Tuition", "Music Tuition"],
  },
  {
    id: "INV-013",
    parent: "Elizabeth Brown",
    student: "Sophia Brown",
    amount: 225.0,
    status: "paid",
    date: "2023-03-08",
    dueDate: "2023-04-08",
    items: ["Spanish Tuition", "French Tuition"],
  },
  {
    id: "INV-014",
    parent: "Thomas Anderson",
    student: "William Anderson",
    amount: 275.0,
    status: "overdue",
    date: "2023-02-25",
    dueDate: "2023-03-25",
    items: ["Physics Tuition", "Chemistry Tuition", "Biology Tuition"],
  },
  {
    id: "INV-015",
    parent: "Nancy Martinez",
    student: "James Martinez",
    amount: 200.0,
    status: "paid",
    date: "2023-03-17",
    dueDate: "2023-04-17",
    items: ["Mathematics Tuition", "English Tuition"],
  },
]

export function InvoicesTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Calculate pagination
  const totalItems = invoices.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedInvoices = invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  // Prevent navigation if clicking on actions or the invoice ID link
                  if (
                    e.target instanceof HTMLElement &&
                    (e.target.closest("button") || e.target.closest("a") || e.target.closest("[data-no-navigation]"))
                  ) {
                    return
                  }
                  router.push(`/admin/invoices/${invoice.id}`)
                }}
              >
                <TableCell>
                  <Link href={`/admin/invoices/${invoice.id}`} className="font-medium hover:underline">
                    {invoice.id}
                  </Link>
                </TableCell>
                <TableCell>{invoice.parent}</TableCell>
                <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>{format(new Date(invoice.date), "MM/dd/yyyy")}</TableCell>
                <TableCell>{format(new Date(invoice.dueDate), "MM/dd/yyyy")}</TableCell>
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
                        <Link href={`/admin/invoices/${invoice.id}/edit`}>
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
