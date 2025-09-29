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
    days_repeated?: {
        monday?: { start: string; end: string }
        tuesday?: { start: string; end: string }
        wednesday?: { start: string; end: string }
        thursday?: { start: string; end: string }
        friday?: { start: string; end: string }
        saturday?: { start: string; end: string }
        sunday?: { start: string; end: string }
    };
    class_link?: string | null;
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
            days_repeated?: {
                monday?: { start: string; end: string }
                tuesday?: { start: string; end: string }
                wednesday?: { start: string; end: string }
                thursday?: { start: string; end: string }
                friday?: { start: string; end: string }
                saturday?: { start: string; end: string }
                sunday?: { start: string; end: string }
            };
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

            // Get existing sessions and separate them by date
            const { data: existingSessions, error: fetchSessionsError } = await supabase
                .from('class_sessions')
                .select('id, start_date, end_date')
                .eq('class_id', classId)
                .order('start_date')

            if (fetchSessionsError) throw fetchSessionsError

            // Separate sessions into past and future/current
            const now = new Date()
            const futureSessions = existingSessions?.filter(session => new Date(session.start_date) > now) || []

            // Only delete future/current sessions, preserve past sessions
            // Attendance records will be automatically deleted due to CASCADE constraints
            if (futureSessions.length > 0) {
                const futureSessionIds = futureSessions.map(session => session.id)

                // Delete future sessions (attendance records will cascade automatically)
                const { error: deleteSessionsError } = await supabase
                    .from('class_sessions')
                    .delete()
                    .in('id', futureSessionIds)

                if (deleteSessionsError) throw deleteSessionsError
            }

            // Generate new sessions
            if (finalStartDate && finalEndDate && finalDaysRepeated && Object.keys(finalTimes).length > 0) {
                const sessions = []

                // Helper function to get day name with capital first letter
                const getDayName = (date: Date) => {
                    const dayName = format(date, 'EEEE').toLowerCase()
                    // Convert to capital first letter (e.g., "monday" -> "Monday")
                    return dayName.charAt(0).toUpperCase() + dayName.slice(1)
                }

                // Generate sessions for each day in the date range, starting from today or the start date (whichever is later)
                const now = new Date()
                const startDateObj = new Date(finalStartDate)
                const endDateObj = new Date(finalEndDate)

                // Use the later of today or the start date to avoid creating past sessions
                let currentDate = now > startDateObj ? now : startDateObj

                // If the start date is in the future, use that instead
                if (startDateObj > now) {
                    currentDate = startDateObj
                }

                while (currentDate <= endDateObj) {
                    const dayName = getDayName(currentDate)
                    const lowercaseDayName = dayName.toLowerCase()

                    // Check if this day has a schedule in days_repeated
                    const daySchedule = finalDaysRepeated[lowercaseDayName as keyof typeof finalDaysRepeated]
                    if (daySchedule) {
                        try {
                            // Create ISO datetime strings by combining the current date with the time
                            const [startHours, startMinutes] = daySchedule.start.split(':').map(Number)
                            const [endHours, endMinutes] = daySchedule.end.split(':').map(Number)

                            const sessionStartDate = new Date(currentDate)
                            const sessionEndDate = new Date(currentDate)

                            sessionStartDate.setHours(startHours, startMinutes, 0, 0)
                            sessionEndDate.setHours(endHours, endMinutes, 0, 0)

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

                    // Move to next day
                    currentDate = addDays(currentDate, 1)
                }

                // Insert all new sessions
                if (sessions.length > 0) {
                    const { data: createdSessions, error: sessionsError } = await supabase
                        .from('class_sessions')
                        .insert(sessions)
                        .select('id')

                    if (sessionsError) {
                        throw new Error(`Failed to create class sessions: ${sessionsError.message}`)
                    }

                    // Get current teacher and student assignments for attendance records
                    const { data: currentTeachers } = await supabase
                        .from('class_teachers')
                        .select('teacher_id')
                        .eq('class_id', classId)

                    const { data: currentStudents } = await supabase
                        .from('class_students')
                        .select('student_id')
                        .eq('class_id', classId)

                    // Create attendance records for each session
                    if (createdSessions && createdSessions.length > 0) {
                        const teacherAttendanceRecords = []
                        const studentAttendanceRecords = []

                        for (const session of createdSessions) {
                            // Create teacher attendance records
                            if (currentTeachers && currentTeachers.length > 0) {
                                for (const teacher of currentTeachers) {
                                    teacherAttendanceRecords.push({
                                        session_id: session.id,
                                        teacher_id: teacher.teacher_id,
                                        attendance_status: 'expected'
                                    })
                                }
                            }

                            // Create student attendance records
                            if (currentStudents && currentStudents.length > 0) {
                                for (const student of currentStudents) {
                                    studentAttendanceRecords.push({
                                        session_id: session.id,
                                        student_id: student.student_id,
                                        attendance_status: 'expected'
                                    })
                                }
                            }
                        }

                        // Insert teacher attendance records
                        if (teacherAttendanceRecords.length > 0) {
                            const { error: teacherAttendanceError } = await supabase
                                .from('teacher_attendance')
                                .insert(teacherAttendanceRecords)

                            if (teacherAttendanceError) {
                                console.error('Error creating teacher attendance records:', teacherAttendanceError)
                                // Don't throw error here as the main operations were successful
                            }
                        }

                        // Insert student attendance records
                        if (studentAttendanceRecords.length > 0) {
                            const { error: studentAttendanceError } = await supabase
                                .from('student_attendance')
                                .insert(studentAttendanceRecords)

                            if (studentAttendanceError) {
                                console.error('Error creating student attendance records:', studentAttendanceError)
                                // Don't throw error here as the main operations were successful
                            }
                        }
                    }
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating class:', error)
        return { success: false, error: { message: error instanceof Error ? error.message : String(error) } }
    }
}

export async function updateSession(params: {
    sessionId: string;
    action: string;
    studentAttendance?: Record<string, boolean>;
}) {
    const supabase = createClient()
    const { sessionId, action, studentAttendance } = params

    try {
        switch (action.toLowerCase()) {
            case 'initiate': {
                // Create class history record and update session status
                const { error: historyError } = await supabase
                    .from('session_history')
                    .upsert({
                        session_id: sessionId,
                        notes: 'session initiated'
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
                    .update({ actual_start_time: now, notes: 'session started' })
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

                // Determine session status based on student attendance
                let sessionStatus = 'complete'
                if (studentAttendance) {
                    // Check if any students were present
                    const hasPresentStudents = Object.values(studentAttendance).some(isPresent => isPresent)
                    if (!hasPresentStudents) {
                        sessionStatus = 'absence'
                    }
                }

                // Update class history with end time
                const { error: historyError } = await supabase
                    .from('session_history')
                    .update({
                        actual_end_time: now,
                        notes: sessionStatus === 'absence' ? 'session ended - no students present' : 'session ended'
                    })
                    .eq('session_id', sessionId)

                if (historyError) throw historyError

                // Update session status
                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({ status: sessionStatus })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError

                // Update attendance records if provided
                if (studentAttendance) {
                    const attendanceResult = await updateSessionAttendance({
                        sessionId,
                        studentAttendance
                    })

                    if (!attendanceResult.success) {
                        console.error('Error updating attendance records:', attendanceResult.error)
                        // Don't throw error here as the main operations were successful
                    }
                }

                // --- Teacher Payments Logic ---
                // Only process payments if session is complete (not absence)
                if (sessionStatus === 'complete') {
                    // 1. Get session info (start_date, end_date, class_id)
                    const { data: sessionData, error: sessionFetchError } = await supabase
                        .from('class_sessions')
                        .select('id, class_id, start_date, end_date')
                        .eq('id', sessionId)
                        .single()
                    if (sessionFetchError) throw sessionFetchError
                    if (!sessionData) throw new Error('Session not found')

                    // 2. Get teachers for the class
                    const { data: classTeachers, error: teachersError } = await supabase
                        .from('class_teachers')
                        .select('teacher_id')
                        .eq('class_id', sessionData.class_id)
                    if (teachersError) throw teachersError
                    const teacherIds = classTeachers?.map(t => t.teacher_id) || []
                    if (teacherIds.length === 0) break // No teachers to pay

                    // 3. Get hourly_rate and is_admin for each teacher
                    const { data: teacherRates, error: ratesError } = await supabase
                        .from('teachers')
                        .select('profile_id, hourly_rate, is_admin')
                        .in('profile_id', teacherIds)
                    if (ratesError) throw ratesError

                    // 4. Calculate intended duration in hours
                    const start = new Date(sessionData.start_date)
                    const end = new Date(sessionData.end_date)
                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

                    // 5. Insert payment row for each teacher (only if is_admin === false)
                    const paymentRows = teacherRates
                        .filter(tr => tr.is_admin === false)
                        .map(tr => ({
                            teacher_id: tr.profile_id,
                            session_id: sessionId,
                            hours,
                            amount: tr.hourly_rate !== null ? Number(hours) * Number(tr.hourly_rate) : 0,
                            status: 'pending',
                        }))
                    if (paymentRows.length > 0) {
                        const { error: paymentError } = await supabase
                            .from('teacher_payments')
                            .insert(paymentRows)
                        if (paymentError) throw paymentError
                    }
                }
                // --- End Teacher Payments Logic ---

                break
            }

            case 'leave': {
                const { error: historyError } = await supabase
                    .from('session_history')
                    .upsert({
                        session_id: sessionId,
                        notes: 'session cancelled'
                    }, {
                        onConflict: 'session_id'
                    })

                if (historyError) throw historyError

                const { error: sessionError } = await supabase
                    .from('class_sessions')
                    .update({
                        status: 'cancelled'
                    })
                    .eq('id', sessionId)

                if (sessionError) throw sessionError
                break
            }

            default:
                throw new Error(`Invalid action: ${action}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating session:', error)
        return { success: false, error: { message: error instanceof Error ? error.message : String(error) } }
    }
}

export async function rescheduleSession(params: {
    sessionId: string;
    newStartDate: string;
    newEndDate: string;
}): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = createClient()
    const { sessionId, newStartDate, newEndDate } = params

    try {
        // 1. Get the current session details
        const { data: currentSession, error: fetchError } = await supabase
            .from('class_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (fetchError) throw fetchError
        if (!currentSession) throw new Error('Session not found')

        // 2. Validate that the new date is in the future
        const newStart = new Date(newStartDate)
        const now = new Date()
        if (newStart <= now) {
            throw new Error('New session date must be in the future')
        }

        // 3. Cancel the current session
        const { error: cancelError } = await supabase
            .from('class_sessions')
            .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)

        if (cancelError) throw cancelError

        // 4. Create a new session with the new dates
        const { data: newSession, error: createError } = await supabase
            .from('class_sessions')
            .insert({
                class_id: currentSession.class_id,
                start_date: newStartDate,
                end_date: newEndDate,
                status: 'scheduled',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('id')
            .single()

        if (createError) throw createError
        if (!newSession) throw new Error('Failed to create new session')

        // 5. Get current teacher and student assignments for the class
        const { data: currentTeachers } = await supabase
            .from('class_teachers')
            .select('teacher_id')
            .eq('class_id', currentSession.class_id)

        const { data: currentStudents } = await supabase
            .from('class_students')
            .select('student_id')
            .eq('class_id', currentSession.class_id)

        // 6. Create attendance records for the new session
        const teacherAttendanceRecords = []
        const studentAttendanceRecords = []

        // Create teacher attendance records
        if (currentTeachers && currentTeachers.length > 0) {
            for (const teacher of currentTeachers) {
                teacherAttendanceRecords.push({
                    session_id: newSession.id,
                    teacher_id: teacher.teacher_id,
                    attendance_status: 'expected'
                })
            }
        }

        // Create student attendance records
        if (currentStudents && currentStudents.length > 0) {
            for (const student of currentStudents) {
                studentAttendanceRecords.push({
                    session_id: newSession.id,
                    student_id: student.student_id,
                    attendance_status: 'expected'
                })
            }
        }

        // Insert teacher attendance records
        if (teacherAttendanceRecords.length > 0) {
            const { error: teacherAttendanceError } = await supabase
                .from('teacher_attendance')
                .insert(teacherAttendanceRecords)

            if (teacherAttendanceError) {
                console.error('Error creating teacher attendance records:', teacherAttendanceError)
                // Don't throw error here as the main operations were successful
            }
        }

        // Insert student attendance records
        if (studentAttendanceRecords.length > 0) {
            const { error: studentAttendanceError } = await supabase
                .from('student_attendance')
                .insert(studentAttendanceRecords)

            if (studentAttendanceError) {
                console.error('Error creating student attendance records:', studentAttendanceError)
                // Don't throw error here as the main operations were successful
            }
        }

        return { success: true }
    } catch (error) {
        console.error('Error rescheduling session:', error)
        return { success: false, error: { message: error instanceof Error ? error.message : String(error) } }
    }
}

export async function updateSessionAttendance(params: {
    sessionId: string;
    studentAttendance?: Record<string, boolean>;
    teacherAttendance?: Record<string, boolean>;
}) {
    const supabase = createClient()
    const { sessionId, studentAttendance, teacherAttendance } = params

    try {
        // Validate input
        if (!sessionId) {
            throw new Error('Session ID is required')
        }

        if (!studentAttendance || Object.keys(studentAttendance).length === 0) {
            throw new Error('Student attendance data is required')
        }



        // Allow updating all student attendance records, regardless of current status
        // This enables teachers to modify attendance multiple times
        // For new sessions, we'll create records for all students
        // Use all provided student attendance data for updates
        const filteredStudentAttendance = studentAttendance

        // Prepare student attendance records for update
        const studentAttendanceRecords = Object.entries(filteredStudentAttendance).map(([studentId, isPresent]) => ({
            session_id: sessionId,
            student_id: studentId,
            attendance_status: isPresent ? 'present' : 'absent',
            updated_at: new Date().toISOString()
        }))

        // Update student attendance records
        if (studentAttendanceRecords.length > 0) {
            const { error: updateStudentError } = await supabase
                .from('student_attendance')
                .upsert(studentAttendanceRecords, {
                    onConflict: 'session_id,student_id'
                })

            if (updateStudentError) {
                console.error('Supabase student attendance update error:', updateStudentError)
                throw new Error(`Database error: ${updateStudentError.message}`)
            }
        }

        // Handle teacher attendance if provided
        if (teacherAttendance && Object.keys(teacherAttendance).length > 0) {


            // Allow updating all teacher attendance records, regardless of current status
            // This enables teachers to modify attendance multiple times
            // For new sessions, we'll create records for all teachers
            // Use all provided teacher attendance data for updates
            const filteredTeacherAttendance = teacherAttendance

            // Prepare teacher attendance records for update
            const teacherAttendanceRecords = Object.entries(filteredTeacherAttendance).map(([teacherId, isPresent]) => ({
                session_id: sessionId,
                teacher_id: teacherId,
                attendance_status: isPresent ? 'present' : 'absent',
                updated_at: new Date().toISOString()
            }))

            // Update teacher attendance records
            if (teacherAttendanceRecords.length > 0) {
                const { error: updateTeacherError } = await supabase
                    .from('teacher_attendance')
                    .upsert(teacherAttendanceRecords, {
                        onConflict: 'session_id,teacher_id'
                    })

                if (updateTeacherError) {
                    console.error('Supabase teacher attendance update error:', updateTeacherError)
                    throw new Error(`Database error: ${updateTeacherError.message}`)
                }
            }
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

export async function updateClassAttendance(params: {
    classId: string;
    teacher_ids: string[];
    student_ids: string[];
}): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = createClient()
    const { classId, teacher_ids, student_ids } = params

    try {
        // Get existing sessions for this class
        const { data: existingSessions } = await supabase
            .from('class_sessions')
            .select('id, start_date')
            .eq('class_id', classId)

        if (existingSessions && existingSessions.length > 0) {
            // Separate sessions into past and future/current
            const now = new Date()
            const futureSessions = existingSessions.filter(session => new Date(session.start_date) >= now)

            if (futureSessions.length > 0) {
                // Delete existing attendance records for future sessions only
                // This is still needed because we're updating assignments, not deleting sessions
                const futureSessionIds = futureSessions.map(session => session.id)

                await supabase
                    .from('teacher_attendance')
                    .delete()
                    .in('session_id', futureSessionIds)

                await supabase
                    .from('student_attendance')
                    .delete()
                    .in('session_id', futureSessionIds)

                // Create new teacher attendance records for future sessions only
                if (teacher_ids.length > 0) {
                    const teacherAttendanceRecords = []
                    for (const session of futureSessions) {
                        for (const teacherId of teacher_ids) {
                            teacherAttendanceRecords.push({
                                session_id: session.id,
                                teacher_id: teacherId,
                                attendance_status: 'expected'
                            })
                        }
                    }

                    if (teacherAttendanceRecords.length > 0) {
                        const { error: teacherAttendanceError } = await supabase
                            .from('teacher_attendance')
                            .insert(teacherAttendanceRecords)

                        if (teacherAttendanceError) {
                            console.error('Error updating teacher attendance records:', teacherAttendanceError)
                        }
                    }
                }

                // Create new student attendance records for future sessions only
                if (student_ids.length > 0) {
                    const studentAttendanceRecords = []
                    for (const session of futureSessions) {
                        for (const studentId of student_ids) {
                            studentAttendanceRecords.push({
                                session_id: session.id,
                                student_id: studentId,
                                attendance_status: 'expected'
                            })
                        }
                    }

                    if (studentAttendanceRecords.length > 0) {
                        const { error: studentAttendanceError } = await supabase
                            .from('student_attendance')
                            .insert(studentAttendanceRecords)

                        if (studentAttendanceError) {
                            console.error('Error updating student attendance records:', studentAttendanceError)
                        }
                    }
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating class attendance:', error)
        return { success: false, error: { message: error instanceof Error ? error.message : String(error) } }
    }
}

export async function updateClassAssignments(params: {
    classId: string;
    teacher_ids: string[];
    student_ids: string[];
}): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = createClient()
    const { classId, teacher_ids, student_ids } = params

    try {
        // Get current assignments to know what relationships to remove
        const { data: currentTeachers } = await supabase
            .from('class_teachers')
            .select('teacher_id')
            .eq('class_id', classId)

        const { data: currentStudents } = await supabase
            .from('class_students')
            .select('student_id')
            .eq('class_id', classId)

        // First, remove all existing teacher and student assignments for this class
        const { error: deleteTeacherError } = await supabase
            .from('class_teachers')
            .delete()
            .eq('class_id', classId)

        if (deleteTeacherError) throw deleteTeacherError

        const { error: deleteStudentError } = await supabase
            .from('class_students')
            .delete()
            .eq('class_id', classId)

        if (deleteStudentError) throw deleteStudentError

        // Remove teacher-student relationships that were based on this class
        // We need to remove relationships between current teachers and current students
        if (currentTeachers && currentStudents && currentTeachers.length > 0 && currentStudents.length > 0) {
            const currentTeacherIds = currentTeachers.map(t => t.teacher_id)
            const currentStudentIds = currentStudents.map(s => s.student_id)

            // Remove all combinations of current teachers and current students
            for (const teacherId of currentTeacherIds) {
                for (const studentId of currentStudentIds) {
                    const { error: deleteTeacherStudentError } = await supabase
                        .from('teacher_students')
                        .delete()
                        .eq('teacher_id', teacherId)
                        .eq('student_id', studentId)

                    if (deleteTeacherStudentError) {
                        console.error('Error deleting teacher-student relationship:', deleteTeacherStudentError)
                    }
                }
            }
        }

        // Add new teacher assignments
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

        // Add new student assignments
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

        // Create teacher-student relationships for all combinations
        if (teacher_ids.length > 0 && student_ids.length > 0) {
            const teacherStudentRecords: { teacher_id: string; student_id: string }[] = []

            for (const teacherId of teacher_ids) {
                for (const studentId of student_ids) {
                    teacherStudentRecords.push({
                        teacher_id: teacherId,
                        student_id: studentId
                    })
                }
            }

            if (teacherStudentRecords.length > 0) {
                const { error: teacherStudentsError } = await supabase
                    .from('teacher_students')
                    .insert(teacherStudentRecords)

                if (teacherStudentsError) {
                    console.error('Error creating teacher-student relationships:', teacherStudentsError)
                    // Don't throw error here as the main operations were successful
                }
            }
        }

        // Update attendance records for the new assignments
        await updateClassAttendance({
            classId,
            teacher_ids,
            student_ids
        })

        return { success: true }
    } catch (error) {
        console.error('Error updating class assignments:', error)
        return { success: false, error: { message: error instanceof Error ? error.message : String(error) } }
    }
}
