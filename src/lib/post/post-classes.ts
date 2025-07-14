import { createClient } from "@/utils/supabase/client"
import { addDays, format } from 'date-fns'

type ClassData = {
    title: string
    description: string | null
    subject: string
    start_date: string
    end_date: string
    days_repeated: {
        monday?: { start: string; end: string }
        tuesday?: { start: string; end: string }
        wednesday?: { start: string; end: string }
        thursday?: { start: string; end: string }
        friday?: { start: string; end: string }
        saturday?: { start: string; end: string }
        sunday?: { start: string; end: string }
    }
    status: string
    class_link: string | null
    times: Record<string, { start: string; end: string }>
    teacher_id: string[]
    student_ids?: string[]
}

export async function createClass(classData: ClassData) {
    const supabase = createClient()

    try {
        // First, create the class record
        const { data: classRecord, error: classError } = await supabase
            .from('classes')
            .insert({
                title: classData.title,
                description: classData.description,
                subject: classData.subject,
                start_date: classData.start_date,
                end_date: classData.end_date,
                days_repeated: classData.days_repeated,
                status: 'active',
                class_link: classData.class_link
            })
            .select()
            .single()

        if (classError) {
            throw new Error(`Failed to create class: ${classError.message}`)
        }

        // Assign teachers to class
        if (classData.teacher_id.length > 0) {
            const teacherAssignments = classData.teacher_id.map(teacherId => ({
                class_id: classRecord.id,
                teacher_id: teacherId
            }))

            const { error: teacherError } = await supabase
                .from('class_teachers')
                .insert(teacherAssignments)

            if (teacherError) {
                throw new Error(`Failed to assign teachers: ${teacherError.message}`)
            }
        }

        // Assign students to class
        if (classData.student_ids && classData.student_ids.length > 0) {
            const studentEnrollments = classData.student_ids.map(studentId => ({
                class_id: classRecord.id,
                student_id: studentId
            }))

            const { error: studentError } = await supabase
                .from('class_students')
                .insert(studentEnrollments)

            if (studentError) {
                throw new Error(`Failed to enroll students: ${studentError.message}`)
            }
        }

        // Create teacher-student relationships for all combinations
        if (classData.teacher_id.length > 0 && classData.student_ids && classData.student_ids.length > 0) {
            const teacherStudentRecords: { teacher_id: string; student_id: string }[] = []

            for (const teacherId of classData.teacher_id) {
                for (const studentId of classData.student_ids) {
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

        // Generate class sessions for each day between start and end date
        const startDate = new Date(classData.start_date)
        const endDate = new Date(classData.end_date)
        const sessions = []

        // Helper function to get day name with capital first letter
        const getDayName = (date: Date) => {
            const dayName = format(date, 'EEEE').toLowerCase()
            // Convert to capital first letter (e.g., "monday" -> "Monday")
            return dayName.charAt(0).toUpperCase() + dayName.slice(1)
        }

        // Generate sessions for each day in the date range
        let currentDate = startDate
        while (currentDate <= endDate) {
            const dayName = getDayName(currentDate)
            const lowercaseDayName = dayName.toLowerCase()

            // Check if this day has a schedule in days_repeated
            const daySchedule = classData.days_repeated[lowercaseDayName as keyof typeof classData.days_repeated]
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
                        class_id: classRecord.id,
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

        // Insert all sessions
        if (sessions.length > 0) {
            const { data: createdSessions, error: sessionsError } = await supabase
                .from('class_sessions')
                .insert(sessions)
                .select('id')

            if (sessionsError) {
                // If session creation fails, attempt to delete the class and assignments
                await supabase
                    .from('class_teachers')
                    .delete()
                    .eq('class_id', classRecord.id)
                await supabase
                    .from('class_students')
                    .delete()
                    .eq('class_id', classRecord.id)
                await supabase
                    .from('classes')
                    .delete()
                    .eq('id', classRecord.id)

                throw new Error(`Failed to create class sessions: ${sessionsError.message}`)
            }

            // Create attendance records for each session
            if (createdSessions && createdSessions.length > 0) {
                const teacherAttendanceRecords = []
                const studentAttendanceRecords = []

                for (const session of createdSessions) {
                    // Create teacher attendance records
                    if (classData.teacher_id.length > 0) {
                        for (const teacherId of classData.teacher_id) {
                            teacherAttendanceRecords.push({
                                session_id: session.id,
                                teacher_id: teacherId,
                                attendance_status: 'scheduled'
                            })
                        }
                    }

                    // Create student attendance records
                    if (classData.student_ids && classData.student_ids.length > 0) {
                        for (const studentId of classData.student_ids) {
                            studentAttendanceRecords.push({
                                session_id: session.id,
                                student_id: studentId,
                                attendance_status: 'scheduled'
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

        return classRecord
    } catch (error) {
        console.error('Error in createClass:', error)
        throw error
    }
}