import { createClient } from '@/utils/supabase/server'
import { SessionRemarksType, StudentSessionNotesType } from '@/types'

export async function getSessionRemarks(sessionId: string): Promise<SessionRemarksType | null> {
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
        console.error('Error in getSessionRemarks:', error)
        return null
    }
}


export async function getStudentSessionNotesForStudent(sessionId: string, studentId: string): Promise<StudentSessionNotesType | null> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('student_session_notes')
            .select('*')
            .eq('session_id', sessionId)
            .eq('student_id', studentId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null
            }
            console.error('Error fetching student session notes for student:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Error in getStudentSessionNotesForStudent:', error)
        return null
    }
} 