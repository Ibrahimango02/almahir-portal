"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Download, Printer } from "lucide-react"

interface LineItem {
  id: number
  description: string
  quantity: number
  price: number
}

interface InvoicePreviewProps {
  formData: {
    parentId: string
    invoiceNumber: string
    invoiceDate: Date
    dueDate: Date
    taxRate: number
    discount: number
    notes?: string
    status?: string // Make status optional
  }
  lineItems: LineItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  onBack: () => void
}

// Mock parent data
const parents = [
  { id: "1", name: "Ahmed Ali", email: "ahmed.ali@example.com", address: "123 Main St, Dubai, UAE" },
  { id: "2", name: "Fatima Khan", email: "fatima.khan@example.com", address: "456 Park Ave, Abu Dhabi, UAE" },
  { id: "3", name: "Mohammad Rahman", email: "mohammad.rahman@example.com", address: "789 Oak Ln, Sharjah, UAE" },
  { id: "4", name: "Aisha Abdullah", email: "aisha.abdullah@example.com", address: "101 Pine St, Ajman, UAE" },
]

export function InvoicePreview({ formData, lineItems, subtotal, tax, discount, total, onBack }: InvoicePreviewProps) {
  const parent = parents.find((p) => p.id === formData.parentId)

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "draft":
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Print function
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Edit
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="print:shadow-none">
        <CardContent className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Al-Mahir Academy</h2>
              <p className="text-gray-600">123 Education St</p>
              <p className="text-gray-600">Dubai, UAE</p>
              <p className="text-gray-600">info@almahiracademy.com</p>
            </div>

            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
              <p className="text-gray-600 mt-1">#{formData.invoiceNumber}</p>
              {formData.status ? (
                <span
                  className={`mt-2 inline-block px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(formData.status)}`}
                >
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </span>
              ) : (
                <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Pending
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8">
            <div>
              <h3 className="font-semibold text-gray-800">Bill To:</h3>
              {parent ? (
                <div className="mt-1">
                  <p className="font-medium">{parent.name}</p>
                  <p className="text-gray-600">{parent.email}</p>
                  <p className="text-gray-600">{parent.address}</p>
                </div>
              ) : (
                <p className="text-gray-600 mt-1">No parent selected</p>
              )}
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h3 className="font-semibold text-gray-800">Invoice Date:</h3>
                  <p className="text-gray-600 mt-1">{format(formData.invoiceDate, "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Due Date:</h3>
                  <p className="text-gray-600 mt-1">{format(formData.dueDate, "MMMM d, yyyy")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Description</th>
                  <th className="text-center py-3 px-2">Quantity</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 px-2">{item.description || "No description"}</td>
                    <td className="text-center py-3 px-2">{item.quantity}</td>
                    <td className="text-right py-3 px-2">${item.price.toFixed(2)}</td>
                    <td className="text-right py-3 px-2">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="font-medium">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium">Tax ({formData.taxRate}%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium">Discount:</span>
                <span>${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {formData.notes && (
            <div className="mt-8 border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-800">Notes:</h3>
              <p className="text-gray-600 mt-1">{formData.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
