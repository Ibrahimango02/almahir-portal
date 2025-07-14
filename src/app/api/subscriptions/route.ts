import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('studentId')

        if (studentId) {
            // Get student subscriptions
            const { data, error: studentError } = await supabase
                .from('student_subscriptions')
                .select(`
          *,
          subscription:subscriptions(*)
        `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })

            if (studentError) {
                return NextResponse.json({ error: studentError.message }, { status: 500 })
            }

            return NextResponse.json(data)
        } else {
            // Get all subscriptions
            const { data, error: subscriptionsError } = await supabase
                .from('subscriptions')
                .select('*')
                .order('name')

            if (subscriptionsError) {
                return NextResponse.json({ error: subscriptionsError.message }, { status: 500 })
            }

            return NextResponse.json(data)
        }
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { studentId, subscriptionId, startDate, endDate } = body

        if (!studentId || !subscriptionId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Deactivate any existing active subscription for this student
        await supabase
            .from('student_subscriptions')
            .update({ status: 'inactive' })
            .eq('student_id', studentId)
            .eq('status', 'active')

        // Create new subscription
        const { data, error: createError } = await supabase
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

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
} 