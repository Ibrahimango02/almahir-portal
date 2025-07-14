import { createClient } from '@/utils/supabase/server'
import { SessionRemarksType, StudentSessionNotesType, SessionRemarksWithTeacherType, StudentSessionNotesWithStudentType } from '@/types'

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

export async function getSessionRemarksWithTeacher(sessionId: string): Promise<SessionRemarksWithTeacherType | null> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('session_remarks')
            .select(`
                *,
                teacher:teachers!inner(
                    first_name,
                    last_name,
                    avatar_url
                )
            `)
            .eq('session_id', sessionId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null
            }
            console.error('Error fetching session remarks with teacher:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Error in getSessionRemarksWithTeacher:', error)
        return null
    }
}

export async function getStudentSessionNotes(sessionId: string): Promise<StudentSessionNotesType[]> {
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
        console.error('Error in getStudentSessionNotes:', error)
        return []
    }
}

export async function getStudentSessionNotesWithStudents(sessionId: string): Promise<StudentSessionNotesWithStudentType[]> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('student_session_notes')
            .select(`
                *,
                student:students!inner(
                    first_name,
                    last_name,
                    avatar_url
                )
            `)
            .eq('session_id', sessionId)

        if (error) {
            console.error('Error fetching student session notes with students:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Error in getStudentSessionNotesWithStudents:', error)
        return []
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