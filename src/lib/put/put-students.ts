import { createClient } from "@/utils/supabase/client"

export async function updateStudent(studentId: string, data: { grade_level?: string; notes?: string; status: string }) {
    const supabase = createClient()

    // Start a transaction by updating both tables
    const { error: studentError } = await supabase
        .from('students')
        .update({
            grade_level: data.grade_level,
            notes: data.notes,
            updated_at: new Date().toISOString()
        })
        .eq('profile_id', studentId)

    if (studentError) {
        throw new Error(`Failed to update student: ${studentError.message}`)
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            status: data.status,
            updated_at: new Date().toISOString()
        })
        .eq('id', studentId)

    if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`)
    }

    return { success: true }
}

export async function updateStudentAttendance(studentId: string, sessionId: string, attendanceStatus: string) {
    const supabase = createClient()

    try {
        // Check if attendance record already exists
        const { data: existingAttendance } = await supabase
            .from('student_attendance')
            .select('id')
            .eq('student_id', studentId)
            .eq('session_id', sessionId)
            .single()

        if (existingAttendance) {
            // Update existing attendance record
            const { error } = await supabase
                .from('student_attendance')
                .update({
                    attendance_status: attendanceStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('student_id', studentId)
                .eq('session_id', sessionId)

            if (error) {
                throw new Error(`Failed to update student attendance: ${error.message}`)
            }
        } else {
            // Create new attendance record
            const { error } = await supabase
                .from('student_attendance')
                .insert({
                    student_id: studentId,
                    session_id: sessionId,
                    attendance_status: attendanceStatus
                })

            if (error) {
                throw new Error(`Failed to create student attendance: ${error.message}`)
            }
        }

        return {
            success: true,
            message: existingAttendance ? 'Student attendance updated successfully' : 'Student attendance created successfully'
        }
    } catch (error) {
        console.error('Error in updateStudentAttendance:', error)
        throw error
    }
}
