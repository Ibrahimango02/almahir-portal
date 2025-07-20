import { createClient } from "@/utils/supabase/client"

type UpdateStudentInvoiceData = {
    id: string
    student_subscription: string
    months: string
    issue_date: string
    due_date: string
    paid_date?: string | null
    status: string
}

export async function updateStudentInvoice(invoiceData: UpdateStudentInvoiceData) {
    const supabase = createClient()

    const invoiceToUpdate: {
        student_subscription: string;
        months: string;
        issue_date: string;
        due_date: string;
        paid_date: string | null;
        status: string;
        updated_at: string;
    } = {
        student_subscription: invoiceData.student_subscription,
        months: invoiceData.months,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        paid_date: invoiceData.paid_date ?? null,
        status: invoiceData.status,
        updated_at: new Date().toISOString()
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