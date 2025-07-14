import { createClient } from '@/utils/supabase/server'
import { StudentSessionNotesType } from '@/types'

export async function createStudentSessionNotes(params: {
    session_id: string
    student_id: string
    notes?: string
    performance_rating?: number
    participation_level?: number
}): Promise<{ success: boolean; data?: StudentSessionNotesType; error?: { message: string } }> {
    const supabase = await createClient()

    try {
        // Validate required fields
        if (!params.session_id || !params.student_id) {
            throw new Error('Session ID and student ID are required')
        }

        // Check if notes already exist for this session and student
        const { data: existingNotes } = await supabase
            .from('student_session_notes')
            .select('id')
            .eq('session_id', params.session_id)
            .eq('student_id', params.student_id)
            .single()

        if (existingNotes) {
            throw new Error('Student session notes already exist for this student and session')
        }

        // Create new student session notes
        const { data, error } = await supabase
            .from('student_session_notes')
            .insert({
                session_id: params.session_id,
                student_id: params.student_id,
                notes: params.notes || null,
                performance_rating: params.performance_rating || null,
                participation_level: params.participation_level || null
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error creating student session notes:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function updateStudentSessionNotes(params: {
    session_id: string
    student_id: string
    notes?: string
    performance_rating?: number
    participation_level?: number
}): Promise<{ success: boolean; data?: StudentSessionNotesType; error?: { message: string } }> {
    const supabase = await createClient()

    try {
        // Validate required fields
        if (!params.session_id || !params.student_id) {
            throw new Error('Session ID and student ID are required')
        }

        // Update existing student session notes
        const { data, error } = await supabase
            .from('student_session_notes')
            .update({
                notes: params.notes || null,
                performance_rating: params.performance_rating || null,
                participation_level: params.participation_level || null,
                updated_at: new Date().toISOString()
            })
            .eq('session_id', params.session_id)
            .eq('student_id', params.student_id)
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw new Error(`Database error: ${error.message}`)
        }

        return { success: true, data }
    } catch (error) {
        console.error('Error updating student session notes:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}

export async function upsertStudentSessionNotes(params: {
    session_id: string
    student_id: string
    notes?: string
    performance_rating?: number
    participation_level?: number
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
                participation_level: params.participation_level || null,
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