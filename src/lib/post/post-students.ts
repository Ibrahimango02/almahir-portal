import { createClient } from "@/utils/supabase/client"

type AssignmentData = {
    student_id: string
    class_ids: string[]
}

export async function assignStudentToClasses(data: AssignmentData) {
    const supabase = createClient()

    try {
        // Create class_students records
        const classStudentRecords = data.class_ids.map(class_id => ({
            class_id,
            student_id: data.student_id
        }))

        const { error: classStudentsError } = await supabase
            .from('class_students')
            .insert(classStudentRecords)

        if (classStudentsError) {
            throw new Error(`Failed to assign student to classes: ${classStudentsError.message}`)
        }

        // Get teachers for each class to create teacher-student relationships
        const teacherStudentRecords: { teacher_id: string; student_id: string }[] = []

        for (const class_id of data.class_ids) {
            // Get teachers assigned to this class
            const { data: classTeachers, error: classTeachersError } = await supabase
                .from('class_teachers')
                .select('teacher_id')
                .eq('class_id', class_id)

            if (classTeachersError) {
                console.error(`Error fetching teachers for class ${class_id}:`, classTeachersError)
                continue
            }

            // Create teacher-student records for each teacher in this class
            if (classTeachers && classTeachers.length > 0) {
                for (const classTeacher of classTeachers) {
                    teacherStudentRecords.push({
                        teacher_id: classTeacher.teacher_id,
                        student_id: data.student_id
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
                // Don't throw error here as the main operation (class assignment) was successful
            }
        }

        // Create student attendance records for existing class sessions
        const studentAttendanceRecords: { session_id: string; student_id: string; attendance_status: string }[] = []

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
                    studentAttendanceRecords.push({
                        session_id: session.id,
                        student_id: data.student_id,
                        attendance_status: 'expected'
                    })
                }
            }
        }

        // Insert student attendance records if any exist
        if (studentAttendanceRecords.length > 0) {
            const { error: studentAttendanceError } = await supabase
                .from('student_attendance')
                .insert(studentAttendanceRecords)

            if (studentAttendanceError) {
                console.error('Error creating student attendance records:', studentAttendanceError)
                // Don't throw error here as the main operations were successful
            }
        }

        return {
            success: true,
            message: 'Student successfully assigned to classes'
        }
    } catch (error) {
        console.error('Error in assignStudentToClasses:', error)
        throw error
    }
} 