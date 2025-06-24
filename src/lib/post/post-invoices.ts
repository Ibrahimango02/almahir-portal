import { createClient } from "@/utils/supabase/client"
import { getLastInvoiceId } from "@/lib/get/get-invoices"

type InvoiceData = {
    invoice_id: string
    student_id: string
    parent_id?: string
    invoice_type: string
    amount: number
    currency: string
    description: string
    due_date: Date
}

export async function createInvoice(invoiceData: InvoiceData) {
    const supabase = createClient()

    const lastInvoiceId = await getLastInvoiceId()
    const nextId = lastInvoiceId
        ? `INV-${String(parseInt(lastInvoiceId.split('-')[1]) + 1).padStart(3, '0')}`
        : 'INV-001'

    // Prepare the invoice object, omitting parent_id if it's "none"
    const invoiceToInsert: {
        invoice_id: string;
        student_id: string;
        parent_id: string | null;
        invoice_type: string;
        amount: number;
        currency: string;
        description: string;
        due_date: string;
        status: string;
        created_at: string;
    } = {
        invoice_id: nextId,
        student_id: invoiceData.student_id,
        parent_id: invoiceData.parent_id ?? null,
        invoice_type: invoiceData.invoice_type,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        description: invoiceData.description,
        due_date: invoiceData.due_date.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
    }

    if (invoiceData.parent_id === "") {
        invoiceToInsert.parent_id = null
    }

    console.log(invoiceToInsert)

    const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceToInsert])
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create invoice: ${error.message}`)
    }

    return data
}

