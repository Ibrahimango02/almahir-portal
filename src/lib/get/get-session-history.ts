import { createClient } from '@/utils/supabase/client'
import { SessionHistoryType } from '@/types'

export async function getSessionHistory(sessionId: string): Promise<SessionHistoryType | null> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('session_history')
            .select('*')
            .eq('session_id', sessionId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null
            }
            throw error
        }

        return data
    } catch (error) {
        console.error('Error fetching session history:', error)
        return null
    }
}

export async function getSessionHistoryByClass(classId: string): Promise<SessionHistoryType[]> {
    const supabase = createClient()

    try {
        // First get all sessions for this class
        const { data: sessions, error: sessionsError } = await supabase
            .from('class_sessions')
            .select('id')
            .eq('class_id', classId)

        if (sessionsError) throw sessionsError

        if (!sessions || sessions.length === 0) {
            return []
        }

        const sessionIds = sessions.map(s => s.id)

        // Then get history for all these sessions
        const { data, error } = await supabase
            .from('session_history')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Error fetching session history by class:', error)
        return []
    }
}

export async function getAllSessionHistory(): Promise<SessionHistoryType[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('session_history')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Error fetching all session history:', error)
        return []
    }
}

export async function getStudentSessionHistory(studentId: string): Promise<Array<{
    session_id: string
    class_id: string
    title: string
    subject: string
    start_date: string
    end_date: string
    actual_start_time: string | null
    actual_end_time: string | null
    attendance_status: string
}>> {
    const supabase = createClient()

    try {
        // Get all classes this student is enrolled in
        const { data: studentClasses } = await supabase
            .from('class_students')
            .select('class_id')
            .eq('student_id', studentId)

        if (!studentClasses || studentClasses.length === 0) {
            return []
        }

        const classIds = studentClasses.map(sc => sc.class_id)

        // Get all sessions for these classes
        const { data: sessions } = await supabase
            .from('class_sessions')
            .select('*')
            .in('class_id', classIds)

        if (!sessions || sessions.length === 0) {
            return []
        }

        const sessionIds = sessions.map(s => s.id)

        // Get class details for these sessions
        const { data: classes } = await supabase
            .from('classes')
            .select('*')
            .in('id', classIds)

        // Get session history for these sessions
        const { data: sessionHistory } = await supabase
            .from('session_history')
            .select('*')
            .in('session_id', sessionIds)

        // Get student attendance for these sessions
        const { data: studentAttendance } = await supabase
            .from('student_attendance')
            .select('*')
            .eq('student_id', studentId)
            .in('session_id', sessionIds)

        // Combine the data
        const result = sessions.map(session => {
            const classData = classes?.find(c => c.id === session.class_id)
            const history = sessionHistory?.find(h => h.session_id === session.id)
            const attendance = studentAttendance?.find(a => a.session_id === session.id)

            return {
                session_id: session.id,
                class_id: session.class_id,
                title: classData?.title || 'Unknown Class',
                subject: classData?.subject || 'Unknown Subject',
                start_date: session.start_date,
                end_date: session.end_date,
                actual_start_time: history?.actual_start_time || null,
                actual_end_time: history?.actual_end_time || null,
                attendance_status: attendance?.attendance_status || 'N/A',
                notes: history?.notes || '' // Add notes for filtering
            }
        })

        // Filter to only past sessions or those with specific notes, then sort by date (newest first)
        const now = new Date();
        const noteMatch = (sessionNotes: string) => {
            if (!sessionNotes) return false;
            const lower = sessionNotes.toLowerCase();
            return (
                lower.includes('session ended') ||
                lower.includes('session cancelled') ||
                lower.includes('session absence')
            );
        };
        return result
            .filter(session => new Date(session.end_date) < now || noteMatch(session.notes))
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    } catch (error) {
        console.error('Error fetching student session history:', error)
        return []
    }
}

export async function getTeacherSessionHistory(teacherId: string): Promise<Array<{
    session_id: string
    class_id: string
    title: string
    subject: string
    start_date: string
    end_date: string
    actual_start_time: string | null
    actual_end_time: string | null
    attendance_status: string
}>> {
    const supabase = createClient()

    try {
        // Get all classes this teacher teaches
        const { data: teacherClasses } = await supabase
            .from('class_teachers')
            .select('class_id')
            .eq('teacher_id', teacherId)

        if (!teacherClasses || teacherClasses.length === 0) {
            return []
        }

        const classIds = teacherClasses.map(tc => tc.class_id)

        // Get all sessions for these classes
        const { data: sessions } = await supabase
            .from('class_sessions')
            .select('*')
            .in('class_id', classIds)

        if (!sessions || sessions.length === 0) {
            return []
        }

        const sessionIds = sessions.map(s => s.id)

        // Get class details for these sessions
        const { data: classes } = await supabase
            .from('classes')
            .select('*')
            .in('id', classIds)

        // Get session history for these sessions
        const { data: sessionHistory } = await supabase
            .from('session_history')
            .select('*')
            .in('session_id', sessionIds)

        // Get teacher attendance for these sessions
        const { data: teacherAttendance } = await supabase
            .from('teacher_attendance')
            .select('*')
            .eq('teacher_id', teacherId)
            .in('session_id', sessionIds)

        // Combine the data
        const result = sessions.map(session => {
            const classData = classes?.find(c => c.id === session.class_id)
            const history = sessionHistory?.find(h => h.session_id === session.id)
            const attendance = teacherAttendance?.find(a => a.session_id === session.id)

            return {
                session_id: session.id,
                class_id: session.class_id,
                title: classData?.title || 'Unknown Class',
                subject: classData?.subject || 'Unknown Subject',
                start_date: session.start_date,
                end_date: session.end_date,
                actual_start_time: history?.actual_start_time || null,
                actual_end_time: history?.actual_end_time || null,
                attendance_status: attendance?.attendance_status || 'N/A',
                notes: history?.notes || '' // Add notes for filtering
            }
        })

        // Filter to only past sessions or those with specific notes, then sort by date (newest first)
        const now = new Date();
        const noteMatch = (sessionNotes: string) => {
            if (!sessionNotes) return false;
            const lower = sessionNotes.toLowerCase();
            return (
                lower.includes('session ended') ||
                lower.includes('session cancelled') ||
                lower.includes('session absence')
            );
        };
        return result
            .filter(session => new Date(session.end_date) < now || noteMatch(session.notes))
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    } catch (error) {
        console.error('Error fetching teacher session history:', error)
        return []
    }
} 