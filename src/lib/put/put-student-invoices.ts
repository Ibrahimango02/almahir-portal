import { createClient } from "@/utils/supabase/client"

type UpdateStudentInvoiceData = {
    id: string
    due_date?: string
    paid_date?: string | null
    status?: string
}

export async function updateStudentInvoice(invoiceData: UpdateStudentInvoiceData) {
    const supabase = createClient()

    const invoiceToUpdate: {
        due_date?: string;
        paid_date?: string | null;
        status?: string;
        updated_at: string;
    } = {
        updated_at: new Date().toISOString()
    }

    // Only include fields that are provided
    if (invoiceData.due_date !== undefined) {
        invoiceToUpdate.due_date = invoiceData.due_date
    }
    if (invoiceData.paid_date !== undefined) {
        invoiceToUpdate.paid_date = invoiceData.paid_date ?? null
    }
    if (invoiceData.status !== undefined) {
        invoiceToUpdate.status = invoiceData.status
    }

    const { data, error } = await supabase
        .from('student_invoices')
        .update(invoiceToUpdate)
        .eq('id', invoiceData.id)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update student invoice: ${error.message}`)
    }

    return data
} 