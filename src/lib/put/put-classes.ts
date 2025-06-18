import { createClient } from "@/utils/supabase/client"

export async function updateClass(params: {
    classId: string;
    title?: string;
    description?: string | null;
    subject?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    days_repeated?: string[];
    class_link?: string | null;
    teacher_ids?: string[];
    student_ids?: string[];
}): Promise<{ success: boolean; error?: any }> {
    const supabase = createClient()
    const {
        classId,
        title,
        description,
        subject,
        start_date,
        end_date,
        status,
        days_repeated,
        class_link,
        teacher_ids,
        student_ids
    } = params

    try {
        // Update class basic information
        const classUpdateData: any = {}
        if (title !== undefined) classUpdateData.title = title
        if (description !== undefined) classUpdateData.description = description
        if (subject !== undefined) classUpdateData.subject = subject
        if (start_date !== undefined) classUpdateData.start_date = start_date
        if (end_date !== undefined) classUpdateData.end_date = end_date
        if (status !== undefined) classUpdateData.status = status
        if (days_repeated !== undefined) classUpdateData.days_repeated = days_repeated
        if (class_link !== undefined) classUpdateData.class_link = class_link
        classUpdateData.updated_at = new Date().toISOString()

        // Only update if there are fields to update
        if (Object.keys(classUpdateData).length > 0) {
            const { error: classError } = await supabase
                .from('classes')
                .update(classUpdateData)
                .eq('id', classId)

            if (classError) throw classError
        }

        // Update teacher assignments if provided
        if (teacher_ids !== undefined) {
            // First, remove all existing teacher assignments for this class
            const { error: deleteTeacherError } = await supabase
                .from('class_teachers')
                .delete()
                .eq('class_id', classId)

            if (deleteTeacherError) throw deleteTeacherError

            // Then, add new teacher assignments
            if (teacher_ids.length > 0) {
                const teacherAssignments = teacher_ids.map(teacherId => ({
                    class_id: classId,
                    teacher_id: teacherId
                }))

                const { error: insertTeacherError } = await supabase
                    .from('class_teachers')
                    .insert(teacherAssignments)

                if (insertTeacherError) throw insertTeacherError
            }
        }

        // Update student enrollments if provided
        if (student_ids !== undefined) {
            // First, remove all existing student enrollments for this class
            const { error: deleteStudentError } = await supabase
                .from('class_students')
                .delete()
                .eq('class_id', classId)

            if (deleteStudentError) throw deleteStudentError

            // Then, add new student enrollments
            if (student_ids.length > 0) {
                const studentEnrollments = student_ids.map(studentId => ({
                    class_id: classId,
                    student_id: studentId
                }))

                const { error: insertStudentError } = await supabase
                    .from('class_students')
                    .insert(studentEnrollments)

                if (insertStudentError) throw insertStudentError
            }
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating class:', error)
        return { success: false, error }
    }
}

export async function updateClassSession(params: {
    sessionId: string;
    action: string;
    teacherNotes?: string;
    newDate?: string;
    newStartTime?: string;
    newEndTime?: string;
    newStartDate?: string;
    newEndDate?: string;
}) {
    const supabase = createClient()
    const { sessionId, action, teacherNotes, newDate, newStartTime, newEndTime, newStartDate, newEndDate } = params

    try {
        switch (action.toLowerCase()) {
            case 'reschedule': {
                // Support both old and new schema for backward compatibility
                if (newStartDate && newEndDate) {
                    // New schema: use start_date and end_date
                    const { error: sessionError } = await supabase
                        .from('class_sessions')
                        .update({
                            start_date: newStartDate,
                            end_date: newEndDate,
                            status: 'scheduled'
                        })
                        .eq('id', sessionId)

                    if (sessionError) throw sessionError
                } else if (newDate && newStartTime && newEndTime) {
                    // Old schema: use date, start_time, and end_time
                    const { error: sessionError } = await supabase
                        .from('class_sessions')
                        .update({
                            date: newDate,
                            start_time: newStartTime,
                            end_time: newEndTime,
                            status: 'scheduled'
                        })
                        .eq('id', sessionId)

                    if (sessionError) throw sessionError
                } else {
                    throw new Error('New start date and end date are required for rescheduling')
                }

                // Create a record in class history for the reschedule
                const { error: historyError } = await supabase
                    .from('class_history')
                    .upsert({
                        session_id: sessionId,
                        notes: 'Class rescheduled'
                    }, {
                        onConflict: 'session_id'
                    })

                if (historyError) throw historyError
                break
            }

            case 'initiate': {
                // Create class history record and update session status
                const { error: historyError } = await supabase
                    .from('class_history')
                    .upsert({
                        session_id: sessionId,
                        notes: 'Class initiated'
                    }, {
                        onConflict: 'session_id'
                    })

                if (historyError) throw historyError

                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'pending' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'start': {
                const now = new Date().toISOString()

                // Update class history with start time
                const { error: historyError } = await supabase
                    .from('class_history')
                    .update({ actual_start_time: now, notes: 'Class started' })
                    .eq('session_id', sessionId)

                if (historyError) throw historyError

                // Update session status
                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'running' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'end': {
                const now = new Date().toISOString()

                // Update class history with end time
                const { error: historyError } = await supabase
                    .from('class_history')
                    .update({
                        actual_end_time: now,
                        notes: 'Class ended'
                    })
                    .eq('session_id', sessionId)

                if (historyError) throw historyError

                // Update session status
                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'complete' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'leave': {
                const { error: historyError } = await supabase
                    .from('class_history')
                    .upsert({
                        session_id: sessionId,
                        notes: 'Class cancelled'
                    }, {
                        onConflict: 'session_id'
                    })

                if (historyError) throw historyError

                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'cancelled' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            case 'absence': {
                const now = new Date().toISOString()
                // Update class history with end time
                const { error: historyError } = await supabase
                    .from('class_history')
                    .update({
                        actual_end_time: now,
                        notes: 'Class absence'
                    })
                    .eq('session_id', sessionId)

                if (historyError) throw historyError

                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'absence' })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            default:
                throw new Error(`Invalid action: ${action}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating class:', error)
        return { success: false, error }
    }
}

export async function updateClassSessionAttendance(params: { sessionId: string; attendance: Record<string, boolean> }) {
    const supabase = createClient()
    const { sessionId, attendance } = params

    try {
        // First get the class_history_id for this session
        const { data: classHistory, error: historyError } = await supabase
            .from('class_history')
            .select('id')
            .eq('session_id', sessionId)
            .single()

        if (historyError) throw historyError
        if (!classHistory) throw new Error('No class history found for this session')

        // Prepare attendance records for upsert
        const attendanceRecords = Object.entries(attendance).map(([studentId, isPresent]) => ({
            class_history_id: classHistory.id,
            student_id: studentId,
            attendance_status: isPresent ? 'present' : 'absent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }))

        // Upsert attendance records
        const { error: upsertError } = await supabase
            .from('class_attendance')
            .upsert(attendanceRecords, {
                onConflict: 'class_history_id,student_id',
                ignoreDuplicates: false
            })

        if (upsertError) throw upsertError

        return { success: true }
    } catch (error) {
        console.error('Error updating attendance:', error)
        return { success: false, error }
    }
}
