import { createClient } from "@/utils/supabase/client"
import { WeeklySchedule } from "@/types"

export async function updateTeacher(teacherId: string, data: { specialization?: string; hourly_rate?: string; status?: string; moderator_id?: string; notes?: string; class_link?: string }) {
    const supabase = createClient()

    // Start a transaction by updating both tables
    const { error: teacherError } = await supabase
        .from('teachers')
        .update({
            specialization: data.specialization,
            hourly_rate: parseFloat(data.hourly_rate || '0'),
            moderator_id: data.moderator_id || null,
            notes: data.notes || null,
            class_link: data.class_link || null
        })
        .eq('profile_id', teacherId)

    if (teacherError) {
        throw new Error(`Failed to update teacher: ${teacherError.message}`)
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            status: data.status
        })
        .eq('id', teacherId)

    if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`)
    }

    return { success: true }
}

export async function updateTeacherAvailability(teacherId: string, weeklySchedule: WeeklySchedule) {
    const supabase = createClient()

    try {
        // First, check if availability record exists
        const { data: existingAvailability } = await supabase
            .from('teacher_availability')
            .select('id')
            .eq('teacher_id', teacherId)
            .single()

        if (existingAvailability) {
            // Update existing record
            const { error } = await supabase
                .from('teacher_availability')
                .update({
                    weekly_schedule: weeklySchedule,
                    updated_at: new Date().toISOString()
                })
                .eq('teacher_id', teacherId)

            if (error) {
                throw new Error(`Failed to update teacher availability: ${error.message}`)
            }
        } else {
            // Create new record
            const { error } = await supabase
                .from('teacher_availability')
                .insert({
                    teacher_id: teacherId,
                    weekly_schedule: weeklySchedule
                })

            if (error) {
                throw new Error(`Failed to create teacher availability: ${error.message}`)
            }
        }

        return {
            success: true,
            message: existingAvailability ? 'Teacher availability updated successfully' : 'Teacher availability created successfully'
        }
    } catch (error) {
        console.error('Error in updateTeacherAvailability:', error)
        throw error
    }
}

export async function updateTeacherAttendance(teacherId: string, sessionId: string, attendanceStatus: string) {
    const supabase = createClient()

    try {
        // Check if attendance record already exists
        const { data: existingAttendance } = await supabase
            .from('teacher_attendance')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('session_id', sessionId)
            .single()

        if (existingAttendance) {
            // Update existing attendance record
            const { error } = await supabase
                .from('teacher_attendance')
                .update({
                    attendance_status: attendanceStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('teacher_id', teacherId)
                .eq('session_id', sessionId)

            if (error) {
                throw new Error(`Failed to update teacher attendance: ${error.message}`)
            }
        } else {
            // Create new attendance record
            const { error } = await supabase
                .from('teacher_attendance')
                .insert({
                    teacher_id: teacherId,
                    session_id: sessionId,
                    attendance_status: attendanceStatus
                })

            if (error) {
                throw new Error(`Failed to create teacher attendance: ${error.message}`)
            }
        }

        return {
            success: true,
            message: existingAttendance ? 'Teacher attendance updated successfully' : 'Teacher attendance created successfully'
        }
    } catch (error) {
        console.error('Error in updateTeacherAttendance:', error)
        throw error
    }
}
