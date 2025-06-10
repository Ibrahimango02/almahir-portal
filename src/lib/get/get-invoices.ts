import { createClient } from "@/utils/supabase/client"
import { InvoiceType } from "@/types"

export async function getInvoices(): Promise<InvoiceType[]> {
    const supabase = createClient()

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')

    if (error) {
        throw error
    }

    if (!invoices) {
        return []
    }

    const studentIds = invoices?.map(invoice => invoice.student_id)

    const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds)


    // Transform the data to match InvoiceType
    return invoices.map(invoice => ({
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: students?.find(student => student.id === invoice.student_id)?.first_name,
            last_name: students?.find(student => student.id === invoice.student_id)?.last_name
        },
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        due_date: invoice.due_date,
        status: invoice.status,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
    }))
}   
