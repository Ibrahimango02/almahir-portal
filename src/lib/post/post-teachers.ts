import { createClient } from "@/utils/supabase/client"
import { WeeklySchedule } from "@/types"

type TeacherAssignmentData = {
    teacher_id: string
    class_ids: string[]
}

type TeacherAvailabilityData = {
    teacher_id: string
    weekly_schedule: WeeklySchedule
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

        return {
            success: true,
            message: 'Teacher successfully assigned to classes'
        }
    } catch (error) {
        console.error('Error in assignTeacherToClass:', error)
        throw error
    }
}
