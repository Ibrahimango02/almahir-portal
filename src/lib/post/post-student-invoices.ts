import { createClient } from "@/utils/supabase/client"

type StudentInvoiceData = {
    student_subscription: string
    months: string[]
    issue_date: string
    due_date: string
    status?: string
}

export async function createStudentInvoice(invoiceData: StudentInvoiceData) {
    const supabase = createClient()

    const invoiceToInsert = {
        student_subscription: invoiceData.student_subscription,
        months: invoiceData.months,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        status: invoiceData.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
        .from('student_invoices')
        .insert([invoiceToInsert])
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create student invoice: ${error.message}`)
    }

    return data
}

export async function createStudentInvoiceFromSubscription(
    studentSubscriptionId: string,
    months: string[],
    issueDate: string,
    dueDate: string
) {
    return createStudentInvoice({
        student_subscription: studentSubscriptionId,
        months,
        issue_date: issueDate,
        due_date: dueDate,
        status: 'pending'
    })
} 