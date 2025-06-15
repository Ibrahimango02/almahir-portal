import { createClient } from "@/utils/supabase/client"

type UpdateInvoiceData = {
    invoice_id: string
    student_id: string
    parent_id?: string
    invoice_type: string
    amount: number
    currency: string
    description: string
    due_date: Date
    status: string
}

export async function updateInvoice(invoiceData: UpdateInvoiceData) {
    const supabase = createClient()

    // Prepare the invoice object, omitting parent_id if it's undefined
    const invoiceToUpdate: any = {
        student_id: invoiceData.student_id,
        parent_id: invoiceData.parent_id,
        invoice_type: invoiceData.invoice_type,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        description: invoiceData.description,
        due_date: invoiceData.due_date.toISOString(),
        status: invoiceData.status,
        updated_at: new Date().toISOString()
    }

    if (invoiceData.parent_id === undefined) {
        invoiceToUpdate.parent_id = null
    }

    const { data, error } = await supabase
        .from('invoices')
        .update(invoiceToUpdate)
        .eq('invoice_id', invoiceData.invoice_id)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update invoice: ${error.message}`)
    }

    return data
}