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

    // Get all dependent students for this parent through child_profiles
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('parent_profile_id', id)

    if (!childProfiles || childProfiles.length === 0) return []

    const studentIds = childProfiles.map(child => child.student_id)

    // Get student data from students table
    const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    if (!studentsData) return []

    // Combine the data into a single array of StudentType objects
    const combinedStudents = childProfiles.map((childProfile) => {
        const student = studentsData.find(s => s.id === childProfile.student_id)

        if (!student) return null

        return {
            student_id: student.id,
            student_type: student.student_type,
            profile_id: student.profile_id,
            birth_date: student.birth_date,
            grade_level: student.grade_level,
            notes: student.notes,
            created_at: student.created_at,
            updated_at: student.updated_at,
            first_name: childProfile.first_name,
            last_name: childProfile.last_name,
            gender: childProfile.gender,
            country: childProfile.country,
            language: childProfile.language,
            email: null, // Dependent students don't have email
            phone: null, // Dependent students don't have phone
            status: childProfile.status,
            role: 'student',
            avatar_url: childProfile.avatar_url,
            age: calculateAge(student.birth_date)
        }
    }).filter(Boolean) as StudentType[]

    return combinedStudents
}

/**
 * Batch fetch students for multiple parents at once.
 * Returns a map of parent_id -> StudentType[]
 */
export async function getAllParentStudents(parentIds: string[]): Promise<Record<string, StudentType[]>> {
    const supabase = createClient()

    if (parentIds.length === 0) return {}

    // Get all child_profiles for all parents in one query
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('parent_profile_id', parentIds)

    if (!childProfiles || childProfiles.length === 0) {
        // No child profiles found, return empty map
        return parentIds.reduce((acc, id) => {
            acc[id] = []
            return acc
        }, {} as Record<string, StudentType[]>)
    }

    // Get unique student IDs
    const studentIds = [...new Set(childProfiles.map(cp => cp.student_id))]

    if (studentIds.length === 0) {
        return parentIds.reduce((acc, id) => {
            acc[id] = []
            return acc
        }, {} as Record<string, StudentType[]>)
    }

    // Get all student data in one query
    const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    if (!studentsData) {
        return parentIds.reduce((acc, id) => {
            acc[id] = []
            return acc
        }, {} as Record<string, StudentType[]>)
    }

    // Create a map of student_id -> student data for quick lookup
    const studentMap = new Map(studentsData.map(s => [s.id, s]))

    // Create a map of parent_id -> StudentType[]
    const result: Record<string, StudentType[]> = {}

    // Initialize all parent IDs with empty arrays
    parentIds.forEach(id => {
        result[id] = []
    })

    // Map child_profiles to parents
    childProfiles.forEach(childProfile => {
        const student = childProfile.student_id ? studentMap.get(childProfile.student_id) : null
        if (student && childProfile.parent_profile_id) {
            if (!result[childProfile.parent_profile_id]) {
                result[childProfile.parent_profile_id] = []
            }
            result[childProfile.parent_profile_id].push({
                student_id: student.id,
                student_type: student.student_type,
                profile_id: student.profile_id,
                birth_date: student.birth_date,
                grade_level: student.grade_level,
                notes: student.notes,
                created_at: student.created_at,
                updated_at: student.updated_at,
                first_name: childProfile.first_name,
                last_name: childProfile.last_name,
                gender: childProfile.gender,
                country: childProfile.country,
                language: childProfile.language,
                email: null, // Dependent students don't have email
                phone: null, // Dependent students don't have phone
                status: childProfile.status,
                role: 'student',
                avatar_url: childProfile.avatar_url,
                age: calculateAge(student.birth_date)
            })
        }
    })

    return result
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

    // Get all parents of these students through child_profiles
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('parent_profile_id')
        .in('student_id', studentIds)

    if (!childProfiles || childProfiles.length === 0) return []

    // Get unique parent IDs (a parent might have multiple students with the same teacher)
    const parentIds = [...new Set(childProfiles.map(cp => cp.parent_profile_id))]

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

    // First, get all dependent students of this parent through child_profiles
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('parent_profile_id', parentId)

    if (!childProfiles || childProfiles.length === 0) return []

    const parentStudentIds = childProfiles.map(child => child.student_id)

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

    // Get student data from students table
    const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .in('id', commonStudentIds)

    if (!studentsData) return []

    // Combine the data into a single array of StudentType objects
    const combinedStudents = childProfiles
        .filter(child => commonStudentIds.includes(child.student_id))
        .map((childProfile) => {
            const student = studentsData.find(s => s.id === childProfile.student_id)

            if (!student) return null

            return {
                student_id: student.id,
                student_type: student.student_type,
                profile_id: student.profile_id,
                birth_date: student.birth_date,
                grade_level: student.grade_level,
                notes: student.notes,
                created_at: student.created_at,
                updated_at: student.updated_at,
                first_name: childProfile.first_name,
                last_name: childProfile.last_name,
                gender: childProfile.gender,
                country: childProfile.country,
                language: childProfile.language,
                email: null, // Dependent students don't have email
                phone: null, // Dependent students don't have phone
                status: childProfile.status,
                role: 'student',
                avatar_url: childProfile.avatar_url,
                age: calculateAge(student.birth_date)
            }
        }).filter(Boolean) as StudentType[]

    return combinedStudents
}
