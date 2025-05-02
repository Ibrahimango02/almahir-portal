import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"

export const metadata: Metadata = {
  title: "Invoice Details | Al-Mahir Academy",
  description: "View invoice details",
}

// Mock function to get invoice by ID
async function getInvoiceById(id: string) {
  // In a real application, this would fetch data from your API or database
  const invoices = [
    {
      id: "INV-001",
      parent: "John Smith",
      parentEmail: "john.smith@example.com",
      amount: 250.0,
      status: "paid",
      date: "2023-03-15",
      dueDate: "2023-04-15",
      taxRate: 5,
      discount: 0,
      notes: "Monthly tuition fees",
      lineItems: [
        { id: 1, description: "Mathematics Tuition", quantity: 1, price: 150 },
        { id: 2, description: "Physics Tuition", quantity: 1, price: 100 },
      ],
    },
    {
      id: "INV-002",
      parent: "Maria Garcia",
      parentEmail: "maria.garcia@example.com",
      amount: 175.0,
      status: "pending",
      date: "2023-03-20",
      dueDate: "2023-04-20",
      taxRate: 5,
      discount: 0,
      notes: "",
      lineItems: [
        { id: 1, description: "Chemistry Tuition", quantity: 1, price: 100 },
        { id: 2, description: "Spanish Tuition", quantity: 1, price: 75 },
      ],
    },
    {
      id: "INV-003",
      parent: "James Johnson",
      parentEmail: "james.johnson@example.com",
      amount: 300.0,
      status: "paid",
      date: "2023-03-10",
      dueDate: "2023-04-10",
      taxRate: 5,
      discount: 0,
      notes: "Quarterly payment",
      lineItems: [
        { id: 1, description: "Physics Tuition", quantity: 1, price: 100 },
        { id: 2, description: "Computer Science Tuition", quantity: 1, price: 125 },
        { id: 3, description: "English Tuition", quantity: 1, price: 75 },
      ],
    },
    {
      id: "INV-004",
      parent: "Patricia Brown",
      parentEmail: "patricia.brown@example.com",
      amount: 200.0,
      status: "overdue",
      date: "2023-02-15",
      dueDate: "2023-03-15",
      taxRate: 5,
      discount: 0,
      notes: "Please pay immediately",
      lineItems: [
        { id: 1, description: "Biology Tuition", quantity: 1, price: 100 },
        { id: 2, description: "English Tuition", quantity: 1, price: 100 },
      ],
    },
  ]

  const invoice = invoices.find((invoice) => invoice.id === id)

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return invoice
}

// Function to get status badge variant
function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "paid":
      return "default"
    case "pending":
      return "outline"
    case "overdue":
      return "destructive"
    default:
      return "secondary"
  }
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await getInvoiceById(params.id)

  if (!invoice) {
    notFound()
  }

  // Calculate subtotal
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0)

  // Calculate tax
  const tax = subtotal * (invoice.taxRate / 100)

  // Calculate total
  const total = subtotal + tax - invoice.discount

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <BackButton href="/admin/invoices" label="Back to Invoices" />
            <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.id}</h1>
          </div>
          <Link href={`/admin/invoices/${params.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Invoice Number</dt>
                <dd className="font-medium">{invoice.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Invoice Date</dt>
                <dd className="font-medium">{new Date(invoice.date).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Due Date</dt>
                <dd className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Parent</dt>
                <dd className="font-medium">{invoice.parent}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd className="font-medium">{invoice.parentEmail}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">${subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Tax ({invoice.taxRate}%)</dt>
                <dd className="font-medium">${tax.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-muted-foreground">Discount</dt>
                <dd className="font-medium">${invoice.discount.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <dt className="text-base font-bold">Total</dt>
                <dd className="text-base font-bold">${total.toFixed(2)}</dd>
              </div>
            </dl>

            {invoice.notes && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                <p>{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Description</th>
                  <th className="text-center py-3 px-2">Quantity</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-2">{item.description}</td>
                    <td className="text-center py-3 px-2">{item.quantity}</td>
                    <td className="text-right py-3 px-2">${item.price.toFixed(2)}</td>
                    <td className="text-right py-3 px-2">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
