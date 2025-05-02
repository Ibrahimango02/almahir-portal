import { createClient } from '@/utils/supabase/client'

export async function getParents() {
    const supabase = await createClient()

    // select profiles of users who are parents
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
        .eq('role', 'parent')

    // select teacher-specific data
    const profileIds = profile?.map(p => p.id) || []

    // Get parent-student relationships
    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('parent_id, student_id')
        .in('parent_id', profileIds)

    // Get student information
    const studentIds = [...new Set(parentStudents?.map(ps => ps.student_id) || [])]

    const { data: students } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds)

    // Combine the data
    const parentsWithStudents = profile?.map(parent => {
        // Find all student IDs for this parent
        const parentStudentIds = parentStudents
            ?.filter(ps => ps.parent_id === parent.id)
            .map(ps => ps.student_id) || []

        // Get the student details for each ID
        const parentStudentDetails = parentStudentIds.map(studentId => {
            const student = students?.find(s => s.id === studentId)
            return student ? {
                id: student.id,
                name: `${student.first_name} ${student.last_name}`
            } : null
        }).filter(Boolean)

        return {
            ...parent,
            students: parentStudentDetails
        }
    }) || []


    return parentsWithStudents
}
