import { createClient } from "@/utils/supabase/client"
import { WeeklySchedule } from "@/types"

export async function updateTeacher(teacherId: string, data: { specialization?: string; hourly_rate: string; status: string }) {
    const supabase = createClient()

    // Start a transaction by updating both tables
    const { error: teacherError } = await supabase
        .from('teachers')
        .update({
            specialization: data.specialization,
            hourly_rate: parseFloat(data.hourly_rate),
            updated_at: new Date().toISOString()
        })
        .eq('profile_id', teacherId)

    if (teacherError) {
        throw new Error(`Failed to update teacher: ${teacherError.message}`)
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            status: data.status,
            updated_at: new Date().toISOString()
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
