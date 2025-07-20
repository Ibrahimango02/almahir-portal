"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentInvoicesTable } from "@/components/student-invoices-table"
import { TeacherPaymentsTable } from "@/components/teacher-payments-table"
import { DatePicker } from "@/components/ui/date-picker"
import { getInvoices } from "@/lib/get/get-invoices"
import { getTeacherPayments } from "@/lib/get/get-teacher-payments"
import { StudentInvoiceType, TeacherPaymentType } from "@/types"
import { DollarSign, HandCoins, Calendar, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"

export default function AdminAccountingPage() {
  const [invoices, setInvoices] = useState<StudentInvoiceType[]>([])
  const [teacherPayments, setTeacherPayments] = useState<TeacherPaymentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [invoicesData, paymentsData] = await Promise.all([
          getInvoices(),
          getTeacherPayments()
        ])
        setInvoices(invoicesData)
        setTeacherPayments(paymentsData)
      } catch (err) {
        console.error('Error fetching accounting data:', err)
        setError('Failed to load accounting data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInvoicesUpdate = async () => {
    try {
      const updatedInvoices = await getInvoices()
      setInvoices(updatedInvoices)
    } catch (err) {
      console.error('Error refreshing invoices:', err)
    }
  }

  const handlePaymentsUpdate = async () => {
    try {
      const updatedPayments = await getTeacherPayments()
      setTeacherPayments(updatedPayments)
    } catch (err) {
      console.error('Error refreshing payments:', err)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStartDate(undefined)
    setEndDate(undefined)
  }

  // Calculate summary statistics
  const totalInvoices = invoices.length
  const totalPayments = teacherPayments.length
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length
  const pendingPayments = teacherPayments.filter(payment => payment.status === 'pending').length

  // Filtered data based on search and date range
  const filteredInvoices = invoices.filter(inv => {
    const studentName = inv.student ? `${inv.student.first_name} ${inv.student.last_name}`.toLowerCase() : ""
    const parentName = inv.parent ? `${inv.parent.first_name} ${inv.parent.last_name}`.toLowerCase() : ""
    const status = inv.status.toLowerCase()
    const months = inv.months.toLowerCase()

    // Text search filter
    const matchesSearch = (
      studentName.includes(search.toLowerCase()) ||
      parentName.includes(search.toLowerCase()) ||
      status.includes(search.toLowerCase()) ||
      months.includes(search.toLowerCase())
    )

    // Date range filter
    let matchesDateRange = true
    if (startDate || endDate) {
      const invoiceDate = parseISO(inv.issue_date)
      const interval = {
        start: startDate ? startOfDay(startDate) : startOfDay(new Date(0)),
        end: endDate ? endOfDay(endDate) : endOfDay(new Date())
      }
      matchesDateRange = isWithinInterval(invoiceDate, interval)
    }

    return matchesSearch && matchesDateRange
  })

  const filteredTeacherPayments = teacherPayments.filter(pay => {
    const teacherName = pay.teacher ? `${pay.teacher.first_name} ${pay.teacher.last_name}`.toLowerCase() : ""
    const status = pay.status.toLowerCase()

    // Text search filter
    const matchesSearch = (
      teacherName.includes(search.toLowerCase()) ||
      status.includes(search.toLowerCase()) ||
      pay.session.class_title.toLowerCase().includes(search.toLowerCase())
    )

    // Date range filter
    let matchesDateRange = true
    if (startDate || endDate) {
      const paymentDate = parseISO(pay.created_at)
      const interval = {
        start: startDate ? startOfDay(startDate) : startOfDay(new Date(0)),
        end: endDate ? endOfDay(endDate) : endOfDay(new Date())
      }
      matchesDateRange = isWithinInterval(paymentDate, interval)
    }

    return matchesSearch && matchesDateRange
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
            <p className="text-muted-foreground">
              Manage student invoices and teacher payments
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
            <p className="text-muted-foreground">
              Manage student invoices and teacher payments
            </p>
          </div>
        </div>
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">
            Manage student invoices and teacher payments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                type="text"
                placeholder="Search invoices or payments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
                placeholder="Select start date"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
                placeholder="Select end date"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(search || startDate || endDate) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Invoices and Payments */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Student Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Teacher Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found</p>
                  <p className="text-sm">
                    {search || startDate || endDate
                      ? "Try adjusting your filters"
                      : "Student invoices will appear here once created"
                    }
                  </p>
                </div>
              ) : (
                <StudentInvoicesTable
                  invoices={filteredInvoices}
                  onStatusUpdate={handleInvoicesUpdate}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTeacherPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No teacher payments found</p>
                  <p className="text-sm">
                    {search || startDate || endDate
                      ? "Try adjusting your filters"
                      : "Teacher payments will appear here once created"
                    }
                  </p>
                </div>
              ) : (
                <TeacherPaymentsTable
                  payments={filteredTeacherPayments}
                  onStatusUpdate={handlePaymentsUpdate}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
