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

    return data
}

export async function updateStudentSubscription(
    id: string,
    updates: Partial<StudentSubscriptionType>
): Promise<StudentSubscriptionType> {
    const supabase = createClient()

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