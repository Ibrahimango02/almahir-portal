import { createClient } from "@/utils/supabase/client"

export async function updateStudent(studentId: string, data: any) {
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
