import { createClient } from '@/utils/supabase/client'
import { SessionHistoryType } from '@/types'

// Batch size for PostgREST .in() queries (PostgREST has limits on array size)
const BATCH_SIZE = 100

// Helper function to batch array operations
async function batchQuery<T>(
    ids: string[],
    batchSize: number,
    queryFn: (batch: string[]) => Promise<T[]>
): Promise<T[]> {
    if (ids.length === 0) return []

    const results: T[] = []
    for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)
        const batchResults = await queryFn(batch)
        results.push(...batchResults)
    }
    return results
}

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

        // Then get history for all these sessions (with batching)
        const data = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('session_history')
                    .select('*')
                    .in('session_id', batch)
                    .order('created_at', { ascending: false })

                if (error) throw error
                return batchData || []
            }
        )

        return data
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
        // Step 1: Get all classes this student is enrolled in
        const { data: studentClasses } = await supabase
            .from('class_students')
            .select('class_id')
            .eq('student_id', studentId)

        if (!studentClasses || studentClasses.length === 0) {
            return []
        }

        const classIds = studentClasses.map(sc => sc.class_id)

        // Step 2: Get all session_history records
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

        // Step 3: Get unique session IDs from history
        const sessionIds = [...new Set(sessionHistory.map(h => h.session_id))]

        // Step 4: Get the corresponding class_sessions records (with batching)
        const sessions = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('class_sessions')
                    .select('*')
                    .in('id', batch)

                if (error) {
                    console.error('Error fetching sessions:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessions.length === 0) {
            return []
        }

        // Step 5: Filter sessions to only those belonging to student's classes
        const studentSessions = sessions.filter(session =>
            classIds.includes(session.class_id)
        )

        if (studentSessions.length === 0) {
            return []
        }

        // Step 6: Get class details for these sessions
        const studentClassIds = [...new Set(studentSessions.map(s => s.class_id))]
        const { data: classes } = await supabase
            .from('classes')
            .select('*')
            .in('id', studentClassIds)

        // Step 7: Get student attendance for these sessions (with batching)
        const studentSessionIds = studentSessions.map(s => s.id)
        const studentAttendance = await batchQuery(
            studentSessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('student_attendance')
                    .select('*')
                    .eq('student_id', studentId)
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 8: Combine the data for sessions that have history
        const result = studentSessions.map(session => {
            const classData = classes?.find(c => c.id === session.class_id)
            const history = sessionHistory.find(h => h.session_id === session.id)
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
        // Step 1: Get all classes this teacher teaches
        const { data: teacherClasses } = await supabase
            .from('class_teachers')
            .select('class_id')
            .eq('teacher_id', teacherId)

        if (!teacherClasses || teacherClasses.length === 0) {
            return []
        }

        const classIds = teacherClasses.map(tc => tc.class_id)

        // Step 2: Get all session_history records
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

        // Step 3: Get unique session IDs from history
        const sessionIds = [...new Set(sessionHistory.map(h => h.session_id))]

        // Step 4: Get the corresponding class_sessions records (with batching)
        const sessions = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('class_sessions')
                    .select('*')
                    .in('id', batch)

                if (error) {
                    console.error('Error fetching sessions:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessions.length === 0) {
            return []
        }

        // Step 5: Filter sessions to only those belonging to teacher's classes
        const teacherSessions = sessions.filter(session =>
            classIds.includes(session.class_id)
        )

        if (teacherSessions.length === 0) {
            return []
        }

        // Step 6: Get class details for these sessions
        const teacherClassIds = [...new Set(teacherSessions.map(s => s.class_id))]
        const { data: classes } = await supabase
            .from('classes')
            .select('*')
            .in('id', teacherClassIds)

        // Step 7: Get teacher attendance for these sessions (with batching)
        const teacherSessionIds = teacherSessions.map(s => s.id)
        const teacherAttendance = await batchQuery(
            teacherSessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('teacher_attendance')
                    .select('*')
                    .eq('teacher_id', teacherId)
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 8: Combine the data for sessions that have history
        const result = teacherSessions.map(session => {
            const classData = classes?.find(c => c.id === session.class_id)
            const history = sessionHistory.find(h => h.session_id === session.id)
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

        // Sort by date (newest first) - no need to filter by date since we only want sessions with history
        return result.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

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

        // Step 3: Get the corresponding class_sessions records (with batching)
        // Only fetch sessions with status "complete" or "absence"
        const sessions = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('class_sessions')
                    .select('id, class_id, start_date, end_date, status')
                    .in('id', batch)
                    .in('status', ['complete', 'absence'])

                if (error) {
                    console.error('Error fetching sessions:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessions.length === 0) {
            return []
        }

        // Step 4: Get unique class IDs
        const classIds = [...new Set(sessions.map(s => s.class_id))]

        // Step 5: Get class details (with batching)
        const classes = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('classes')
                    .select('id, title, subject')
                    .in('id', batch)

                if (error) {
                    console.error('Error fetching classes:', error)
                    throw error
                }
                return batchData || []
            }
        )

        // Step 6: Get session remarks (with batching)
        const sessionRemarks = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('session_remarks')
                    .select('*')
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 7: Get class teachers (with batching)
        const classTeachers = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_teachers')
                    .select('class_id, teacher_id')
                    .in('class_id', batch)
                return batchData || []
            }
        )

        // Step 8: Get teacher profiles (with batching)
        const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
        const teacherProfiles = teacherIds.length > 0
            ? await batchQuery(
                teacherIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 9: Get class students (with batching)
        const classStudents = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_students')
                    .select('class_id, student_id')
                    .in('class_id', batch)
                return batchData || []
            }
        )

        // Step 10: Get student data from students table (with batching)
        const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]
        const studentData = studentIds.length > 0
            ? await batchQuery(
                studentIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('students')
                        .select('id, profile_id, student_type')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 11: Get profiles for independent students (with batching)
        const independentStudentProfileIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
        const independentStudentProfiles = independentStudentProfileIds.length > 0
            ? await batchQuery(
                independentStudentProfileIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 12: Get child profiles for dependent students (with batching)
        const dependentStudentIds = studentData?.filter(s => s.student_type === 'dependent').map(s => s.id) || []
        const childProfiles = dependentStudentIds.length > 0
            ? await batchQuery(
                dependentStudentIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('child_profiles')
                        .select('student_id, first_name, last_name')
                        .in('student_id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 13: Get teacher attendance (with batching)
        const teacherAttendance = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('teacher_attendance')
                    .select('*')
                    .in('session_id', batch)
                return batchData || []
            }
        )

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

        // Step 19: Filter to only sessions with status "complete" or "absence", then sort by date (newest first)
        return result
            .filter(session =>
                session.status === 'complete' ||
                session.status === 'absence'
            )
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    } catch (error) {
        console.error('Error fetching all session history for reports:', error)
        return []
    }
}

export async function getTeacherSessionHistoryForReports(teacherId: string): Promise<Array<{
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
        // Step 1: Get all classes this teacher teaches
        const { data: teacherClasses } = await supabase
            .from('class_teachers')
            .select('class_id')
            .eq('teacher_id', teacherId)

        if (!teacherClasses || teacherClasses.length === 0) {
            return []
        }

        const classIds = [...new Set(teacherClasses.map(tc => tc.class_id))]

        // Step 2: Get all sessions for these classes (with batching)
        // Only fetch sessions with status "complete" or "absence"
        const sessions = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_sessions')
                    .select('id, class_id, start_date, end_date, status')
                    .in('class_id', batch)
                    .in('status', ['complete', 'absence'])
                return batchData || []
            }
        )

        if (sessions.length === 0) {
            return []
        }

        const sessionIds = sessions.map(s => s.id)

        // Step 3: Get session history for these sessions (with batching)
        const sessionHistory = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('session_history')
                    .select('*')
                    .in('session_id', batch)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching session history:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessionHistory.length === 0) {
            return []
        }

        // Step 4: Get class details (with batching)
        const classes = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('classes')
                    .select('id, title, subject')
                    .in('id', batch)

                if (error) {
                    console.error('Error fetching classes:', error)
                    throw error
                }
                return batchData || []
            }
        )

        // Step 5: Get session remarks (with batching)
        const sessionRemarks = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('session_remarks')
                    .select('*')
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 6: Get class teachers (for all classes this teacher teaches) (with batching)
        const classTeachers = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_teachers')
                    .select('class_id, teacher_id')
                    .in('class_id', batch)
                return batchData || []
            }
        )

        // Step 7: Get teacher profiles (with batching)
        const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
        const teacherProfiles = teacherIds.length > 0
            ? await batchQuery(
                teacherIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 8: Get class students (with batching)
        const classStudents = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_students')
                    .select('class_id, student_id')
                    .in('class_id', batch)
                return batchData || []
            }
        )

        // Step 9: Get student data from students table (with batching)
        const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]
        const studentData = studentIds.length > 0
            ? await batchQuery(
                studentIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('students')
                        .select('id, profile_id, student_type')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 10: Get profiles for independent students (with batching)
        const independentStudentProfileIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
        const independentStudentProfiles = independentStudentProfileIds.length > 0
            ? await batchQuery(
                independentStudentProfileIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 11: Get child profiles for dependent students (with batching)
        const dependentStudentIds = studentData?.filter(s => s.student_type === 'dependent').map(s => s.id) || []
        const childProfiles = dependentStudentIds.length > 0
            ? await batchQuery(
                dependentStudentIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('child_profiles')
                        .select('student_id, first_name, last_name')
                        .in('student_id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 12: Get teacher attendance for this specific teacher (with batching)
        const teacherAttendance = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('teacher_attendance')
                    .select('*')
                    .eq('teacher_id', teacherId)
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 13: Create lookup maps
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

        // Step 14: Create student name map (student_id -> name)
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

        // Step 15: Create class to teacher mapping
        const classTeacherMap = new Map()
        classTeachers?.forEach(ct => {
            if (!classTeacherMap.has(ct.class_id)) {
                classTeacherMap.set(ct.class_id, [])
            }
            classTeacherMap.get(ct.class_id).push(ct.teacher_id)
        })

        // Step 16: Create class to students mapping
        const classStudentMap = new Map()
        classStudents?.forEach(cs => {
            if (!classStudentMap.has(cs.class_id)) {
                classStudentMap.set(cs.class_id, [])
            }
            classStudentMap.get(cs.class_id).push(cs.student_id)
        })

        // Step 17: Combine the data - iterate over session_history records
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
                .map((tid: string) => {
                    const teacher = teacherProfiles?.find(t => t.id === tid)
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

        // Step 18: Filter to only sessions with status "complete" or "absence", then sort by date (newest first)
        return result
            .filter(session =>
                session.status === 'complete' ||
                session.status === 'absence'
            )
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    } catch (error) {
        console.error('Error fetching teacher session history for reports:', error)
        return []
    }
}

// Parent-specific session history for reports – only sessions for this parent's students
export async function getParentSessionHistoryForReports(parentProfileId: string): Promise<Array<{
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
        // Step 1: Get all students of this parent via child_profiles
        const { data: parentChildProfiles, error: parentChildError } = await supabase
            .from('child_profiles')
            .select('student_id')
            .eq('parent_profile_id', parentProfileId)

        if (parentChildError) {
            console.error('Error fetching parent child profiles:', parentChildError)
            throw parentChildError
        }

        if (!parentChildProfiles || parentChildProfiles.length === 0) {
            return []
        }

        const parentStudentIds = parentChildProfiles.map(cp => cp.student_id)

        // Step 2: Get all classes these students are enrolled in (with batching)
        const classStudents = await batchQuery(
            parentStudentIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('class_students')
                    .select('class_id, student_id')
                    .in('student_id', batch)

                if (error) {
                    console.error('Error fetching class_students for parent:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (classStudents.length === 0) {
            return []
        }

        const classIds = [...new Set(classStudents.map(cs => cs.class_id))]

        // Step 3: Get all sessions for these classes (with batching)
        // Only fetch sessions with status "complete" or "absence"
        const sessions = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('class_sessions')
                    .select('id, class_id, start_date, end_date, status')
                    .in('class_id', batch)
                    .in('status', ['complete', 'absence'])

                if (error) {
                    console.error('Error fetching sessions for parent:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessions.length === 0) {
            return []
        }

        const sessionIds = sessions.map(s => s.id)

        // Step 4: Get session history for these sessions (with batching)
        const sessionHistory = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('session_history')
                    .select('*')
                    .in('session_id', batch)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching session history for parent:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessionHistory.length === 0) {
            return []
        }

        // Step 5: Get class details (with batching)
        const classes = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('classes')
                    .select('id, title, subject')
                    .in('id', batch)

                if (error) {
                    console.error('Error fetching classes for parent:', error)
                    throw error
                }
                return batchData || []
            }
        )

        // Step 6: Get session remarks (with batching)
        const sessionRemarks = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('session_remarks')
                    .select('*')
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 7: Get class teachers (with batching)
        const classTeachers = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_teachers')
                    .select('class_id, teacher_id')
                    .in('class_id', batch)
                return batchData || []
            }
        )

        // Step 8: Get teacher profiles (with batching)
        const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
        const teacherProfiles = teacherIds.length > 0
            ? await batchQuery(
                teacherIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 9: Get student data for the parent's students only (with batching)
        const studentData = await batchQuery(
            parentStudentIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('students')
                    .select('id, profile_id, student_type')
                    .in('id', batch)
                return batchData || []
            }
        )

        // Step 10: Get profiles for independent students (with batching)
        const independentStudentProfileIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
        const independentStudentProfiles = independentStudentProfileIds.length > 0
            ? await batchQuery(
                independentStudentProfileIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 11: Get child profiles for dependent students (for name resolution) (with batching)
        const dependentStudentIds = studentData?.filter(s => s.student_type === 'dependent').map(s => s.id) || []
        const childProfiles = dependentStudentIds.length > 0
            ? await batchQuery(
                dependentStudentIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('child_profiles')
                        .select('student_id, first_name, last_name')
                        .in('student_id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 12: Get student attendance for the parent's students in these sessions (with batching)
        // Note: This requires batching on both student_id and session_id, so we'll batch by session_id
        const studentAttendance = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('student_attendance')
                    .select('*')
                    .in('student_id', parentStudentIds)
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 13: Create lookup maps
        const sessionMap = new Map(
            sessions.map(s => [s.id, s])
        )

        const classMap = new Map(
            (classes || []).map(c => [c.id, c])
        )

        const sessionRemarksMap = new Map(
            (sessionRemarks || []).map(r => [r.session_id, r])
        )

        // Step 14: Create student name map (student_id -> name)
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

        // Step 15: Combine the data - but only for sessions where at least one of this parent's students attended
        const result = sessionHistory.map(history => {
            const session = sessionMap.get(history.session_id)
            if (!session) {
                return null
            }

            const classData = classMap.get(session.class_id)
            const remarks = sessionRemarksMap.get(session.id)

            // Find this parent's students in this class
            const studentsInThisClass = classStudents.filter(cs =>
                cs.class_id === session.class_id && parentStudentIds.includes(cs.student_id)
            ).map(cs => cs.student_id)

            if (studentsInThisClass.length === 0) {
                // No students of this parent in this class/session
                return null
            }

            // Student names for this class that belong to the parent
            const studentNames = studentsInThisClass
                .map(studentId => studentNameMap.get(studentId) || 'Unknown Student')

            // Teacher names for this class
            const classTeacherIds = classTeachers
                ?.filter(ct => ct.class_id === session.class_id)
                .map(ct => ct.teacher_id) || []

            const teacherNames = classTeacherIds
                .map((tid: string) => {
                    const teacher = teacherProfiles?.find(t => t.id === tid)
                    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher'
                })

            // Determine attendance status for these students in this session
            // For now, if any student has 'present', mark as 'present', else if any 'absent', etc.
            const attendanceForSession = (studentAttendance || []).filter(a => a.session_id === session.id)
            let attendanceStatus = 'N/A'
            if (attendanceForSession.length > 0) {
                if (attendanceForSession.some(a => a.attendance_status === 'present')) {
                    attendanceStatus = 'present'
                } else if (attendanceForSession.some(a => a.attendance_status === 'absent')) {
                    attendanceStatus = 'absent'
                } else {
                    attendanceStatus = attendanceForSession[0].attendance_status
                }
            }

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
                attendance_status: attendanceStatus,
                notes: history.notes || null,
                session_summary: remarks?.session_summary || null
            }
        }).filter((item): item is NonNullable<typeof item> => item !== null)

        // Step 16: Filter to only sessions with status "complete" or "absence", then sort by date (newest first)
        return result
            .filter(session =>
                session.status === 'complete' ||
                session.status === 'absence'
            )
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    } catch (error) {
        console.error('Error fetching parent session history for reports:', error)
        return []
    }
}

// Student-specific session history for reports – only sessions for this student
export async function getStudentSessionHistoryForReports(studentId: string): Promise<Array<{
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
        // Step 1: Get all classes this student is enrolled in
        const { data: studentClasses, error: studentClassesError } = await supabase
            .from('class_students')
            .select('class_id, student_id')
            .eq('student_id', studentId)

        if (studentClassesError) {
            console.error('Error fetching class_students for student:', studentClassesError)
            throw studentClassesError
        }

        if (!studentClasses || studentClasses.length === 0) {
            return []
        }

        const classIds = [...new Set(studentClasses.map(cs => cs.class_id))]

        // Step 2: Get all sessions for these classes (with batching)
        // Only fetch sessions with status "complete" or "absence"
        const sessions = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('class_sessions')
                    .select('id, class_id, start_date, end_date, status')
                    .in('class_id', batch)
                    .in('status', ['complete', 'absence'])

                if (error) {
                    console.error('Error fetching sessions for student:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessions.length === 0) {
            return []
        }

        const sessionIds = sessions.map(s => s.id)

        // Step 3: Get session history for these sessions (with batching)
        const sessionHistory = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('session_history')
                    .select('*')
                    .in('session_id', batch)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching session history for student:', error)
                    throw error
                }
                return batchData || []
            }
        )

        if (sessionHistory.length === 0) {
            return []
        }

        // Step 4: Get class details (with batching)
        const classes = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData, error } = await supabase
                    .from('classes')
                    .select('id, title, subject')
                    .in('id', batch)

                if (error) {
                    console.error('Error fetching classes for student:', error)
                    throw error
                }
                return batchData || []
            }
        )

        // Step 5: Get session remarks (with batching)
        const sessionRemarks = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('session_remarks')
                    .select('*')
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 6: Get class teachers for these classes (with batching)
        const classTeachers = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_teachers')
                    .select('class_id, teacher_id')
                    .in('class_id', batch)
                return batchData || []
            }
        )

        // Step 7: Get teacher profiles (with batching)
        const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
        const teacherProfiles = teacherIds.length > 0
            ? await batchQuery(
                teacherIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 8: Get all students in these classes (for showing classmates) (with batching)
        const allClassStudents = await batchQuery(
            classIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('class_students')
                    .select('class_id, student_id')
                    .in('class_id', batch)
                return batchData || []
            }
        )

        const allStudentIds = [...new Set(allClassStudents?.map(cs => cs.student_id) || [])]

        const studentData = allStudentIds.length > 0
            ? await batchQuery(
                allStudentIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('students')
                        .select('id, profile_id, student_type')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        const independentStudentProfileIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
        const independentStudentProfiles = independentStudentProfileIds.length > 0
            ? await batchQuery(
                independentStudentProfileIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', batch)
                    return batchData || []
                }
            )
            : []

        const dependentStudentIds = studentData?.filter(s => s.student_type === 'dependent').map(s => s.id) || []
        const childProfiles = dependentStudentIds.length > 0
            ? await batchQuery(
                dependentStudentIds,
                BATCH_SIZE,
                async (batch) => {
                    const { data: batchData } = await supabase
                        .from('child_profiles')
                        .select('student_id, first_name, last_name')
                        .in('student_id', batch)
                    return batchData || []
                }
            )
            : []

        // Step 9: Get this student's attendance for these sessions (with batching)
        const studentAttendance = await batchQuery(
            sessionIds,
            BATCH_SIZE,
            async (batch) => {
                const { data: batchData } = await supabase
                    .from('student_attendance')
                    .select('*')
                    .eq('student_id', studentId)
                    .in('session_id', batch)
                return batchData || []
            }
        )

        // Step 10: Create lookup maps
        const sessionMap = new Map(
            sessions.map(s => [s.id, s])
        )

        const classMap = new Map(
            (classes || []).map(c => [c.id, c])
        )

        const sessionRemarksMap = new Map(
            (sessionRemarks || []).map(r => [r.session_id, r])
        )

        const studentAttendanceMap = new Map(
            (studentAttendance || []).map(a => [a.session_id, a.attendance_status])
        )

        // Student name map
        const studentNameMap = new Map<string, string>()

        studentData?.forEach(student => {
            if (student.student_type === 'independent' && student.profile_id) {
                const profile = independentStudentProfiles?.find(p => p.id === student.profile_id)
                if (profile) {
                    studentNameMap.set(student.id, `${profile.first_name} ${profile.last_name}`)
                }
            }
        })

        childProfiles?.forEach(child => {
            studentNameMap.set(child.student_id, `${child.first_name} ${child.last_name}`)
        })

        // Combine data
        const result = sessionHistory.map(history => {
            const session = sessionMap.get(history.session_id)
            if (!session) return null

            const classData = classMap.get(session.class_id)
            const remarks = sessionRemarksMap.get(session.id)
            const attendanceStatus = studentAttendanceMap.get(session.id) || 'N/A'

            // Teachers for this class
            const classTeacherIds = classTeachers
                ?.filter(ct => ct.class_id === session.class_id)
                .map(ct => ct.teacher_id) || []

            const teacherNames = classTeacherIds
                .map((tid: string) => {
                    const teacher = teacherProfiles?.find(t => t.id === tid)
                    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown Teacher'
                })

            // Students for this class
            const classStudentIds = allClassStudents
                ?.filter(cs => cs.class_id === session.class_id)
                .map(cs => cs.student_id) || []

            const studentNames = classStudentIds
                .map(sid => studentNameMap.get(sid) || 'Unknown Student')

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
                attendance_status: attendanceStatus,
                notes: history.notes || null,
                session_summary: remarks?.session_summary || null
            }
        }).filter((item): item is NonNullable<typeof item> => item !== null)

        // Filter to only sessions with status "complete" or "absence", then sort by date (newest first)
        return result
            .filter(session =>
                session.status === 'complete' ||
                session.status === 'absence'
            )
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    } catch (error) {
        console.error('Error fetching student session history for reports:', error)
        return []
    }
}