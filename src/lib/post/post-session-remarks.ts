import { createClient } from '@/utils/supabase/server'
import { SessionRemarksType } from '@/types'

export async function createSessionRemarks(params: {
    session_id: string
    session_summary: string
}): Promise<{ success: boolean; data?: SessionRemarksType; error?: { message: string } }> {
    const supabase = await createClient()

    try {
        // Validate required fields
        if (!params.session_id || !params.session_summary) {
            throw new Error('Session ID and session summary are required')
        }

        // Check if remarks already exist for this session
        const { data: existingRemarks } = await supabase
            .from('session_remarks')
            .select('id')
            .eq('session_id', params.session_id)
            .single()

        if (existingRemarks) {
            throw new Error('Session remarks already exist for this session')
        }

        // Create new session remarks
        const { data, error } = await supabase
            .from('session_remarks')
            .insert({
                session_id: params.session_id,
                session_summary: params.session_summary
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error creating session remarks:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function updateSessionRemarks(params: {
    session_id: string
    session_summary: string
}): Promise<{ success: boolean; data?: SessionRemarksType; error?: { message: string } }> {
    const supabase = await createClient()

    try {
        // Validate required fields
        if (!params.session_id || !params.session_summary) {
            throw new Error('Session ID and session summary are required')
        }

        // Update existing session remarks
        const { data, error } = await supabase
            .from('session_remarks')
            .update({
                session_summary: params.session_summary,
                updated_at: new Date().toISOString()
            })
            .eq('session_id', params.session_id)
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error updating session remarks:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
} 