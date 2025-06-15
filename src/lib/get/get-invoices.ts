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

    const parentIds = invoices?.map(invoice => invoice.parent_id)

    const { data: parents, error: parentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', parentIds)

    // Transform the data to match InvoiceType
    return invoices.map(invoice => ({
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: students?.find(student => student.id === invoice.student_id)?.first_name,
            last_name: students?.find(student => student.id === invoice.student_id)?.last_name
        },
        parent: {
            parent_id: invoice.parent_id,
            first_name: parents?.find(parent => parent.id === invoice.parent_id)?.first_name,
            last_name: parents?.find(parent => parent.id === invoice.parent_id)?.last_name
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

export async function getInvoiceById(id: string): Promise<InvoiceType | null> {
    const supabase = createClient()

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_id', id)

    if (error) {
        throw error
    }

    if (!invoices || invoices.length === 0) {
        return null
    }

    const invoice = invoices[0]

    // Fetch student info
    const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', invoice.student_id)

    const student = students && students.length > 0 ? students[0] : null

    const { data: parents, error: parentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', invoice.parent_id)

    const parent = parents && parents.length > 0 ? parents[0] : null

    return {
        invoice_id: invoice.invoice_id,
        student: {
            student_id: invoice.student_id,
            first_name: student?.first_name,
            last_name: student?.last_name
        },
        parent: {
            parent_id: invoice.parent_id,
            first_name: parent?.first_name,
            last_name: parent?.last_name
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
    }
}

export async function getLastInvoiceId(): Promise<string> {
    const supabase = createClient()

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select('invoice_id')
        .order('invoice_id', { ascending: false })
        .limit(1)

    if (error) {
        throw error
    }

    return invoices?.[0]?.invoice_id
}