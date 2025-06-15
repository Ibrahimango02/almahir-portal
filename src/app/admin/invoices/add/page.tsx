import type { Metadata } from "next"
import { InvoiceForm } from "@/components/invoice-form"
import { BackButton } from "@/components/back-button"

export const metadata: Metadata = {
  title: "Create Invoice",
  description: "Create a new invoice for a parent or student",
}

export default function CreateInvoicePage() {
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackButton href="/admin/invoices" label="Back to Invoices" />
        <h1 className="text-3xl font-bold tracking-tight mt-4">Create Invoice</h1>
      </div>

      <InvoiceForm />
    </div>
  )
}
