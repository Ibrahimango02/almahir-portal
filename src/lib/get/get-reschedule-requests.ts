import { createClient } from '@/utils/supabase/client'
import { RescheduleRequestWithDetailsType } from '@/types'

export async function getAllRescheduleRequests(): Promise<RescheduleRequestWithDetailsType[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('reschedule_requests')
            .select(`
                *,
                session:class_sessions!inner(
                    id,
                    class_id,
                    start_date,
                    end_date,
                    status,
                    class:classes(
                        title,
                        subject
                    )
                ),
                requester:profiles!requested_by(
                    first_name,
                    last_name,
                    role
                ),
                processor:profiles!processed_by(
                    first_name,
                    last_name
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching all reschedule requests:', error)
        return []
    }
}

export async function getPendingRescheduleRequests(): Promise<RescheduleRequestWithDetailsType[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('reschedule_requests')
            .select(`
                *,
                session:class_sessions!inner(
                    id,
                    class_id,
                    start_date,
                    end_date,
                    status,
                    class:classes(
                        title,
                        subject
                    )
                ),
                requester:profiles!requested_by(
                    first_name,
                    last_name,
                    role
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching pending reschedule requests:', error)
        return []
    }
}

export async function getRescheduleRequestsByStatus(status: 'approved' | 'rejected'): Promise<RescheduleRequestWithDetailsType[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('reschedule_requests')
            .select(`
                *,
                session:class_sessions!inner(
                    id,
                    class_id,
                    start_date,
                    end_date,
                    status,
                    class:classes(
                        title,
                        subject
                    )
                ),
                requester:profiles!requested_by(
                    first_name,
                    last_name,
                    role
                ),
                processor:profiles!processed_by(
                    first_name,
                    last_name
                )
            `)
            .eq('status', status)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error fetching reschedule requests by status:', error)
        return []
    }
}

export async function getPendingRescheduleRequestsCount(): Promise<number> {
    const supabase = createClient()

    try {
        const { count, error } = await supabase
            .from('reschedule_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')

        if (error) {
            console.error('Error fetching pending reschedule requests count:', error)
            return 0
        }

        return count || 0
    } catch (error) {
        console.error('Error in getPendingRescheduleRequestsCount:', error)
        return 0
    }
} 