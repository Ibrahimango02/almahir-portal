import { createClient } from '@/utils/supabase/client'
import { StudentType, TeacherType, ParentType, ClassType } from '@/types'

// Calculate age function
const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0 // Default to 0 instead of null to match StudentType

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

export async function getStudents(): Promise<StudentType[]> {
    const supabase = await createClient()

    // Get student profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
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
        .select('id, email, first_name, last_name, phone, status, created_at')
        .in('id', parentIds)

    // Get teacher profiles
    const teacherIds = [...new Set(teacherStudents?.map(ts => ts.teacher_id) || [])]
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('profile_id, specialization, hourly_rate')
        .in('profile_id', teacherIds)

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
                    parent_id: parentProfile.id,
                    email: parentProfile.email,
                    first_name: parentProfile.first_name,
                    last_name: parentProfile.last_name,
                    phone: parentProfile.phone,
                    status: parentProfile.status,
                    created_at: parentProfile.created_at
                } : null
            })
            .filter((p): p is ParentType => p !== null) || []

        // Find all teachers for this student
        const studentTeachers = teacherStudents
            ?.filter(ts => ts.student_id === studentProfile.id)
            .map(ts => {
                const teacherProfile = teacherProfiles?.find(t => t.id === ts.teacher_id)
                return teacherProfile ? {
                    teacher_id: teacherProfile.id,
                    email: teacherProfile.email,
                    first_name: teacherProfile.first_name,
                    last_name: teacherProfile.last_name,
                    phone: teacherProfile.phone,
                    status: teacherProfile.status,
                    created_at: teacherProfile.created_at,
                    specialization: teacherData?.find(t => t.profile_id === teacherProfile.id)?.specialization || "",
                    hourly_rate: teacherData?.find(t => t.profile_id === teacherProfile.id)?.hourly_rate || 0
                } : null
            })
            .filter((t): t is TeacherType => t !== null) || []

        return {
            student_id: studentProfile.id,
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

export async function getStudentById(id: string): Promise<StudentType | null> {
    const supabase = await createClient()
    // Get the parent's profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
        .eq('id', id)
        .eq('role', 'student')
        .single()

    const { data: student } = await supabase
        .from('students')
        .select('profile_id, birth_date')
        .eq('profile_id', id)
        .single()

    if (!profile) {
        return null
    }

    // Return the parent with their students
    return {
        student_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        age: calculateAge(student?.birth_date),
        status: profile.status,
        created_at: profile.created_at
    }
}

export async function getStudentParents(id: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('parent_students')
        .select('parent_id')
        .eq('student_id', id)

    if (!data) return []

    const parentIds = data.map(parent => parent.parent_id)

    const { data: parents } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', parentIds)

    return parents
}

export async function getStudentTeachers(id: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('teacher_students')
        .select('teacher_id')
        .eq('student_id', id)

    if (!data) return []

    const teacherIds = data.map(teacher => teacher.teacher_id)

    const { data: teachers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', teacherIds)

    return teachers
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



