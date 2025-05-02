import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EditInvoiceForm } from "@/components/edit-invoice-form"
import { BackButton } from "@/components/back-button"

export const metadata: Metadata = {
  title: "Edit Invoice | Al-Mahir Academy",
  description: "Edit an existing invoice",
}

// Mock function to get invoice by ID
async function getInvoiceById(id: string) {
  // In a real application, this would fetch data from your API or database
  const invoices = [
    {
      id: "INV-001",
      parentId: "1", // John Smith
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
      parentId: "2", // Maria Garcia
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
      parentId: "3", // James Johnson
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
      parentId: "4", // Patricia Brown
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

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const invoice = await getInvoiceById(params.id)

  if (!invoice) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BackButton href="/admin/invoices" label="Back to Invoices" />
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice {invoice.id}</h1>
        </div>
      </div>

      <EditInvoiceForm invoice={invoice} />
    </div>
  )
}
