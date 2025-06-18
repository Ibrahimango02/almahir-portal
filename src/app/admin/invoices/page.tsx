"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { InvoicesTable } from "@/components/invoices-table"
import Link from "next/link"
import { useState, useEffect } from "react"
import { InvoiceType } from "@/types"
import { getInvoices } from "@/lib/get/get-invoices"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceType[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const fetchInvoices = async () => {
      const data = await getInvoices()
      setInvoices(data)
      setFilteredInvoices(data)
    }
    fetchInvoices()
  }, [refreshTrigger])

  useEffect(() => {
    const filtered = invoices.filter(invoice => {
      const searchLower = searchQuery.toLowerCase()
      const studentName = `${invoice.student.first_name} ${invoice.student.last_name}`.toLowerCase()
      const parentName = invoice.parent ? `${invoice.parent.first_name} ${invoice.parent.last_name}`.toLowerCase() : ""
      return (
        invoice.invoice_id.toLowerCase().includes(searchLower) ||
        studentName.includes(searchLower) ||
        parentName.includes(searchLower) ||
        invoice.status.toLowerCase().includes(searchLower) ||
        invoice.amount === parseInt(searchLower)
      )
    })
    setFilteredInvoices(filtered)
  }, [searchQuery, invoices])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
            <Link href="/admin/invoices/add">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>Manage invoices and payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesTable
            invoices={filteredInvoices}
            onStatusUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
