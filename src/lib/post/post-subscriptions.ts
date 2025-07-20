import { createClient } from '@/utils/supabase/client'
import { StudentSubscriptionType } from '@/types'

export async function createStudentSubscription(
    studentId: string,
    subscriptionId: string,
    startDate: string,
    endDate: string,
    everyMonth: boolean
): Promise<StudentSubscriptionType> {
    const supabase = createClient()

    // First, deactivate any existing active subscription for this student
    await supabase
        .from('student_subscriptions')
        .update({ status: 'inactive' })
        .eq('student_id', studentId)
        .eq('status', 'active')

    // Create new subscription
    const { data, error } = await supabase
        .from('student_subscriptions')
        .insert({
            student_id: studentId,
            subscription_id: subscriptionId,
            start_date: startDate,
            next_payment_date: endDate,
            every_month: everyMonth,
            status: 'active'
        })
        .select(`
      *,
      subscription:subscriptions(*)
    `)
        .single()

    if (error) {
        console.error('Error creating student subscription:', error)
        throw new Error('Failed to create student subscription')
    }

    // Calculate month range for the invoice
    // Parse dates more reliably by splitting and using UTC to avoid timezone issues
    const [startYear, startMonthStr, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonthStr, endDay] = endDate.split('-').map(Number)
    const startMonth = startMonthStr
    const endMonth = endMonthStr

    // Check if both dates are in the same month and year
    const isSameMonth = startMonth === endMonth && startYear === endYear

    // If years are different, include year information in the range
    let monthRange: string
    if (isSameMonth) {
        monthRange = `${startMonth}`
    } else if (startYear !== endYear) {
        // Different years - include year info
        monthRange = `${startMonth}/${startYear}-${endMonth}/${endYear}`
    } else {
        // Same year, different months
        monthRange = `${startMonth}-${endMonth}`
    }

    // Create the initial invoice for this subscription
    const { error: invoiceError } = await supabase
        .from('student_invoices')
        .insert({
            student_subscription: data.id,
            months: monthRange,
            issue_date: new Date().toISOString().split('T')[0], // Today's date
            due_date: endDate,
            status: 'pending'
        })

    if (invoiceError) {
        console.error('Error creating student invoice:', invoiceError)
        // Don't throw error here as the subscription was created successfully
        // The invoice can be created manually later if needed
    }

    return data
}

export async function updateStudentSubscription(
    id: string,
    updates: Partial<StudentSubscriptionType>
): Promise<StudentSubscriptionType> {
    const supabase = createClient()

    // Get the current subscription data before updating
    const { data: currentData, error: fetchError } = await supabase
        .from('student_subscriptions')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError) {
        console.error('Error fetching current subscription:', fetchError)
        throw new Error('Failed to fetch current subscription')
    }

    // Update the subscription
    const { data, error } = await supabase
        .from('student_subscriptions')
        .update(updates)
        .eq('id', id)
        .select(`
      *,
      subscription:subscriptions(*)
    `)
        .single()

    if (error) {
        console.error('Error updating student subscription:', error)
        throw new Error('Failed to update student subscription')
    }

    // Delete existing invoices for this subscription
    const { error: deleteError } = await supabase
        .from('student_invoices')
        .delete()
        .eq('student_subscription', id)

    if (deleteError) {
        console.error('Error deleting existing invoices:', deleteError)
        // Don't throw error here as the subscription was updated successfully
    }

    // Calculate month range for the new invoice
    const startDate = updates.start_date || currentData.start_date
    const endDate = updates.next_payment_date || currentData.next_payment_date
    // Parse dates more reliably by splitting and using UTC to avoid timezone issues
    const [startYear, startMonthStr, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonthStr, endDay] = endDate.split('-').map(Number)
    const startMonth = startMonthStr
    const endMonth = endMonthStr

    // Check if both dates are in the same month and year
    const isSameMonth = startMonth === endMonth && startYear === endYear

    // If years are different, include year information in the range
    let monthRange: string
    if (isSameMonth) {
        monthRange = `${startMonth}`
    } else if (startYear !== endYear) {
        // Different years - include year info
        monthRange = `${startMonth}/${startYear}-${endMonth}/${endYear}`
    } else {
        // Same year, different months
        monthRange = `${startMonth}-${endMonth}`
    }

    // Create a new invoice with the updated data
    const { error: invoiceError } = await supabase
        .from('student_invoices')
        .insert({
            student_subscription: id,
            months: monthRange,
            issue_date: new Date().toISOString().split('T')[0], // Today's date
            due_date: endDate,
            status: 'pending'
        })

    if (invoiceError) {
        console.error('Error creating new student invoice:', invoiceError)
        // Don't throw error here as the subscription was updated successfully
        // The invoice can be created manually later if needed
    }

    return data
}

export async function deactivateStudentSubscription(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('student_subscriptions')
        .update({ status: 'inactive' })
        .eq('id', id)

    if (error) {
        console.error('Error deactivating student subscription:', error)
        throw new Error('Failed to deactivate student subscription')
    }
}

export async function reactivateStudentSubscription(id: string): Promise<StudentSubscriptionType> {
    const supabase = createClient()

    // First, deactivate any other active subscriptions for this student
    const { data: currentSubscription } = await supabase
        .from('student_subscriptions')
        .select('student_id')
        .eq('id', id)
        .single()

    if (currentSubscription) {
        await supabase
            .from('student_subscriptions')
            .update({ status: 'inactive' })
            .eq('student_id', currentSubscription.student_id)
            .eq('status', 'active')
    }

    // Reactivate the specified subscription
    const { data, error } = await supabase
        .from('student_subscriptions')
        .update({ status: 'active' })
        .eq('id', id)
        .select(`
      *,
      subscription:subscriptions(*)
    `)
        .single()

    if (error) {
        console.error('Error reactivating student subscription:', error)
        throw new Error('Failed to reactivate student subscription')
    }

    return data
} 