import { createClient } from "@/utils/supabase/client"

type TeacherAssignmentData = {
    teacher_id: string
    class_ids: string[]
}

export async function assignTeacherToClass(data: TeacherAssignmentData) {
    const supabase = createClient()

    try {
        // Create class_teachers records
        const classTeacherRecords = data.class_ids.map(class_id => ({
            class_id,
            teacher_id: data.teacher_id
        }))

        const { error: classTeachersError } = await supabase
            .from('class_teachers')
            .insert(classTeacherRecords)

        if (classTeachersError) {
            throw new Error(`Failed to assign teacher to classes: ${classTeachersError.message}`)
        }

        // Get students for each class to create teacher-student relationships
        const teacherStudentRecords: { teacher_id: string; student_id: string }[] = []

        for (const class_id of data.class_ids) {
            // Get students assigned to this class
            const { data: classStudents, error: classStudentsError } = await supabase
                .from('class_students')
                .select('student_id')
                .eq('class_id', class_id)

            if (classStudentsError) {
                console.error(`Error fetching students for class ${class_id}:`, classStudentsError)
                continue
            }

            // Create teacher-student records for each student in this class
            if (classStudents && classStudents.length > 0) {
                for (const classStudent of classStudents) {
                    teacherStudentRecords.push({
                        teacher_id: data.teacher_id,
                        student_id: classStudent.student_id
                    })
                }
            }
        }

        // Insert teacher-student relationships if any exist
        if (teacherStudentRecords.length > 0) {
            const { error: teacherStudentsError } = await supabase
                .from('teacher_students')
                .insert(teacherStudentRecords)

            if (teacherStudentsError) {
                console.error('Error creating teacher-student relationships:', teacherStudentsError)
                // Don't throw error here as the main operation (teacher assignment) was successful
            }
        }

        // Create teacher attendance records for existing class sessions
        const teacherAttendanceRecords: { session_id: string; teacher_id: string; attendance_status: string }[] = []

        for (const class_id of data.class_ids) {
            // Get existing sessions for this class
            const { data: classSessions, error: sessionsError } = await supabase
                .from('class_sessions')
                .select('id')
                .eq('class_id', class_id)

            if (sessionsError) {
                console.error(`Error fetching sessions for class ${class_id}:`, sessionsError)
                continue
            }

            // Create attendance records for each session
            if (classSessions && classSessions.length > 0) {
                for (const session of classSessions) {
                    teacherAttendanceRecords.push({
                        session_id: session.id,
                        teacher_id: data.teacher_id,
                        attendance_status: 'expected'
                    })
                }
            }
        }

        // Insert teacher attendance records if any exist
        if (teacherAttendanceRecords.length > 0) {
            const { error: teacherAttendanceError } = await supabase
                .from('teacher_attendance')
                .insert(teacherAttendanceRecords)

            if (teacherAttendanceError) {
                console.error('Error creating teacher attendance records:', teacherAttendanceError)
                // Don't throw error here as the main operations were successful
            }
        }

        return {
            success: true,
            message: 'Teacher successfully assigned to classes'
        }
    } catch (error) {
        console.error('Error in assignTeacherToClass:', error)
        throw error
    }
}
