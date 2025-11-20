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

        // Filter sessions to only include those that exist in session_history
        const sessionsWithHistory = sessions.filter(session =>
            sessionHistory?.some(h => h.session_id === session.id)
        )

        if (sessionsWithHistory.length === 0) {
            return []
        }

        // Combine the data for sessions that have history
        const result = sessionsWithHistory.map(session => {
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

        // Sort by date (newest first) - no need to filter by date since we only want sessions with history
        return result.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

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

export async function getAllSessionHistoryForReports(): Promise<Array<{
    session_id: string
    class_id: string
    title: string
    subject: string
    start_date: string
    end_date: string
    actual_start_time: string | null
    actual_end_time: string | null
    status: string
    teacher_names: string[]
    student_names: string[]
    attendance_status: string
    notes: string | null
    session_summary: string | null
}>> {
    const supabase = createClient()

    try {
        // Step 1: Start with session_history - get all history records
        const { data: sessionHistory, error: historyError } = await supabase
            .from('session_history')
            .select('*')
            .order('created_at', { ascending: false })

        if (historyError) {
            console.error('Error fetching session history:', historyError)
            throw historyError
        }

        if (!sessionHistory || sessionHistory.length === 0) {
            return []
        }

        // Step 2: Get unique session IDs from history
        const sessionIds = [...new Set(sessionHistory.map(h => h.session_id))]

        // Step 3: Get the corresponding class_sessions records
        const { data: sessions, error: sessionsError } = await supabase
            .from('class_sessions')
            .select('id, class_id, start_date, end_date, status')
            .in('id', sessionIds)

        if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError)
            throw sessionsError
        }

        if (!sessions || sessions.length === 0) {
            return []
        }

        // Step 4: Get unique class IDs
        const classIds = [...new Set(sessions.map(s => s.class_id))]

        // Step 5: Get class details
        const { data: classes, error: classesError } = await supabase
            .from('classes')
            .select('id, title, subject')
            .in('id', classIds)

        if (classesError) {
            console.error('Error fetching classes:', classesError)
            throw classesError
        }

        // Step 6: Get session remarks
        const { data: sessionRemarks } = await supabase
            .from('session_remarks')
            .select('*')
            .in('session_id', sessionIds)

        // Step 7: Get class teachers
        const { data: classTeachers } = await supabase
            .from('class_teachers')
            .select('class_id, teacher_id')
            .in('class_id', classIds)

        // Step 8: Get teacher profiles
        const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
        const { data: teacherProfiles } = teacherIds.length > 0
            ? await supabase
                .from('profiles')
                .select('*')
                .in('id', teacherIds)
            : { data: [] }

        // Step 9: Get class students
        const { data: classStudents } = await supabase
            .from('class_students')
            .select('class_id, student_id')
            .in('class_id', classIds)

        // Step 10: Get student data from students table
        const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]
        const { data: studentData } = studentIds.length > 0
            ? await supabase
                .from('students')
                .select('id, profile_id, student_type')
                .in('id', studentIds)
            : { data: [] }

        // Step 11: Get profiles for independent students
        const independentStudentProfileIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
        const { data: independentStudentProfiles } = independentStudentProfileIds.length > 0
            ? await supabase
                .from('profiles')
                .select('*')
                .in('id', independentStudentProfileIds)
            : { data: [] }

        // Step 12: Get child profiles for dependent students
        const dependentStudentIds = studentData?.filter(s => s.student_type === 'dependent').map(s => s.id) || []
        const { data: childProfiles } = dependentStudentIds.length > 0
            ? await supabase
                .from('child_profiles')
                .select('student_id, first_name, last_name')
                .in('student_id', dependentStudentIds)
            : { data: [] }

        // Step 13: Get teacher attendance
        const { data: teacherAttendance } = await supabase
            .from('teacher_attendance')
            .select('*')
            .in('session_id', sessionIds)

        // Step 14: Create lookup maps
        const sessionMap = new Map(
            sessions.map(s => [s.id, s])
        )

        const classMap = new Map(
            (classes || []).map(c => [c.id, c])
        )

        const sessionRemarksMap = new Map(
            (sessionRemarks || []).map(r => [r.session_id, r])
        )

        const teacherAttendanceMap = new Map(
            (teacherAttendance || []).map(a => [a.session_id, a.attendance_status])
        )

        // Step 15: Create student name map (student_id -> name)
        const studentNameMap = new Map<string, string>()

        // Map independent students (from profiles)
        studentData?.forEach(student => {
            if (student.student_type === 'independent' && student.profile_id) {
                const profile = independentStudentProfiles?.find(p => p.id === student.profile_id)
                if (profile) {
                    studentNameMap.set(student.id, `${profile.first_name} ${profile.last_name}`)
                }
            }
        })

        // Map dependent students (from child_profiles)
        childProfiles?.forEach(child => {
            studentNameMap.set(child.student_id, `${child.first_name} ${child.last_name}`)
        })

        // Step 16: Create class to teacher mapping
        const classTeacherMap = new Map()
        classTeachers?.forEach(ct => {
            if (!classTeacherMap.has(ct.class_id)) {
                classTeacherMap.set(ct.class_id, [])
            }
            classTeacherMap.get(ct.class_id).push(ct.teacher_id)
        })

        // Step 17: Create class to students mapping
        const classStudentMap = new Map()
        classStudents?.forEach(cs => {
            if (!classStudentMap.has(cs.class_id)) {
                classStudentMap.set(cs.class_id, [])
            }
            classStudentMap.get(cs.class_id).push(cs.student_id)
        })

        // Step 18: Combine the data - iterate over session_history records
        const result = sessionHistory.map(history => {
            const session = sessionMap.get(history.session_id)
            if (!session) {
                // Skip if session doesn't exist
                return null
            }

            const classData = classMap.get(session.class_id)
            const remarks = sessionRemarksMap.get(session.id)
            const teacherAttendanceStatus = teacherAttendanceMap.get(session.id) || 'N/A'

            // Get teacher names for this class
            const classTeacherIds = classTeacherMap.get(session.class_id) || []
            const teacherNames = classTeacherIds
                .map((teacherId: string) => {
                    const teacher = teacherProfiles?.find(t => t.id === teacherId)
                    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher'
                })

            // Get student names for this class
            const classStudentIds = classStudentMap.get(session.class_id) || []
            const studentNames = classStudentIds
                .map((studentId: string) => {
                    return studentNameMap.get(studentId) || 'Unknown Student'
                })

            return {
                session_id: session.id,
                class_id: session.class_id,
                title: classData?.title || 'Unknown Class',
                subject: classData?.subject || 'Unknown Subject',
                start_date: session.start_date,
                end_date: session.end_date,
                actual_start_time: history.actual_start_time || null,
                actual_end_time: history.actual_end_time || null,
                status: session.status,
                teacher_names: teacherNames,
                student_names: studentNames,
                attendance_status: teacherAttendanceStatus,
                notes: history.notes || null,
                session_summary: remarks?.session_summary || null
            }
        }).filter((item): item is NonNullable<typeof item> => item !== null)

        // Step 19: Filter to only past sessions or those with specific statuses, then sort by date (newest first)
        const now = new Date()
        return result
            .filter(session => {
                const sessionDate = new Date(session.end_date)
                return sessionDate < now ||
                    session.status === 'complete' ||
                    session.status === 'cancelled' ||
                    session.status === 'absence'
            })
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    } catch (error) {
        console.error('Error fetching all session history for reports:', error)
        return []
    }
} 