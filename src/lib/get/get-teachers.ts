import { createClient } from '@/utils/supabase/client'
import { TeacherType, StudentType, TeacherAvailabilityType } from '@/types'
import { calculateAge } from '@/lib/utils'

export async function getTeachers(): Promise<TeacherType[]> {
    const supabase = createClient()

    // Get profiles for both teachers and admins
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['teacher', 'admin'])

    if (!profile) return []

    const teacherIds = profile.map(teacher => teacher.id)

    const { data: teachers } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Combine the data into a single array of objects
    const combinedTeachers = profile?.map(teacherProfile => {
        const teacher = teachers?.find(t => t.profile_id === teacherProfile.id)

        return {
            teacher_id: teacherProfile.id,
            first_name: teacherProfile.first_name,
            last_name: teacherProfile.last_name,
            gender: teacherProfile.gender,
            country: teacherProfile.country,
            language: teacherProfile.language,
            email: teacherProfile.email,
            phone: teacherProfile.phone || null,
            status: teacherProfile.status,
            role: teacherProfile.role,
            avatar_url: teacherProfile.avatar_url,
            specialization: teacher?.specialization || null,
            hourly_rate: teacher?.hourly_rate || null,
            notes: teacher?.notes || null,
            created_at: teacherProfile.created_at,
            updated_at: teacherProfile.updated_at || null,
        }
    }) || []

    return combinedTeachers
}

export async function getTeacherById(id: string): Promise<TeacherType | null> {
    const supabase = createClient()

    // Get the teacher's profile data (can be either teacher or admin)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .in('role', ['teacher', 'admin'])
        .single()

    if (!profile) {
        return null
    }

    // Get the teacher-specific data
    const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('profile_id', id)
        .single()

    // Combine the profile and teacher data
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
        updated_at: profile.updated_at || null
    }
}

export async function getTeacherStudents(id: string): Promise<StudentType[]> {
    const supabase = createClient()

    // Get all students directly associated with this teacher through teacher_students table
    const { data: teacherStudents } = await supabase
        .from('teacher_students')
        .select('student_id')
        .eq('teacher_id', id)

    if (!teacherStudents || teacherStudents.length === 0) return []

    // Get unique student IDs (a student might appear multiple times if they're in multiple classes with the same teacher)
    const studentIds = [...new Set(teacherStudents.map(ts => ts.student_id))]

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    if (!profiles) return []

    const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

    // Combine the data into a single array of StudentType
    const students: StudentType[] = profiles.map(profile => {
        const student = studentsData?.find(s => s.profile_id === profile.id)
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
    })

    return students
}

export async function getTeacherAvailability(id: string): Promise<TeacherAvailabilityType | null> {
    const supabase = createClient()

    // Fetch the teacher's availability by teacher_id
    const { data, error } = await supabase
        .from('teacher_availability')
        .select('*')
        .eq('teacher_id', id)
        .single()

    if (error) {
        return null
    }

    return data
}

export async function getTeachersCount() {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['teacher', 'admin'])

    if (error) {
        console.error('Error fetching teachers count:', error)
        return 0
    }

    return count
}



