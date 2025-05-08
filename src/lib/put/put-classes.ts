import { createClient } from "@/utils/supabase/client"

export async function updateClassSession(params: {
    sessionId: string;
    action: string;
    teacherNotes?: string;
    newDate?: string;
    newStartTime?: string;
    newEndTime?: string;
}) {
    const supabase = createClient()
    const { sessionId, action, teacherNotes, newDate, newStartTime, newEndTime } = params

    try {
        switch (action.toLowerCase()) {
            case 'reschedule': {
                if (!newDate || !newStartTime || !newEndTime) {
                    throw new Error('New date, start time, and end time are required for rescheduling')
                }

                // Update class session with new schedule
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
                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: 'cancelled', notes: 'Class cancelled' })
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
