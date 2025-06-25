import { createClient } from "@/utils/supabase/client"
import { addDays, format } from 'date-fns'

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
    times?: Record<string, { start: string; end: string }>;
}): Promise<{ success: boolean; error?: { message: string } }> {
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
        student_ids,
        times
    } = params

    try {
        // Get current class data to compare with new data
        const { data: currentClass, error: fetchError } = await supabase
            .from('classes')
            .select('*')
            .eq('id', classId)
            .single()

        if (fetchError) throw fetchError

        // Update class basic information
        const classUpdateData: {
            title?: string;
            description?: string | null;
            subject?: string;
            start_date?: string;
            end_date?: string;
            status?: string;
            days_repeated?: string[];
            class_link?: string | null;
            updated_at: string;
        } = {
            updated_at: new Date().toISOString()
        }
        if (title !== undefined) classUpdateData.title = title
        if (description !== undefined) classUpdateData.description = description
        if (subject !== undefined) classUpdateData.subject = subject
        if (start_date !== undefined) classUpdateData.start_date = start_date
        if (end_date !== undefined) classUpdateData.end_date = end_date
        if (status !== undefined) classUpdateData.status = status
        if (days_repeated !== undefined) classUpdateData.days_repeated = days_repeated
        if (class_link !== undefined) classUpdateData.class_link = class_link

        // Only update if there are fields to update
        if (Object.keys(classUpdateData).length > 0) {
            const { error: classError } = await supabase
                .from('classes')
                .update(classUpdateData)
                .eq('id', classId)

            if (classError) throw classError
        }

        // Handle session management if start_date, end_date, days_repeated, or times have changed
        const shouldUpdateSessions = (
            start_date !== undefined ||
            end_date !== undefined ||
            days_repeated !== undefined ||
            times !== undefined
        )

        if (shouldUpdateSessions) {
            // Get the final values (new or current)
            const finalStartDate = start_date || currentClass.start_date
            const finalEndDate = end_date || currentClass.end_date
            const finalDaysRepeated = days_repeated || currentClass.days_repeated

            // If times are not provided, we need to get existing sessions to extract time patterns
            let finalTimes = times
            if (!finalTimes) {
                // Get existing sessions to extract time patterns
                const { data: existingSessions, error: sessionsError } = await supabase
                    .from('class_sessions')
                    .select('start_date, end_date')
                    .eq('class_id', classId)
                    .order('start_date')

                if (sessionsError) throw sessionsError

                // Extract time patterns from existing sessions
                finalTimes = {}
                if (existingSessions && existingSessions.length > 0) {
                    for (const session of existingSessions) {
                        const sessionDate = new Date(session.start_date)
                        const dayName = format(sessionDate, 'EEEE')
                        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1)

                        // Extract time components
                        const startTime = sessionDate.toTimeString().split(' ')[0]
                        const endDate = new Date(session.end_date)
                        const endTime = endDate.toTimeString().split(' ')[0]

                        // Create a reference date for the time (using today's date)
                        const today = new Date()
                        const startDateTime = new Date(today)
                        const endDateTime = new Date(today)

                        const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number)
                        const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number)

                        startDateTime.setHours(startHours, startMinutes, startSeconds, 0)
                        endDateTime.setHours(endHours, endMinutes, endSeconds, 0)

                        finalTimes[capitalizedDayName] = {
                            start: startDateTime.toISOString(),
                            end: endDateTime.toISOString()
                        }
                    }
                }
            }

            // Delete all existing sessions for this class
            const { error: deleteSessionsError } = await supabase
                .from('class_sessions')
                .delete()
                .eq('class_id', classId)

            if (deleteSessionsError) throw deleteSessionsError

            // Generate new sessions
            if (finalStartDate && finalEndDate && finalDaysRepeated && Object.keys(finalTimes).length > 0) {
                const sessions = []

                // Helper function to get day name with capital first letter
                const getDayName = (date: Date) => {
                    const dayName = format(date, 'EEEE').toLowerCase()
                    // Convert to capital first letter (e.g., "monday" -> "Monday")
                    return dayName.charAt(0).toUpperCase() + dayName.slice(1)
                }

                // Generate sessions for each day in the date range
                let currentDate = new Date(finalStartDate)
                const endDateObj = new Date(finalEndDate)

                while (currentDate <= endDateObj) {
                    const dayName = getDayName(currentDate)

                    // Check if this day is in the days_repeated array
                    if (finalDaysRepeated.includes(dayName)) {
                        const timeSlot = finalTimes[dayName]
                        if (timeSlot) {
                            try {
                                // The times are already in ISO format, so we can use them directly
                                const startDateTime = new Date(timeSlot.start)
                                const endDateTime = new Date(timeSlot.end)

                                // Validate the dates
                                if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                                    throw new Error(`Invalid datetime format for ${dayName}: ${timeSlot.start} - ${timeSlot.end}`)
                                }

                                // Update the date part to match the current iteration date
                                const sessionStartDate = new Date(currentDate)
                                const sessionEndDate = new Date(currentDate)

                                // Extract time components from the ISO strings
                                const startTime = startDateTime.toTimeString().split(' ')[0]
                                const endTime = endDateTime.toTimeString().split(' ')[0]

                                const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number)
                                const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number)

                                sessionStartDate.setHours(startHours, startMinutes, startSeconds, 0)
                                sessionEndDate.setHours(endHours, endMinutes, endSeconds, 0)

                                sessions.push({
                                    class_id: classId,
                                    start_date: sessionStartDate.toISOString(),
                                    end_date: sessionEndDate.toISOString(),
                                    status: 'scheduled'
                                })
                            } catch (error) {
                                console.error(`Error creating session for ${dayName}:`, error)
                                throw new Error(`Failed to create session for ${dayName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
                            }
                        }
                    }

                    // Move to next day
                    currentDate = addDays(currentDate, 1)
                }

                // Insert all new sessions
                if (sessions.length > 0) {
                    const { error: sessionsError } = await supabase
                        .from('class_sessions')
                        .insert(sessions)

                    if (sessionsError) {
                        throw new Error(`Failed to create class sessions: ${sessionsError.message}`)
                    }
                }
            }
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
        return { success: false, error: { message: error instanceof Error ? error.message : String(error) } }
    }
}

export async function updateClassSession(params: {
    sessionId: string;
    action: string;
    newDate?: string;
    newStartTime?: string;
    newEndTime?: string;
    newStartDate?: string;
    newEndDate?: string;
}) {
    const supabase = createClient()
    const { sessionId, action, newDate, newStartTime, newEndTime, newStartDate, newEndDate } = params

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
                    .from('session_history')
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
                    .from('session_history')
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
                    .from('session_history')
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
                    .from('session_history')
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
                    .from('session_history')
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
                    .from('session_history')
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
        return { success: false, error: { message: error instanceof Error ? error.message : String(error) } }
    }
}

export async function updateSessionAttendance(params: { sessionId: string; attendance: Record<string, boolean> }) {
    const supabase = createClient()
    const { sessionId, attendance } = params

    try {
        // Validate input
        if (!sessionId) {
            throw new Error('Session ID is required')
        }

        if (!attendance || Object.keys(attendance).length === 0) {
            throw new Error('Attendance data is required')
        }

        // Prepare attendance records for upsert
        const attendanceRecords = Object.entries(attendance).map(([studentId, isPresent]) => ({
            session_id: sessionId,
            student_id: studentId,
            attendance_status: isPresent ? 'present' : 'absent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }))

        console.log('Attempting to upsert attendance records:', attendanceRecords)

        // Upsert attendance records
        const { error: upsertError } = await supabase
            .from('session_attendance')
            .upsert(attendanceRecords, {
                onConflict: 'session_id,student_id'
            })

        if (upsertError) {
            console.error('Supabase upsert error:', upsertError)
            throw new Error(`Database error: ${upsertError.message}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating attendance:', error)
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : String(error)
            }
        }
    }
}
