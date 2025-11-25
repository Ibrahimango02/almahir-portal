"use server"

import { createClient } from '@/utils/supabase/server'
import { SessionRemarksType, StudentSessionNotesType } from '@/types'

export async function createSessionRemarksAction(params: {
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

export async function updateSessionRemarksAction(params: {
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

export async function getSessionRemarksAction(sessionId: string): Promise<SessionRemarksType | null> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('session_remarks')
            .select('*')
            .eq('session_id', sessionId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null
            }
            console.error('Error fetching session remarks:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Error in getSessionRemarksAction:', error)
        return null
    }
}

export async function upsertStudentSessionNotesAction(params: {
    session_id: string
    student_id: string
    notes?: string
    performance_rating?: number
}): Promise<{ success: boolean; data?: StudentSessionNotesType; error?: { message: string } }> {
    const supabase = await createClient()

    try {
        // Validate required fields
        if (!params.session_id || !params.student_id) {
            throw new Error('Session ID and student ID are required')
        }

        // Upsert student session notes
        const { data, error } = await supabase
            .from('student_session_notes')
            .upsert({
                session_id: params.session_id,
                student_id: params.student_id,
                notes: params.notes || null,
                performance_rating: params.performance_rating || null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'session_id,student_id'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error upserting student session notes:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function getStudentSessionNotesAction(sessionId: string): Promise<StudentSessionNotesType[]> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('student_session_notes')
            .select('*')
            .eq('session_id', sessionId)

        if (error) {
            console.error('Error fetching student session notes:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error in getStudentSessionNotesAction:', error)
        return []
    }
} 