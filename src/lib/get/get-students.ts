import { createClient } from '@/utils/supabase/client'
import { StudentType, TeacherType, ParentType, StudentAttendanceType } from '@/types'
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
            is_admin: teacher?.is_admin ?? false,
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

export async function getActiveStudentsCount() {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('status', 'active')

    if (error) {
        console.error('Error fetching active students count:', error)
        return 0
    }

    return count
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

