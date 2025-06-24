import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EditInvoiceForm } from "@/components/edit-invoice-form"
import { BackButton } from "@/components/back-button"
import { getInvoiceById } from "@/lib/get/get-invoices"

export const metadata: Metadata = {
  title: "Edit Invoice | Al-Mahir Academy",
  description: "Edit an existing invoice",
}

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoiceById(id)

  if (!invoice) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">

      <div>
        <BackButton href={`/admin/invoices/${id}`} label="Back to Invoice" />
        <h1 className="text-3xl font-bold tracking-tight mt-4">Edit Invoice: {invoice.invoice_id}</h1>
      </div>


      <EditInvoiceForm invoice={invoice} />
    </div>
  )
}
