import { createClient } from '@/utils/supabase/client'
import { StudentType, TeacherType, ParentType, StudentAttendanceType } from '@/types'
import { calculateAge } from '@/lib/utils'

export async function getStudentId(profileId: string): Promise<string | null> {
    const supabase = createClient()

    // Get the student ID from the students table using the profile ID
    const { data: student, error } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', profileId)
        .eq('student_type', 'independent')
        .single()

    if (error) {
        console.error('Error fetching student ID:', error)
        return null
    }

    return student?.id || null
}

export async function getStudents(): Promise<StudentType[]> {
    const supabase = createClient()

    // Get all students from the students table
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')

    if (studentsError || !students || students.length === 0) return []

    // Separate students by type for batch fetching
    const independentStudents = students.filter(s => s.student_type === 'independent' && s.profile_id)
    const dependentStudents = students.filter(s => s.student_type === 'dependent')

    const independentProfileIds = independentStudents.map(s => s.profile_id).filter((id): id is string => id !== null)
    const dependentStudentIds = dependentStudents.map(s => s.id)

    // Batch fetch all profiles and child_profiles in parallel
    const [profilesResult, childProfilesResult] = await Promise.all([
        independentProfileIds.length > 0
            ? supabase
                .from('profiles')
                .select('*')
                .in('id', independentProfileIds)
            : Promise.resolve({ data: [], error: null }),
        dependentStudentIds.length > 0
            ? supabase
                .from('child_profiles')
                .select('*')
                .in('student_id', dependentStudentIds)
            : Promise.resolve({ data: [], error: null })
    ])

    const profiles = profilesResult.data || []
    const childProfiles = childProfilesResult.data || []

    // Create maps for quick lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]))
    const childProfileMap = new Map(childProfiles.map(cp => [cp.student_id, cp]))

    // Build result array
    const result: StudentType[] = []

    // Process independent students
    for (const student of independentStudents) {
        if (student.profile_id) {
            const profile = profileMap.get(student.profile_id)
            if (profile) {
                result.push({
                    student_id: student.id,
                    student_type: student.student_type,
                    profile_id: student.profile_id,
                    birth_date: student.birth_date,
                    notes: student.notes,
                    payment_method: student.payment_method || null,
                    billing_name: student.billing_name || null,
                    created_at: student.created_at,
                    updated_at: student.updated_at,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    gender: profile.gender,
                    country: profile.country,
                    language: profile.language,
                    email: profile.email,
                    phone: profile.phone,
                    status: profile.status,
                    role: profile.role,
                    avatar_url: profile.avatar_url,
                    age: calculateAge(student.birth_date)
                })
            }
        }
    }

    // Process dependent students
    for (const student of dependentStudents) {
        const childProfile = childProfileMap.get(student.id)
        if (childProfile) {
            result.push({
                student_id: student.id,
                student_type: student.student_type,
                profile_id: null, // Dependent students don't have a profile_id
                birth_date: student.birth_date,
                notes: student.notes,
                payment_method: student.payment_method || null,
                billing_name: student.billing_name || null,
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
    }

    return result
}

export async function getStudentById(id: string): Promise<StudentType | null> {
    const supabase = createClient()

    // Get student from students table
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

    if (studentError || !student) {
        return null
    }

    if (student.student_type === 'independent' && student.profile_id) {
        // Independent student - get profile from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', student.profile_id)
            .single()

        if (profile) {
            return {
                student_id: student.id,
                student_type: student.student_type,
                profile_id: student.profile_id,
                birth_date: student.birth_date,
                notes: student.notes,
                payment_method: student.payment_method || null,
                billing_name: student.billing_name || null,
                created_at: student.created_at,
                updated_at: student.updated_at,
                first_name: profile.first_name,
                last_name: profile.last_name,
                gender: profile.gender,
                country: profile.country,
                language: profile.language,
                email: profile.email,
                phone: profile.phone,
                status: profile.status,
                role: profile.role,
                avatar_url: profile.avatar_url,
                age: calculateAge(student.birth_date)
            }
        }
    } else if (student.student_type === 'dependent') {
        // Dependent student - get profile from child_profiles table
        const { data: childProfile } = await supabase
            .from('child_profiles')
            .select('*')
            .eq('student_id', student.id)
            .single()

        if (childProfile) {
            return {
                student_id: student.id,
                student_type: student.student_type,
                profile_id: null, // Dependent students don't have a profile_id
                birth_date: student.birth_date,
                notes: student.notes,
                payment_method: student.payment_method || null,
                billing_name: student.billing_name || null,
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
        }
    }

    return null
}

export async function getStudentParents(id: string): Promise<ParentType[]> {
    const supabase = createClient()

    // First, get the student to determine their type
    const { data: student } = await supabase
        .from('students')
        .select('student_type')
        .eq('id', id)
        .single()

    if (!student) return []

    if (student.student_type === 'dependent') {
        // For dependent students, get parent from child_profiles.parent_profile_id
        const { data: childProfile } = await supabase
            .from('child_profiles')
            .select('parent_profile_id')
            .eq('student_id', id)
            .single()

        if (!childProfile || !childProfile.parent_profile_id) return []

        // Get parent profile
        const { data: parentProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', childProfile.parent_profile_id)
            .single()

        if (!parentProfile) return []

        // Get notes, payment_method, and billing_name from parents table
        const { data: parentData } = await supabase
            .from('parents')
            .select('notes, payment_method, billing_name')
            .eq('profile_id', childProfile.parent_profile_id)
            .single()

        // Return single parent
        return [{
            parent_id: parentProfile.id,
            first_name: parentProfile.first_name,
            last_name: parentProfile.last_name,
            gender: parentProfile.gender,
            country: parentProfile.country,
            language: parentProfile.language,
            email: parentProfile.email ?? "",
            phone: parentProfile.phone || null,
            status: parentProfile.status,
            role: parentProfile.role,
            avatar_url: parentProfile.avatar_url,
            notes: parentData?.notes || null,
            payment_method: parentData?.payment_method || null,
            billing_name: parentData?.billing_name || null,
            created_at: parentProfile.created_at,
            updated_at: parentProfile.updated_at || null
        }]
    } else {
        // For independent students, there's no direct parent relationship
        // This might need to be handled differently based on your business logic
        // For now, return empty array
        return []
    }
}

/**
 * Batch fetch parents for multiple students at once.
 * Returns a map of student_id -> ParentType[]
 */
export async function getAllStudentParents(studentIds: string[]): Promise<Record<string, ParentType[]>> {
    const supabase = createClient()

    if (studentIds.length === 0) return {}

    // Get all dependent students and their child_profiles in one query
    const { data: dependentStudents } = await supabase
        .from('students')
        .select('id, student_type')
        .in('id', studentIds)
        .eq('student_type', 'dependent')

    if (!dependentStudents || dependentStudents.length === 0) {
        // No dependent students, return empty map
        return studentIds.reduce((acc, id) => {
            acc[id] = []
            return acc
        }, {} as Record<string, ParentType[]>)
    }

    const dependentStudentIds = dependentStudents.map(s => s.id)

    // Get all child_profiles for dependent students in one query
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('student_id, parent_profile_id')
        .in('student_id', dependentStudentIds)

    if (!childProfiles || childProfiles.length === 0) {
        // No child profiles found, return empty map
        return studentIds.reduce((acc, id) => {
            acc[id] = []
            return acc
        }, {} as Record<string, ParentType[]>)
    }

    // Get unique parent profile IDs
    const parentProfileIds = [...new Set(
        childProfiles
            .map(cp => cp.parent_profile_id)
            .filter((id): id is string => id !== null)
    )]

    if (parentProfileIds.length === 0) {
        return studentIds.reduce((acc, id) => {
            acc[id] = []
            return acc
        }, {} as Record<string, ParentType[]>)
    }

    // Get all parent profiles in one query
    const { data: parentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', parentProfileIds)

    if (!parentProfiles) {
        return studentIds.reduce((acc, id) => {
            acc[id] = []
            return acc
        }, {} as Record<string, ParentType[]>)
    }

    // Get parent notes, payment_method, and billing_name from parents table
    const { data: parentsData } = await supabase
        .from('parents')
        .select('profile_id, notes, payment_method, billing_name')
        .in('profile_id', parentProfileIds)

    // Create maps for quick lookup
    const notesMap = new Map<string, string | null>()
    const paymentMethodMap = new Map<string, string | null>()
    const billingNameMap = new Map<string, string | null>()
    parentsData?.forEach(parent => {
        notesMap.set(parent.profile_id, parent.notes || null)
        paymentMethodMap.set(parent.profile_id, parent.payment_method || null)
        billingNameMap.set(parent.profile_id, parent.billing_name || null)
    })

    // Create a map of parent_profile_id -> ParentType
    const parentMap = new Map<string, ParentType>()
    parentProfiles.forEach(profile => {
        parentMap.set(profile.id, {
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
            notes: notesMap.get(profile.id) || null,
            payment_method: paymentMethodMap.get(profile.id) || null,
            billing_name: billingNameMap.get(profile.id) || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at || null
        })
    })

    // Create a map of student_id -> ParentType[]
    const result: Record<string, ParentType[]> = {}

    // Initialize all student IDs with empty arrays
    studentIds.forEach(id => {
        result[id] = []
    })

    // Map child_profiles to students
    childProfiles.forEach(childProfile => {
        const parent = childProfile.parent_profile_id ? parentMap.get(childProfile.parent_profile_id) : null
        if (parent && childProfile.student_id) {
            if (!result[childProfile.student_id]) {
                result[childProfile.student_id] = []
            }
            result[childProfile.student_id].push(parent)
        }
    })

    return result
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
        const teacher = teachersData?.find((t: { profile_id: string; specialization: string | null; hourly_rate: number | null; currency: string | null; notes: string | null }) => t.profile_id === profile.id)
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
            currency: teacher?.currency || null,
            notes: teacher?.notes || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at || null,
            is_admin: teacher?.is_admin ?? false,
            moderator_id: teacher?.moderator_id || null,
            class_link: teacher?.class_link || null,
        }
    })

    return teachers
}

export async function getStudentsCount() {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error fetching students count:', error)
        return 0
    }

    return count
}

export async function getActiveStudentsCount() {
    const supabase = createClient()

    // For active students count, we need to check both independent and dependent students
    // Independent students: check profiles.status
    // Dependent students: check child_profiles.status

    // Get independent students count
    const { count: independentCount, error: independentError } = await supabase
        .from('students')
        .select('profiles!inner(status)', { count: 'exact', head: true })
        .eq('student_type', 'independent')
        .eq('profiles.status', 'active')

    if (independentError) {
        console.error('Error fetching independent active students count:', independentError)
        return 0
    }

    // Get dependent students count - check child_profiles.status
    const { count: dependentCount, error: dependentError } = await supabase
        .from('students')
        .select('child_profiles!inner(status)', { count: 'exact', head: true })
        .eq('student_type', 'dependent')
        .eq('child_profiles.status', 'active')

    if (dependentError) {
        console.error('Error fetching dependent active students count:', dependentError)
        return 0
    }

    return (independentCount || 0) + (dependentCount || 0)
}

export async function getStudentTotalHours(studentId: string): Promise<number> {
    const supabase = createClient()

    // Get current month's date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get class IDs for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId)

    if (!studentClasses || studentClasses.length === 0) return 0

    const classIds = studentClasses.map(sc => sc.class_id)

    // Get all sessions for these classes THIS MONTH
    const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select('start_date, end_date')
        .in('class_id', classIds)
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString())

    if (error) {
        console.error('Error fetching student sessions for hours calculation:', error)
        return 0
    }

    if (!sessions || sessions.length === 0) return 0

    // Calculate total hours from all sessions
    let totalHours = 0

    sessions.forEach(session => {
        try {
            const startDate = new Date(session.start_date)
            const endDate = new Date(session.end_date)

            // Calculate duration in milliseconds
            const durationMs = endDate.getTime() - startDate.getTime()

            // Convert to hours
            const durationHours = durationMs / (1000 * 60 * 60)

            // Add to total (only if duration is positive)
            if (durationHours > 0) {
                totalHours += durationHours
            }
        } catch (error) {
            console.error('Error calculating session duration:', error)
        }
    })

    // Return total hours rounded to 2 decimal places
    return Math.round(totalHours * 100) / 100
}

export async function getStudentClassesWithMonthlyHours(studentId: string): Promise<Array<{
    class_id: string
    title: string
    subject: string
    description: string | null
    status: string
    monthly_hours: number
    session_count: number
}>> {
    const supabase = createClient()

    // Get current month's date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get class IDs for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId)

    if (!studentClasses || studentClasses.length === 0) return []

    const classIds = studentClasses.map(sc => sc.class_id)

    // Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)

    if (!classes || classes.length === 0) return []

    // Get sessions for these classes in the current month
    const { data: sessions, error } = await supabase
        .from('class_sessions')
        .select('class_id, start_date, end_date')
        .in('class_id', classIds)
        .gte('start_date', startOfMonth.toISOString())
        .lte('start_date', endOfMonth.toISOString())

    if (error) {
        console.error('Error fetching student sessions for monthly hours calculation:', error)
        return []
    }

    // Calculate monthly hours for each class
    const classHoursMap = new Map<string, { hours: number; sessionCount: number }>()

    sessions?.forEach(session => {
        try {
            const startDate = new Date(session.start_date)
            const endDate = new Date(session.end_date)

            // Calculate duration in milliseconds
            const durationMs = endDate.getTime() - startDate.getTime()

            // Convert to hours
            const durationHours = durationMs / (1000 * 60 * 60)

            // Add to class total (only if duration is positive)
            if (durationHours > 0) {
                const current = classHoursMap.get(session.class_id) || { hours: 0, sessionCount: 0 }
                classHoursMap.set(session.class_id, {
                    hours: current.hours + durationHours,
                    sessionCount: current.sessionCount + 1
                })
            }
        } catch (error) {
            console.error('Error calculating session duration:', error)
        }
    })

    // Build the result array
    const result = classes.map(classData => {
        const classHours = classHoursMap.get(classData.id) || { hours: 0, sessionCount: 0 }

        return {
            class_id: classData.id,
            title: classData.title,
            subject: classData.subject,
            description: classData.description,
            status: classData.status,
            monthly_hours: Math.round(classHours.hours * 100) / 100,
            session_count: classHours.sessionCount
        }
    })

    // Sort by monthly hours (descending)
    return result.sort((a, b) => b.monthly_hours - a.monthly_hours)
}

export async function getStudentAttendanceForSession(sessionId: string, studentId: string): Promise<StudentAttendanceType[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('session_id', sessionId)
        .eq('student_id', studentId)

    if (error) {
        console.error('Error fetching student attendance for session:', error)
        return []
    }

    return data || []
}

