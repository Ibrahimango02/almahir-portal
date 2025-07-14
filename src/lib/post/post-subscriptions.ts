import { createClient } from '@/utils/supabase/server'
import { StudentSubscriptionType } from '@/types'

export async function createStudentSubscription(
    studentId: string,
    subscriptionId: string,
    startDate: string,
    endDate: string
): Promise<StudentSubscriptionType> {
    const supabase = await createClient()

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
            end_date: endDate,
            status: 'active',
            free_absences: 0
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
    const supabase = await createClient()

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
    const supabase = await createClient()

    const { error } = await supabase
        .from('student_subscriptions')
        .update({ status: 'inactive' })
        .eq('id', id)

    if (error) {
        console.error('Error deactivating student subscription:', error)
        throw new Error('Failed to deactivate student subscription')
    }
} 