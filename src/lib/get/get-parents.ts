import { createClient } from '@/utils/supabase/client'
import { ParentType, StudentType } from '@/types'
import { calculateAge } from '@/lib/utils'

export async function getParents(): Promise<ParentType[]> {
    const supabase = createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'parent')

    if (!profile) return []

    const combinedParents = profile?.map(parentProfile => {
        return {
            parent_id: parentProfile.id,
            first_name: parentProfile.first_name,
            last_name: parentProfile.last_name,
            gender: parentProfile.gender,
            country: parentProfile.country,
            language: parentProfile.language,
            email: parentProfile.email,
            phone: parentProfile.phone || null,
            status: parentProfile.status,
            role: parentProfile.role,
            avatar_url: parentProfile.avatar_url,
            created_at: parentProfile.created_at,
            updated_at: parentProfile.updated_at || null
        }
    }) || []

    return combinedParents
}

export async function getParentById(id: string): Promise<ParentType | null> {
    const supabase = createClient()

    // Get the parent's profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'parent')
        .single()

    if (!profile) {
        return null
    }

    // Return the parent with their students
    return {
        parent_id: profile.id,
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
        created_at: profile.created_at,
        updated_at: profile.updated_at || null
    }
}

export async function getParentStudents(id: string): Promise<StudentType[]> {
    const supabase = createClient()

    // Get all student IDs for this parent
    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', id)

    if (!parentStudents) return []

    const studentIds = parentStudents.map(student => student.student_id)

    // Get student profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    if (!profiles) return []

    // Get student data from students table
    const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

    // Combine the data into a single array of StudentType objects
    const combinedStudents = profiles.map((profile: { id: string; first_name: string; last_name: string; gender: string; country: string; language: string; email: string | null; phone: string | null; status: string; role: string; avatar_url: string | null; created_at: string; updated_at: string | null }) => {
        const student = studentsData?.find((s: { profile_id: string; birth_date: string; grade_level: string | null; notes: string | null }) => s.profile_id === profile.id)
        return {
            student_id: profile.id,
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
            age: calculateAge(student?.birth_date),
            grade_level: student?.grade_level || null,
            notes: student?.notes || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at || null
        }
    })

    return combinedStudents
}

export async function getStudentParentsByTeacherId(teacherId: string): Promise<ParentType[]> {
    const supabase = createClient()

    // First, get all students that this teacher teaches
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId)

    if (!teacherClasses || teacherClasses.length === 0) return []

    const classIds = teacherClasses.map(ct => ct.class_id)

    // Get all students enrolled in these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .in('class_id', classIds)

    if (!classStudents || classStudents.length === 0) return []

    // Get unique student IDs (a student might be in multiple classes with the same teacher)
    const studentIds = [...new Set(classStudents.map(cs => cs.student_id))]

    // Get all parents of these students
    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('parent_id')
        .in('student_id', studentIds)

    if (!parentStudents || parentStudents.length === 0) return []

    // Get unique parent IDs (a parent might have multiple students with the same teacher)
    const parentIds = [...new Set(parentStudents.map(ps => ps.parent_id))]

    // Get parent profiles
    const { data: parentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', parentIds)

    if (!parentProfiles) return []

    // Map the profiles to ParentType
    const parents: ParentType[] = parentProfiles.map((profile: { id: string; first_name: string; last_name: string; gender: string; country: string; language: string; email: string | null; phone: string | null; status: string; role: string; avatar_url: string | null; created_at: string; updated_at: string | null }) => ({
        parent_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender,
        country: profile.country,
        language: profile.language,
        email: profile.email || '',
        phone: profile.phone || null,
        status: profile.status,
        role: profile.role,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at || null
    }))

    return parents
}

export async function getParentStudentsForTeacher(parentId: string, teacherId: string): Promise<StudentType[]> {
    const supabase = createClient()

    // First, get all students of this parent
    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', parentId)

    if (!parentStudents || parentStudents.length === 0) return []

    const parentStudentIds = parentStudents.map(student => student.student_id)

    // Get all classes that this teacher teaches
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId)

    if (!teacherClasses || teacherClasses.length === 0) return []

    const classIds = teacherClasses.map(ct => ct.class_id)

    // Get all students enrolled in these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .in('class_id', classIds)

    if (!classStudents || classStudents.length === 0) return []

    const teacherStudentIds = classStudents.map(cs => cs.student_id)

    // Find the intersection: students who are both children of this parent AND taught by this teacher
    const commonStudentIds = parentStudentIds.filter(id => teacherStudentIds.includes(id))

    if (commonStudentIds.length === 0) return []

    // Get the student profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', commonStudentIds)

    if (!profiles) return []

    // Get student data from students table
    const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', commonStudentIds)

    // Combine the data into a single array of StudentType objects
    const combinedStudents = profiles.map((profile: { id: string; first_name: string; last_name: string; gender: string; country: string; language: string; email: string | null; phone: string | null; status: string; role: string; avatar_url: string | null; created_at: string; updated_at: string | null }) => {
        const student = studentsData?.find((s: { profile_id: string; birth_date: string; grade_level: string | null; notes: string | null }) => s.profile_id === profile.id)
        return {
            student_id: profile.id,
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
            age: calculateAge(student?.birth_date),
            grade_level: student?.grade_level || null,
            notes: student?.notes || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at || null
        }
    })

    return combinedStudents
}
