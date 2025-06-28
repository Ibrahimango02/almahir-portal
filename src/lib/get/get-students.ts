import { createClient } from '@/utils/supabase/client'
import { StudentType, TeacherType, ParentType } from '@/types'
import { calculateAge } from '@/lib/utils'

export async function getStudents(): Promise<StudentType[]> {
    const supabase = createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')

    if (!profile) return []

    const studentIds = profile.map(student => student.id)

    const { data: students } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

    // Combine the data into a single array of objects
    const combinedStudents = profile?.map(studentProfile => {
        // Find student data
        const student = students?.find(s => s.profile_id === studentProfile.id)

        return {
            student_id: studentProfile.id,
            first_name: studentProfile.first_name,
            last_name: studentProfile.last_name,
            gender: studentProfile.gender,
            country: studentProfile.country,
            language: studentProfile.language,
            email: studentProfile.email ?? "",
            phone: studentProfile.phone || null,
            status: studentProfile.status,
            role: studentProfile.role,
            avatar_url: studentProfile.avatar_url,
            age: calculateAge(student?.birth_date),
            grade_level: student?.grade_level || null,
            notes: student?.notes || null,
            created_at: studentProfile.created_at,
            updated_at: studentProfile.updated_at || null
        }
    }) || []

    return combinedStudents
}

export async function getStudentById(id: string): Promise<StudentType | null> {
    const supabase = createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'student')
        .single()

    if (!profile) {
        return null
    }

    const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('profile_id', id)
        .single()

    // Return the parent with their students
    return {
        student_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender,
        country: profile.country,
        language: profile.language,
        email: profile.email ?? "",
        phone: profile.phone || null,
        status: profile.status,
        role: profile.role,
        avatar_url: profile.avatar_url,
        age: calculateAge(student?.birth_date),
        grade_level: student?.grade_level || null,
        notes: student?.notes || null,
        created_at: profile.created_at,
        updated_at: profile.updated_at || null
    }
}

export async function getStudentParents(id: string): Promise<ParentType[]> {
    const supabase = createClient()

    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('parent_id')
        .eq('student_id', id)

    if (!parentStudents) return []

    const parentIds = parentStudents.map(parent => parent.parent_id)

    const { data: parentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', parentIds)

    // If no parent profiles found, return empty array
    if (!parentProfiles) return []

    // Map the profiles to ParentType
    const parents: ParentType[] = parentProfiles.map((profile: { id: string; first_name: string; last_name: string; gender: string; country: string; language: string; email: string | null; phone: string | null; status: string; role: string; avatar_url: string | null; created_at: string; updated_at: string | null }) => ({
        parent_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender,
        country: profile.country,
        language: profile.language,
        email: profile.email ?? "",
        phone: profile.phone || null,
        status: profile.status,
        role: profile.role,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at || null
    }))

    return parents
}

export async function getStudentTeachers(id: string): Promise<TeacherType[]> {
    const supabase = createClient()

    // Get all teachers directly associated with this student through teacher_students table
    const { data: studentTeachers } = await supabase
        .from('teacher_students')
        .select('teacher_id')
        .eq('student_id', id)

    if (!studentTeachers || studentTeachers.length === 0) return []

    // Get unique teacher IDs (a teacher might appear multiple times if they teach multiple classes with the same student)
    const teacherIds = [...new Set(studentTeachers.map(st => st.teacher_id))]

    // Get teacher profiles
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    if (!teacherProfiles) return []

    // Get teacher data
    const { data: teachersData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Map the profiles to TeacherType
    const teachers: TeacherType[] = teacherProfiles.map((profile: { id: string; first_name: string; last_name: string; gender: string; country: string; language: string; email: string; phone: string | null; status: string; role: string; avatar_url: string | null; created_at: string; updated_at: string | null }) => {
        const teacher = teachersData?.find((t: { profile_id: string; specialization: string | null; hourly_rate: number | null; notes: string | null }) => t.profile_id === profile.id)
        return {
            teacher_id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            gender: profile.gender,
            country: profile.country,
            language: profile.language,
            email: profile.email,
            phone: profile.phone || null,
            status: profile.status,
            role: profile.role,
            avatar_url: profile.avatar_url,
            specialization: teacher?.specialization || null,
            hourly_rate: teacher?.hourly_rate || null,
            notes: teacher?.notes || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at || null,
        }
    })

    return teachers
}

export async function getStudentsCount() {
    const supabase = createClient()

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



