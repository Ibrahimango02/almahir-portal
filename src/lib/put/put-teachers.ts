import { createClient } from "@/utils/supabase/client"

export async function updateTeacher(teacherId: string, data: any) {
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
