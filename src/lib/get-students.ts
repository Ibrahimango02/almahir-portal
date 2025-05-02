import { createClient } from '@/utils/supabase/client'

export async function getStudents() {
    const supabase = await createClient()

    // Get student profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, status, created_at')
        .eq('role', 'student')

    // Get student-specific data (including birth_date)
    const profileIds = profile?.map(p => p.id) || []

    const { data: studentData } = await supabase
        .from('students')
        .select('profile_id, birth_date')
        .in('profile_id', profileIds)

    // Get parent-student relationships
    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('parent_id, student_id')
        .in('student_id', profileIds)

    // Get teacher-student relationships
    const { data: teacherStudents } = await supabase
        .from('teacher_students')
        .select('teacher_id, student_id')
        .in('student_id', profileIds)

    // Get parent profiles
    const parentIds = [...new Set(parentStudents?.map(ps => ps.parent_id) || [])]
    const { data: parentProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', parentIds)

    // Get teacher profiles
    const teacherIds = [...new Set(teacherStudents?.map(ts => ts.teacher_id) || [])]
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', teacherIds)

    // Calculate age function
    const calculateAge = (birthDate: string | null): number | null => {
        if (!birthDate) return null

        // Parse YYYY-MM-DD format
        const [year, month, day] = birthDate.split('-').map(num => parseInt(num, 10))

        const today = new Date()
        const birth = new Date(year, month - 1, day) // Month is 0-indexed in JavaScript Date

        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()

        // If birth month is after current month or same month but birth day is after today
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }

        return age
    }

    // Combine the data into a single array of objects
    const combinedStudents = profile?.map(studentProfile => {
        // Find student data
        const student = studentData?.find(s => s.profile_id === studentProfile.id)

        // Find all parents for this student
        const studentParents = parentStudents
            ?.filter(ps => ps.student_id === studentProfile.id)
            .map(ps => {
                const parentProfile = parentProfiles?.find(p => p.id === ps.parent_id)
                return parentProfile ? {
                    id: parentProfile.id,
                    name: `${parentProfile.first_name} ${parentProfile.last_name}`
                } : null
            })
            .filter(Boolean) || []

        // Find all teachers for this student
        const studentTeachers = teacherStudents
            ?.filter(ts => ts.student_id === studentProfile.id)
            .map(ts => {
                const teacherProfile = teacherProfiles?.find(t => t.id === ts.teacher_id)
                return teacherProfile ? {
                    id: teacherProfile.id,
                    name: `${teacherProfile.first_name} ${teacherProfile.last_name}`
                } : null
            })
            .filter(Boolean) || []

        return {
            id: studentProfile.id,
            first_name: studentProfile.first_name,
            last_name: studentProfile.last_name,
            email: studentProfile.email,
            age: calculateAge(student?.birth_date),
            parents: studentParents,
            teachers: studentTeachers,
            status: studentProfile.status,
            created_at: studentProfile.created_at
        }
    }) || []


    return combinedStudents
}

export async function getStudentsCount() {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

    if (error) {
        console.error('Error fetching students count:', error)
        return 0
    }

    return count
}



