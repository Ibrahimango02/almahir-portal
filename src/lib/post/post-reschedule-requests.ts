import { createClient } from '@/utils/supabase/client'
import { RescheduleRequestType } from '@/types'

export async function createRescheduleRequest(params: {
    sessionId: string
    requestedBy: string
    requestedDate: string
    reason: string
}): Promise<{ success: boolean; data?: RescheduleRequestType; error?: { message: string } }> {
    const supabase = createClient()

    try {
        // Validate required fields
        if (!params.sessionId || !params.requestedBy || !params.requestedDate || !params.reason) {
            throw new Error('Session ID, requested by, requested date, and reason are required')
        }

        // Create the reschedule request
        const { data, error } = await supabase
            .from('reschedule_requests')
            .insert({
                session_id: params.sessionId,
                requested_by: params.requestedBy,
                requested_date: params.requestedDate,
                reason: params.reason,
                status: 'requested'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error creating reschedule request:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function updateRescheduleRequest(params: {
    id: string
    status: 'approved' | 'rejected'
    processedBy: string
}): Promise<{ success: boolean; data?: RescheduleRequestType; error?: { message: string } }> {
    const supabase = createClient()

    try {
        // Validate required fields
        if (!params.id || !params.status || !params.processedBy) {
            throw new Error('Request ID, status, and processed by are required')
        }

        // Update the reschedule request
        const { data, error } = await supabase
            .from('reschedule_requests')
            .update({
                status: params.status,
                processed_by: params.processedBy,
                processed_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error updating reschedule request:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}


