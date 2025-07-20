import { createClient } from "@/utils/supabase/client"

export type UpdateTeacherPaymentData = {
    id: string
    status: string
    paid_date?: string
    amount?: number
}

export async function updateTeacherPayment(paymentData: UpdateTeacherPaymentData) {
    const supabase = createClient()

    const paymentToUpdate: Record<string, unknown> = {
        status: paymentData.status,
        updated_at: new Date().toISOString()
    }

    // Set paid_date when status is changed to 'paid'
    if (paymentData.status === 'paid' && paymentData.paid_date) {
        paymentToUpdate.paid_date = paymentData.paid_date
    }

    // Set amount if provided
    if (paymentData.amount !== undefined) {
        paymentToUpdate.amount = paymentData.amount
    }

    const { data, error } = await supabase
        .from('teacher_payments')
        .update(paymentToUpdate)
        .eq('id', paymentData.id)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update teacher payment: ${error.message}`)
    }

    return data
} 