import { createClient } from '@/utils/supabase/client'
import { RescheduleRequestType } from '@/types'
import { NotificationService } from '@/lib/services/notification-service'
import { getAdminIds } from '@/lib/get/get-admins'

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

        // Get session and class details for notification
        const { data: sessionData } = await supabase
            .from('class_sessions')
            .select(`
                *,
                class:classes(
                    title,
                    subject
                )
            `)
            .eq('id', params.sessionId)
            .single()

        // Get requester details
        const { data: requesterData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', params.requestedBy)
            .single()

        // Create the reschedule request
        const { data, error } = await supabase
            .from('reschedule_requests')
            .insert({
                session_id: params.sessionId,
                requested_by: params.requestedBy,
                requested_date: params.requestedDate,
                reason: params.reason,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        // Send notifications to admins
        if (data && sessionData && requesterData) {
            const adminIds = await getAdminIds()
            const requesterName = `${requesterData.first_name} ${requesterData.last_name}`
            //const className = sessionData.class?.title || 'Unknown Class'
            const sessionDate = sessionData.start_date

            await NotificationService.notifyRescheduleRequest(
                adminIds,
                requesterName,
                sessionDate,
                params.requestedDate
            )
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

        // Get the reschedule request details before updating
        const { data: requestData } = await supabase
            .from('reschedule_requests')
            .select(`
                *,
                session:class_sessions(
                    *,
                    class:classes(
                        title,
                        subject
                    )
                ),
                requester:profiles!requested_by(
                    first_name,
                    last_name
                )
            `)
            .eq('id', params.id)
            .single()

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

        // Send notification to requester about the decision
        if (data && requestData && requestData.requester) {
            const requesterId = requestData.requested_by
            const className = requestData.session?.class?.title || 'Unknown Class'
            const status = params.status === 'approved' ? 'approved' : 'rejected'

            await NotificationService.notifySystem(
                [requesterId],
                `Reschedule Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                `Your request to reschedule ${className} has been ${status}`,
                params.status === 'approved' ? 'success' : 'warning'
            )
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


