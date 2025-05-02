"use client"

import type React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { TablePagination } from "./table-pagination"
import { StatusBadge } from "./status-badge"
import { getParents } from "@/lib/get-parents"

const parents = await getParents()

//console.log(parents)  

const pparents = [
  {
    id: "P001",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Anytown, CA 12345",
    students: [
      { id: "S001", name: "Emma Smith" },
      { id: "S002", name: "Noah Smith" },
    ],
    joinDate: "2021-08-15",
    status: "active",
  },
  {
    id: "P002",
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    phone: "+1 (555) 234-5678",
    address: "456 Oak Ave, Somewhere, CA 12345",
    students: [{ id: "S003", name: "Sophia Garcia" }],
    joinDate: "2022-01-10",
    status: "active",
  },
  {
    id: "P003",
    name: "James Johnson",
    email: "james.johnson@example.com",
    phone: "+1 (555) 345-6789",
    address: "789 Pine Rd, Nowhere, CA 12345",
    students: [
      { id: "S004", name: "William Johnson" },
      { id: "S005", name: "Olivia Johnson" },
      { id: "S006", name: "Liam Johnson" },
    ],
    joinDate: "2020-09-05",
    status: "pending",
  },
  {
    id: "P004",
    name: "Patricia Brown",
    email: "patricia.brown@example.com",
    phone: "+1 (555) 456-7890",
    address: "101 Cedar Ln, Anytown, CA 12345",
    students: [{ id: "S007", name: "Ava Brown" }],
    joinDate: "2021-11-20",
    status: "suspended",
  },
  {
    id: "P005",
    name: "Robert Davis",
    email: "robert.davis@example.com",
    phone: "+1 (555) 567-8901",
    address: "202 Elm St, Somewhere, CA 12345",
    students: [
      { id: "S008", name: "Isabella Davis" },
      { id: "S009", name: "Mia Davis" },
    ],
    joinDate: "2022-03-15",
    status: "active",
  },
  {
    id: "P006",
    name: "Jennifer Wilson",
    email: "jennifer.wilson@example.com",
    phone: "+1 (555) 678-9012",
    address: "303 Maple Dr, Nowhere, CA 12345",
    students: [{ id: "S010", name: "James Wilson" }],
    joinDate: "2020-07-01",
    status: "inactive",
  },
  {
    id: "P007",
    name: "Michael Miller",
    email: "michael.miller@example.com",
    phone: "+1 (555) 789-0123",
    address: "404 Birch Blvd, Anytown, CA 12345",
    students: [
      { id: "S011", name: "Charlotte Miller" },
      { id: "S012", name: "Amelia Miller" },
    ],
    joinDate: "2021-05-12",
    status: "active",
  },
  {
    id: "P008",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 890-1234",
    address: "505 Willow Way, Somewhere, CA 12345",
    students: [{ id: "S013", name: "Ethan Johnson" }],
    joinDate: "2020-11-30",
    status: "archived",
  },
  {
    id: "P009",
    name: "David Wilson",
    email: "david.wilson@example.com",
    phone: "+1 (555) 901-2345",
    address: "606 Spruce St, Nowhere, CA 12345",
    students: [
      { id: "S014", name: "Olivia Wilson" },
      { id: "S015", name: "Lucas Wilson" },
    ],
    joinDate: "2021-02-15",
    status: "active",
  },
  {
    id: "P010",
    name: "Elizabeth Brown",
    email: "elizabeth.brown@example.com",
    phone: "+1 (555) 012-3456",
    address: "707 Pine Ln, Anytown, CA 12345",
    students: [{ id: "S016", name: "Sophia Brown" }],
    joinDate: "2022-01-05",
    status: "suspended",
  },
  {
    id: "P011",
    name: "Thomas Anderson",
    email: "thomas.anderson@example.com",
    phone: "+1 (555) 123-4567",
    address: "808 Oak St, Somewhere, CA 12345",
    students: [
      { id: "S017", name: "William Anderson" },
      { id: "S018", name: "Emma Anderson" },
    ],
    joinDate: "2020-08-20",
    status: "active",
  },
  {
    id: "P012",
    name: "Nancy Martinez",
    email: "nancy.martinez@example.com",
    phone: "+1 (555) 234-5678",
    address: "909 Maple Ave, Nowhere, CA 12345",
    students: [{ id: "S019", name: "James Martinez" }],
    joinDate: "2021-07-10",
    status: "pending",
  },
]

export function ParentsTable() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const handleRowClick = (id: string, e: React.MouseEvent) => {
    // Check if the click was on or inside a dropdown menu
    const target = e.target as HTMLElement
    if (target.closest("[data-no-row-click]")) {
      return
    }

    router.push(`/admin/parents/${id}`)
  }

  // Calculate pagination
  const totalItems = parents.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedParents = parents.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedParents.map((parent) => (
              <TableRow
                key={parent.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={(e) => handleRowClick(parent.id, e)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {parent.first_name[0]}
                        {parent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{parent.first_name} {parent.last_name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{parent.email}</TableCell>
                <TableCell>{parent.phone}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {parent.students.map((student) => (
                      <Badge key={student?.id} variant="outline">
                        {student?.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={parent.status} />
                </TableCell>
                <TableCell>{new Date(parent.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild data-no-row-click>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" data-no-row-click>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/parents/${parent.id}/edit`}>
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
