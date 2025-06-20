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
        // Get all students for the selected classes
        const { data: classStudents, error: classStudentsError } = await supabase
            .from('class_students')
            .select('class_id, student_id')
            .in('class_id', data.class_ids)

        if (classStudentsError) {
            throw new Error(`Failed to fetch class students: ${classStudentsError.message}`)
        }

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

        // Create teacher_students records
        // First, get unique student IDs
        const uniqueStudentIds = [...new Set(classStudents.map(cs => cs.student_id))]

        const teacherStudentRecords = uniqueStudentIds.map(student_id => ({
            teacher_id: data.teacher_id,
            student_id
        }))

        const { error: teacherStudentsError } = await supabase
            .from('teacher_students')
            .insert(teacherStudentRecords)

        if (teacherStudentsError) {
            // If student assignment fails, attempt to roll back class assignments
            await supabase
                .from('class_teachers')
                .delete()
                .eq('teacher_id', data.teacher_id)
                .in('class_id', data.class_ids)

            throw new Error(`Failed to assign teacher to students: ${teacherStudentsError.message}`)
        }

        return {
            success: true,
            message: 'Teacher successfully assigned to classes and students'
        }
    } catch (error) {
        console.error('Error in assignTeacherToClass:', error)
        throw error
    }
}

export async function createTeacherAvailability(data: TeacherAvailabilityData) {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('teacher_availability')
            .insert({
                teacher_id: data.teacher_id,
                weekly_schedule: data.weekly_schedule
            })

        if (error) {
            throw new Error(`Failed to create teacher availability: ${error.message}`)
        }

        return {
            success: true,
            message: 'Teacher availability created successfully'
        }
    } catch (error) {
        console.error('Error in createTeacherAvailability:', error)
        throw error
    }
}