import { createClient } from "@/utils/supabase/client"
import { getLastInvoiceId } from "@/lib/get/get-invoices"
import { BillingCalculationType } from "@/types"

type InvoiceData = {
    invoice_id: string
    student_id: string
    parent_id?: string
    invoice_type: string
    amount: number
    currency: string
    description: string
    due_date: Date
    // Subscription billing fields
    subscription_id?: string
    billing_period_start?: string
    billing_period_end?: string
    hours_attended?: number
    hours_scheduled?: number
    free_absences_used?: number
    hourly_rate?: number
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
        // Subscription billing fields
        subscription_id?: string;
        billing_period_start?: string;
        billing_period_end?: string;
        hours_attended?: number;
        hours_scheduled?: number;
        free_absences_used?: number;
        hourly_rate?: number;
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
        created_at: new Date().toISOString(),
        // Add subscription billing fields if provided
        ...(invoiceData.subscription_id && { subscription_id: invoiceData.subscription_id }),
        ...(invoiceData.billing_period_start && { billing_period_start: invoiceData.billing_period_start }),
        ...(invoiceData.billing_period_end && { billing_period_end: invoiceData.billing_period_end }),
        ...(invoiceData.hours_attended !== undefined && { hours_attended: invoiceData.hours_attended }),
        ...(invoiceData.hours_scheduled !== undefined && { hours_scheduled: invoiceData.hours_scheduled }),
        ...(invoiceData.free_absences_used !== undefined && { free_absences_used: invoiceData.free_absences_used }),
        ...(invoiceData.hourly_rate !== undefined && { hourly_rate: invoiceData.hourly_rate })
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

export async function createSubscriptionInvoice(billingCalculation: BillingCalculationType) {
    const supabase = createClient()

    const lastInvoiceId = await getLastInvoiceId()
    const nextId = lastInvoiceId
        ? `INV-${String(parseInt(lastInvoiceId.split('-')[1]) + 1).padStart(3, '0')}`
        : 'INV-001'

    // Get student and parent info
    const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
            profile_id,
            profiles(first_name, last_name),
            parent_students(parent_id, parents(profile_id, profiles(first_name, last_name)))
        `)
        .eq('profile_id', billingCalculation.student_id)
        .single()

    if (studentError) {
        throw new Error(`Failed to fetch student data: ${studentError.message}`)
    }

    const parentId = studentData.parent_students?.[0]?.parent_id
    const studentName = `${studentData.profiles?.[0]?.first_name || 'Unknown'} ${studentData.profiles?.[0]?.last_name || 'Student'}`

    const invoiceToInsert = {
        invoice_id: nextId,
        student_id: billingCalculation.student_id,
        parent_id: parentId || null,
        invoice_type: 'subscription',
        amount: billingCalculation.total_amount,
        currency: 'USD',
        description: `Subscription billing for ${studentName} - ${billingCalculation.sessions_attended} sessions attended (${billingCalculation.total_hours_attended.toFixed(2)} hours)`,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'pending',
        created_at: new Date().toISOString(),
        subscription_id: billingCalculation.subscription_id,
        billing_period_start: billingCalculation.billing_period_start,
        billing_period_end: billingCalculation.billing_period_end,
        hours_attended: billingCalculation.total_hours_attended,
        hours_scheduled: billingCalculation.total_hours_scheduled,
        free_absences_used: billingCalculation.free_absences_used,
        hourly_rate: billingCalculation.hourly_rate
    }

    const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceToInsert])
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create subscription invoice: ${error.message}`)
    }

    return data
}

