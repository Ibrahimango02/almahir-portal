import { createClient } from '@/utils/supabase/server'
import { BillingCalculationType, StudentSubscriptionType } from '@/types'

export async function calculateStudentBilling(
    studentId: string,
    startDate: string,
    endDate: string
): Promise<BillingCalculationType | null> {
    const supabase = await createClient()

    // Get current student subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('student_subscriptions')
        .select(`
      *,
      subscription:subscriptions(*)
    `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .single()

    if (subscriptionError || !subscriptionData) {
        console.error('No active subscription found for student:', studentId)
        return null
    }

    const studentSubscription = subscriptionData as StudentSubscriptionType
    const subscription = studentSubscription.subscription!

    // Get all sessions for the student in the billing period
    const { data: sessions, error: sessionsError } = await supabase
        .from('class_sessions')
        .select(`
      id,
      start_date,
      end_date,
      class_students!inner(student_id),
      student_attendance!inner(student_id, attendance_status)
    `)
        .eq('class_students.student_id', studentId)
        .eq('student_attendance.student_id', studentId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)

    if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
        throw new Error('Failed to fetch sessions for billing calculation')
    }

    let totalHoursScheduled = 0
    let totalHoursAttended = 0
    let sessionsAttended = 0
    let sessionsScheduled = 0

    sessions?.forEach(session => {
        const startTime = new Date(session.start_date)
        const endTime = new Date(session.end_date)
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

        totalHoursScheduled += durationHours
        sessionsScheduled++

        // Check if student attended this session
        const attendance = session.student_attendance?.[0]
        if (attendance && attendance.attendance_status === 'present') {
            totalHoursAttended += durationHours
            sessionsAttended++
        }
    })

    // Calculate free absences used
    const freeAbsencesUsed = sessionsScheduled - sessionsAttended

    // Calculate total amount based on hours attended
    const totalAmount = totalHoursAttended * subscription.hourly_rate

    return {
        student_id: studentId,
        subscription_id: subscription.id,
        billing_period_start: startDate,
        billing_period_end: endDate,
        total_hours_scheduled: totalHoursScheduled,
        total_hours_attended: totalHoursAttended,
        free_absences_used: freeAbsencesUsed,
        max_free_absences: subscription.max_free_absences,
        hourly_rate: subscription.hourly_rate,
        total_amount: totalAmount,
        sessions_attended: sessionsAttended,
        sessions_scheduled: sessionsScheduled
    }
}

export async function generateMonthlyInvoice(
    studentId: string,
    month: number,
    year: number
): Promise<BillingCalculationType | null> {
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0).toISOString()

    return calculateStudentBilling(studentId, startDate, endDate)
}

export function formatBillingPeriod(startDate: string, endDate: string): string {
    const start = new Date(startDate)
    const end = new Date(endDate)

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount)
} 