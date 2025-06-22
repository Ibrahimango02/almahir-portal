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

        return {
            success: true,
            message: 'Student successfully assigned to classes'
        }
    } catch (error) {
        console.error('Error in assignStudentToClasses:', error)
        throw error
    }
} 