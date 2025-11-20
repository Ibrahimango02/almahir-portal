import { createClient } from "@/utils/supabase/client"

export async function updateStudent(studentId: string, data: { notes?: string; status: string; birth_date?: string | null }) {
    const supabase = createClient()

    // First, check if this is a dependent or independent student
    const { data: student, error: studentFetchError } = await supabase
        .from('students')
        .select('student_type, profile_id')
        .eq('id', studentId)
        .single()

    if (studentFetchError || !student) {
        throw new Error(`Failed to fetch student: ${studentFetchError?.message}`)
    }

    // Update student table
    const { error: studentError } = await supabase
        .from('students')
        .update({
            notes: data.notes,
            birth_date: data.birth_date || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', studentId)

    if (studentError) {
        throw new Error(`Failed to update student: ${studentError.message}`)
    }

    // Update status based on student type
    if (student.student_type === 'dependent') {
        // For dependent students, update status in child_profiles
        const { error: childProfileError } = await supabase
            .from('child_profiles')
            .update({
                status: data.status,
                updated_at: new Date().toISOString()
            })
            .eq('student_id', studentId)

        if (childProfileError) {
            throw new Error(`Failed to update child profile: ${childProfileError.message}`)
        }
    } else if (student.student_type === 'independent' && student.profile_id) {
        // For independent students, update status in profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                status: data.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', student.profile_id)

        if (profileError) {
            throw new Error(`Failed to update profile: ${profileError.message}`)
        }
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
