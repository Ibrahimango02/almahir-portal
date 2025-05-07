import { createClient } from "@/utils/supabase/client"
import { getParentStudents } from "@/lib/get/get-parents"

export async function updateParent(parentId: string, data: any) {
    const supabase = createClient()
    const parentStudents = await getParentStudents(parentId)

    // If student_id is provided, update the parent_students relationship
    if (data.student_id && parentStudents && !parentStudents.some(student => student.id === data.student_id)) {
        const { error: parentError } = await supabase
            .from('parent_students')
            .upsert({
                parent_id: parentId,
                student_id: data.student_id,
                updated_at: new Date().toISOString()
            })
            .eq('parent_id', parentId)
            .eq('student_id', data.student_id)

        if (parentError) {
            throw new Error(`Failed to update parent: ${parentError.message}`)
        }
    }

    // Always update the profile status
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            status: data.status,
            updated_at: new Date().toISOString()
        })
        .eq('id', parentId)

    if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`)
    }

    return { success: true }
}

export async function updateParentStudents(parentId: string, data: { student_id: string[] }) {
    const supabase = createClient()
    const parentStudents = await getParentStudents(parentId)

    if (!parentStudents) {
        return { success: true }
    }

    if (!data.student_id) {
        // Delete all parent_students
        const { error: parentError } = await supabase
            .from('parent_students')
            .delete()
            .eq('parent_id', parentId)
    }

    // Loop through the students in parent_students and remove the ones that are not in the data.student_id array
    if (data.student_id) {
        for (const student of parentStudents) {
            if (!data.student_id.includes(student.id)) {
                const { error: parentError } = await supabase
                    .from('parent_students')
                    .delete()
                    .eq('parent_id', parentId)
                    .eq('student_id', student.id)
            }
        }
    }
}
