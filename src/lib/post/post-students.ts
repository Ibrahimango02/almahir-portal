import { createClient } from "@/utils/supabase/client"

type AssignmentData = {
    student_id: string
    class_ids: string[]
}

export async function assignStudentToClasses(data: AssignmentData) {
    const supabase = createClient()

    try {
        // Get all teachers for the selected classes
        const { data: classTeachers, error: classTeachersError } = await supabase
            .from('class_teachers')
            .select('class_id, teacher_id')
            .in('class_id', data.class_ids)

        if (classTeachersError) {
            throw new Error(`Failed to fetch class teachers: ${classTeachersError.message}`)
        }

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

        // Create teacher_students records
        // First, get unique teacher IDs
        const uniqueTeacherIds = [...new Set(classTeachers.map(ct => ct.teacher_id))]

        const teacherStudentRecords = uniqueTeacherIds.map(teacher_id => ({
            teacher_id,
            student_id: data.student_id
        }))

        const { error: teacherStudentsError } = await supabase
            .from('teacher_students')
            .insert(teacherStudentRecords)

        if (teacherStudentsError) {
            // If teacher assignment fails, attempt to roll back class assignments
            await supabase
                .from('class_students')
                .delete()
                .eq('student_id', data.student_id)
                .in('class_id', data.class_ids)

            throw new Error(`Failed to assign student to teachers: ${teacherStudentsError.message}`)
        }

        return {
            success: true,
            message: 'Student successfully assigned to classes and teachers'
        }
    } catch (error) {
        console.error('Error in assignStudentToClasses:', error)
        throw error
    }
} 