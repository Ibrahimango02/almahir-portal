import { createClient } from '@/utils/supabase/client'
import { ClassType, ClassSessionType, TeacherType, StudentType, SessionType, StudentAttendanceType, TeacherAttendanceType } from '@/types'
import { calculateAge } from '@/lib/utils'
import { format } from 'date-fns'

// Helper function to parse days_repeated field
function parseDaysRepeated(daysRepeated: unknown): {
    monday?: { start: string; end: string }
    tuesday?: { start: string; end: string }
    wednesday?: { start: string; end: string }
    thursday?: { start: string; end: string }
    friday?: { start: string; end: string }
    saturday?: { start: string; end: string }
    sunday?: { start: string; end: string }
} {
    if (daysRepeated && typeof daysRepeated === 'object' && !Array.isArray(daysRepeated)) {
        // Handle new object structure
        const daysObj = daysRepeated as Record<string, { start: string; end: string } | undefined>
        return {
            monday: daysObj.monday,
            tuesday: daysObj.tuesday,
            wednesday: daysObj.wednesday,
            thursday: daysObj.thursday,
            friday: daysObj.friday,
            saturday: daysObj.saturday,
            sunday: daysObj.sunday
        }
    } else if (Array.isArray(daysRepeated)) {
        // Legacy array structure - convert to new object structure
        const result: {
            monday?: { start: string; end: string }
            tuesday?: { start: string; end: string }
            wednesday?: { start: string; end: string }
            thursday?: { start: string; end: string }
            friday?: { start: string; end: string }
            saturday?: { start: string; end: string }
            sunday?: { start: string; end: string }
        } = {}

        daysRepeated.forEach((item: unknown) => {
            if (typeof item === 'object' && item && typeof item === 'object' && 'day' in item && 'start_time' in item && 'end_time' in item) {
                const itemObj = item as { day: string; start_time: string; end_time: string }
                const dayKey = itemObj.day.toLowerCase() as keyof typeof result
                result[dayKey] = {
                    start: itemObj.start_time,
                    end: itemObj.end_time
                }
            } else if (typeof item === 'string') {
                const dayKey = item.toLowerCase() as keyof typeof result
                result[dayKey] = {
                    start: "00:00",
                    end: "01:00"
                }
            }
        })
        return result
    } else if (typeof daysRepeated === 'string') {
        // Legacy string format
        const dayArray = daysRepeated.split(',').map(day => day.trim())
        const result: {
            monday?: { start: string; end: string }
            tuesday?: { start: string; end: string }
            wednesday?: { start: string; end: string }
            thursday?: { start: string; end: string }
            friday?: { start: string; end: string }
            saturday?: { start: string; end: string }
            sunday?: { start: string; end: string }
        } = {}

        dayArray.forEach(day => {
            const dayKey = day.toLowerCase() as keyof typeof result
            result[dayKey] = {
                start: "00:00",
                end: "01:00"
            }
        })
        return result
    }
    return {}
}

// Helper function to map student data to StudentType
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStudentToStudentType(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    student: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profiles: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    childProfiles: any[]
): StudentType | null {
    if (student.student_type === 'independent' && student.profile_id) {
        // Independent student - get profile from profiles table
        const profile = profiles?.find(p => p.id === student.profile_id)
        if (!profile) return null

        return {
            student_id: student.id,
            student_type: student.student_type,
            profile_id: student.profile_id,
            birth_date: student.birth_date,
            grade_level: student.grade_level,
            notes: student.notes,
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
    } else if (student.student_type === 'dependent') {
        // Dependent student - get profile from child_profiles table
        const childProfile = childProfiles?.find(cp => cp.student_id === student.id)
        if (!childProfile) return null

        return {
            student_id: student.id,
            student_type: student.student_type,
            profile_id: null,
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
            email: null,
            phone: null,
            status: childProfile.status,
            role: 'student',
            avatar_url: childProfile.avatar_url,
            age: calculateAge(student.birth_date)
        }
    }
    return null
}

export async function getClasses(): Promise<ClassType[]> {
    const supabase = createClient()

    // Get all classes
    const { data: classes, error } = await supabase
        .from('classes')
        .select('*')

    if (error) {
        console.error('Error fetching classes:', error)
        return []
    }

    // Extract class IDs
    const classIds = classes?.map(c => c.id) || []

    // Get class-teacher relationships
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    // Get class-student relationships
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    // Get session data for all classes (now includes start_time and end_time)
    const { data: classSessions, error: sessionError } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)

    if (sessionError) {
        console.error('Error fetching class sessions:', sessionError)
    }

    // Get all unique teacher IDs
    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    // Get all unique student IDs
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]

    // Get teacher profile information
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // Format the data as required
    const formattedClasses = classes?.map(classItem => {
        // Find teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classItem.id)
            .map(ct => ct.teacher_id) || []

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        // Find sessions for this class - now using start_date and end_date
        const sessions: SessionType[] = classSessions
            ?.filter(session => session.class_id === classItem.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                cancellation_reason: session.cancellation_reason || null,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || []

        // Parse days_repeated using the helper function
        const daysRepeated = parseDaysRepeated(classItem.days_repeated)

        return {
            class_id: classItem.id,
            title: classItem.title,
            description: classItem.description || null,
            subject: classItem.subject,
            start_date: classItem.start_date,
            end_date: classItem.end_date,
            status: classItem.status,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classItem.class_link || null,
            teachers: teachers,
            students: enrolledStudents,
            created_at: classItem.created_at,
            updated_at: classItem.updated_at || null
        }
    }) || []

    return formattedClasses
}

export async function getClassesToday(): Promise<ClassType[]> {
    const supabase = createClient()

    // Get today's date range in ISO format
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all classes
    const { data: classes, error } = await supabase
        .from('classes')
        .select('*')

    if (error) {
        console.error('Error fetching classes:', error)
        return []
    }

    // Extract class IDs
    const classIds = classes?.map(c => c.id) || []

    // Get class-teacher relationships
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    // Get class-student relationships
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    // Get class sessions for today
    const { data: classSessions, error: sessionError } = await supabase
        .from('class_sessions')
        .select('*')
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString())
        .in('class_id', classIds)

    if (sessionError) {
        console.error('Error fetching class sessions:', sessionError)
    }

    // Get all unique teacher IDs
    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    // Get all unique student IDs
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]

    // Get teacher profile information
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // Format the data to match ClassType
    const formattedClasses = classes?.map(classItem => {
        // Find teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classItem.id)
            .map(ct => ct.teacher_id) || []

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        // Get today's sessions for this class
        const sessions: SessionType[] = classSessions
            ?.filter(session => session.class_id === classItem.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                cancellation_reason: session.cancellation_reason || null,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || []

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classItem.days_repeated
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim())
        }

        // Return object matching ClassType
        return {
            class_id: classItem.id,
            title: classItem.title,
            description: classItem.description || null,
            subject: classItem.subject,
            start_date: classItem.start_date,
            end_date: classItem.end_date,
            status: classItem.status,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classItem.class_link || null,
            teachers: teachers,
            students: enrolledStudents,
            created_at: classItem.created_at,
            updated_at: classItem.updated_at || null
        }
    }) || []

    // Only return classes that have sessions today
    return formattedClasses.filter(cls => cls.sessions.length > 0)
}

export async function getSessionsToday(): Promise<ClassSessionType[]> {
    const supabase = createClient();

    // Get today's date range in ISO format (local time)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Get all sessions for today
    const { data: sessions } = await supabase
        .from('class_sessions')
        .select('*')
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString());

    if (!sessions || sessions.length === 0) return [];

    // 2. Get all class IDs for these sessions
    const sessionClassIds = [...new Set(sessions.map(s => s.class_id))];

    // 3. Get class details for these sessions
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', sessionClassIds);

    // 4. Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', sessionClassIds);

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])];
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds);

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds);

    // 5. Get students for these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', sessionClassIds);

    // 6. Get student data
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])];
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds);

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds);

    // 7. Build the result
    const result: ClassSessionType[] = sessions.map(session => {
        const classData = classes?.find(c => c.id === session.class_id);

        // Teachers for this class
        const teachers = (classTeachers
            ?.filter(ct => ct.class_id === session.class_id)
            .map(ct => {
                const teacherProfile = teacherProfiles?.find(tp => tp.id === ct.teacher_id);
                return {
                    teacher_id: teacherProfile?.id,
                    first_name: teacherProfile?.first_name,
                    last_name: teacherProfile?.last_name,
                    gender: teacherProfile?.gender,
                    country: teacherProfile?.country,
                    language: teacherProfile?.language,
                    email: teacherProfile?.email || null,
                    phone: teacherProfile?.phone || null,
                    status: teacherProfile?.status,
                    role: teacherProfile?.role,
                    avatar_url: teacherProfile?.avatar_url,
                    specialization: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.specialization || null,
                    hourly_rate: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.hourly_rate || null,
                    notes: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.notes || null,
                    created_at: teacherProfile?.created_at,
                    updated_at: teacherProfile?.updated_at || null,
                    is_admin: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.is_admin ?? false,
                }
            }) || []).filter(Boolean);

        // Students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === session.class_id)
            .map(cs => cs.student_id) || [];

        const enrolledStudents: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[];

        return {
            class_id: session.class_id,
            session_id: session.id,
            title: classData?.title || null,
            description: classData?.description || null,
            subject: classData?.subject || null,
            start_date: session.start_date,
            end_date: session.end_date,
            status: session.status,
            cancellation_reason: session.cancellation_reason || null,
            class_link: classData?.class_link || null,
            teachers: teachers,
            students: enrolledStudents
        };
    });

    return result;
}

export async function getActiveClasses(): Promise<ClassType[]> {
    const supabase = createClient()

    const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .eq('status', 'active')

    if (error) {
        console.error('Error fetching active classes:', error)
        return []
    }

    // Extract class IDs
    const classIds = classes?.map(c => c.id) || []

    // Get class-teacher relationships
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    // Get class-student relationships
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    // Get session data for all classes
    const { data: classSessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)

    // Get all unique teacher IDs
    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    // Get all unique student IDs
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]

    // Get teacher profiles and data
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // Format the classes with all related data
    const formattedClasses: ClassType[] = classes?.map(classItem => {
        // Find teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classItem.id)
            .map(ct => ct.teacher_id) || []

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        // Get sessions for this class
        const sessions: SessionType[] = classSessions
            ?.filter(session => session.class_id === classItem.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || []

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classItem.days_repeated
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim())
        }

        return {
            class_id: classItem.id,
            title: classItem.title,
            description: classItem.description || null,
            subject: classItem.subject,
            start_date: classItem.start_date,
            end_date: classItem.end_date,
            status: classItem.status,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classItem.class_link || null,
            teachers: teachers,
            students: enrolledStudents,
            created_at: classItem.created_at,
            updated_at: classItem.updated_at || null
        }
    }) || []

    return formattedClasses
}

export async function getArchivedClasses(): Promise<ClassType[]> {
    const supabase = createClient()

    // Fetch classes with status 'archived'
    const { data: classes, error } = await supabase
        .from('classes')
        .select('*')
        .eq('status', 'archived')

    if (error) {
        console.error('Error fetching archived classes:', error)
        return []
    }

    // Extract class IDs
    const classIds = classes?.map(c => c.id) || []

    // Get class-teacher relationships
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    // Get class-student relationships
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    // Get session data for all classes
    const { data: classSessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)

    // Get all unique teacher IDs
    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    // Get all unique student IDs
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]

    // Get teacher profiles and data
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // Format the classes with all related data
    const formattedClasses: ClassType[] = classes?.map(classItem => {
        // Find teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classItem.id)
            .map(ct => ct.teacher_id) || []

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        // Get sessions for this class
        const sessions: SessionType[] = classSessions
            ?.filter(session => session.class_id === classItem.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || []

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classItem.days_repeated
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim())
        }

        return {
            class_id: classItem.id,
            title: classItem.title,
            description: classItem.description || null,
            subject: classItem.subject,
            start_date: classItem.start_date,
            end_date: classItem.end_date,
            status: classItem.status,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classItem.class_link || null,
            teachers: teachers,
            students: enrolledStudents,
            created_at: classItem.created_at,
            updated_at: classItem.updated_at || null
        }
    }) || []

    return formattedClasses
}

export async function getClassById(classId: string): Promise<ClassType | null> {
    const supabase = createClient();

    // Get the class details
    const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

    if (!classData) {
        return null;
    }

    // Get teachers for this class
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('teacher_id')
        .eq('class_id', classData.id);

    const teacherIds = classTeachers?.map(ct => ct.teacher_id) || [];

    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds);

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds);

    const teachers: TeacherType[] = teacherProfiles?.map(teacher => ({
        teacher_id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        gender: teacher.gender,
        country: teacher.country,
        language: teacher.language,
        email: teacher.email,
        phone: teacher.phone || null,
        status: teacher.status,
        role: teacher.role,
        avatar_url: teacher.avatar_url,
        specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
        hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
        notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
        created_at: teacher.created_at,
        updated_at: teacher.updated_at || null,
        is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
    })) || [];

    // Get students for this class
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classData.id);

    const studentIds = classStudents?.map(cs => cs.student_id) || [];

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds);

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds);

    const enrolledStudents: StudentType[] = studentIds
        .map(studentId => {
            const student = studentData?.find(s => s.id === studentId)
            if (!student) return null
            return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
        })
        .filter(Boolean) as StudentType[];

    // Get sessions for this class
    const { data: classSessions } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('class_id', classData.id);

    const sessions: SessionType[] = classSessions?.map(session => ({
        session_id: session.id,
        start_date: session.start_date,
        end_date: session.end_date,
        status: session.status,
        created_at: session.created_at,
        updated_at: session.updated_at || null
    })) || [];

    // Parse days_repeated to an array if it's a string
    let daysRepeated = classData.days_repeated;
    if (typeof daysRepeated === 'string') {
        daysRepeated = daysRepeated.split(',').map(day => day.trim());
    }

    // Extract times from sessions if times field is not available
    let times: Record<string, { start: string; end: string }> | undefined = classData.times;
    if (!times && classSessions && classSessions.length > 0) {
        times = {};
        for (const session of classSessions) {
            const sessionDate = new Date(session.start_date);
            const dayName = format(sessionDate, 'EEEE');
            const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

            // Extract time components
            const startTime = sessionDate.toTimeString().split(' ')[0];
            const endDate = new Date(session.end_date);
            const endTime = endDate.toTimeString().split(' ')[0];

            // Create a reference date for the time (using today's date)
            const today = new Date();
            const startDateTime = new Date(today);
            const endDateTime = new Date(today);

            const [startHours, startMinutes, startSeconds] = startTime.split(':').map(Number);
            const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number);

            startDateTime.setHours(startHours, startMinutes, startSeconds, 0);
            endDateTime.setHours(endHours, endMinutes, endSeconds, 0);

            times[capitalizedDayName] = {
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString()
            };
        }
    }

    return {
        class_id: classData.id,
        title: classData.title,
        description: classData.description || null,
        subject: classData.subject,
        start_date: classData.start_date,
        end_date: classData.end_date,
        status: classData.status,
        days_repeated: daysRepeated,
        sessions: sessions,
        class_link: classData.class_link || null,
        teachers: teachers,
        students: enrolledStudents,
        times: times,
        created_at: classData.created_at,
        updated_at: classData.updated_at || null
    };
}

export async function getClassesByTeacherId(teacherId: string): Promise<ClassType[]> {
    const supabase = createClient();

    // Get class IDs for this teacher
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId);

    const classIds = teacherClasses?.map(tc => tc.class_id) || [];
    if (classIds.length === 0) return [];

    // Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);

    if (!classes) return [];

    // Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds);

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])];

    // Get teacher profiles
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds);

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds);

    // Get students for these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds);

    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])];

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds);

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds);

    // Get session data for all classes (now includes start_date and end_date)
    const { data: classSessions, error: sessionError } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds);

    if (sessionError) {
        console.error('Error fetching class sessions:', sessionError);
    }

    // Compose the result
    const result: ClassType[] = classes.map(classData => {
        // Teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classData.id)
            .map(ct => ct.teacher_id) || [];

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || [];

        const students: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        // Find sessions for this class - now using start_date and end_date
        const sessions: SessionType[] = classSessions
            ?.filter(session => session.class_id === classData.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || [];

        // Parse days_repeated using the helper function
        const daysRepeated = parseDaysRepeated(classData.days_repeated)

        return {
            class_id: classData.id,
            title: classData.title,
            description: classData.description || null,
            subject: classData.subject,
            start_date: classData.start_date,
            end_date: classData.end_date,
            status: classData.status,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classData.class_link || null,
            teachers: teachers,
            students: students,
            created_at: classData.created_at,
            updated_at: classData.updated_at || null
        };
    });

    return result;
}

export async function getClassesByStudentId(studentId: string): Promise<ClassType[]> {
    const supabase = createClient();

    // Get class IDs for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId);

    const classIds = studentClasses?.map(sc => sc.class_id) || [];
    if (classIds.length === 0) return [];

    // Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);

    if (!classes) return [];

    // Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds);

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])];

    // Get teacher profiles
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds);

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds);

    // Get students for these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds);

    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])];

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds);

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds);

    // Get sessions for these classes (include all fields)
    const { data: classSessions, error: sessionError } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds);

    if (sessionError) {
        console.error('Error fetching class sessions:', sessionError);
    }

    // Compose the result
    const result: ClassType[] = classes.map(classData => {
        // Teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classData.id)
            .map(ct => ct.teacher_id) || [];

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || [];

        const students: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        // Find sessions for this class - now using start_date and end_date
        const sessions: SessionType[] = classSessions
            ?.filter(session => session.class_id === classData.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || [];

        // Parse days_repeated using the helper function
        const daysRepeated = parseDaysRepeated(classData.days_repeated)

        return {
            class_id: classData.id,
            title: classData.title,
            description: classData.description || null,
            subject: classData.subject,
            start_date: classData.start_date,
            end_date: classData.end_date,
            status: classData.status,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classData.class_link || null,
            teachers: teachers,
            students: students,
            created_at: classData.created_at,
            updated_at: classData.updated_at || null
        };
    });

    return result;
}

export async function getSessionById(sessionId: string): Promise<ClassSessionType | null> {
    const supabase = createClient()

    // Get the session details
    const { data: sessionData } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

    if (!sessionData) {
        return null
    }

    // Get the class details
    const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', sessionData.class_id)
        .single()

    if (!classData) {
        return null
    }

    // Get teachers for this class
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('teacher_id')
        .eq('class_id', classData.id)

    const teacherIds = classTeachers?.map(ct => ct.teacher_id) || []

    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    const teachers: TeacherType[] = teacherProfiles?.map(teacher => ({
        teacher_id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        gender: teacher.gender,
        country: teacher.country,
        language: teacher.language,
        email: teacher.email,
        phone: teacher.phone || null,
        status: teacher.status,
        role: teacher.role,
        avatar_url: teacher.avatar_url,
        specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
        hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
        notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
        created_at: teacher.created_at,
        updated_at: teacher.updated_at || null,
        is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
    })) || []

    // Get students for this class
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classData.id)

    const studentIds = classStudents?.map(cs => cs.student_id) || []

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    const students: StudentType[] = studentIds
        .map(studentId => {
            const student = studentData?.find(s => s.id === studentId)
            if (!student) return null
            return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
        })
        .filter(Boolean) as StudentType[]

    return {
        class_id: classData.id,
        session_id: sessionData.id,
        title: classData.title,
        description: classData.description || null,
        subject: classData.subject,
        start_date: sessionData.start_date,
        end_date: sessionData.end_date,
        status: sessionData.status,
        cancellation_reason: sessionData.cancellation_reason || null,
        cancelled_by: sessionData.cancelled_by || null,
        class_link: classData.class_link || null,
        teachers: teachers,
        students: students
    }
}

export async function getSessions(classId: string): Promise<ClassSessionType[]> {
    const supabase = createClient();

    // Get the class details
    const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

    if (!classData) {
        return [];
    }

    // Get teachers for this class
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('teacher_id')
        .eq('class_id', classData.id);

    const teacherIds = classTeachers?.map(ct => ct.teacher_id) || [];

    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds);

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds);

    const teachers: TeacherType[] = teacherProfiles?.map(teacher => ({
        teacher_id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        gender: teacher.gender,
        country: teacher.country,
        language: teacher.language,
        email: teacher.email,
        phone: teacher.phone || null,
        status: teacher.status,
        role: teacher.role,
        avatar_url: teacher.avatar_url,
        specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
        hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
        notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
        created_at: teacher.created_at,
        updated_at: teacher.updated_at || null,
        is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
    })) || [];

    // Get students for this class
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classData.id);

    const studentIds = classStudents?.map(cs => cs.student_id) || [];

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds);

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds);

    const students: StudentType[] = studentIds
        .map(studentId => {
            const student = studentData?.find(s => s.id === studentId)
            if (!student) return null
            return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
        })
        .filter(Boolean) as StudentType[];

    // Get sessions for this class
    const { data: classSessions } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('class_id', classId);

    if (!classSessions) {
        return [];
    }

    // Format each session to match ClassSessionType, including class and participants info
    const formattedSessions: ClassSessionType[] = classSessions.map(session => ({
        class_id: classData.id,
        session_id: session.id,
        title: classData.title,
        description: classData.description || null,
        subject: classData.subject,
        start_date: session.start_date,
        end_date: session.end_date,
        status: session.status,
        cancellation_reason: session.cancellation_reason || null,
        cancelled_by: session.cancelled_by || null,
        class_link: classData.class_link || null,
        teachers: teachers,
        students: students
    }));

    return formattedSessions;
}

export async function getSessionsByTeacherId(teacherId: string): Promise<ClassSessionType[]> {
    const supabase = createClient()

    // Get class IDs for this teacher
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId)

    const classIds = teacherClasses?.map(tc => tc.class_id) || []

    // Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)

    // Get sessions for these classes
    const { data: sessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)

    // Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    // Get teacher profiles
    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Get students for these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    // Get student data from students table
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // Combine class and session data to match ClassSessionType
    const classSessionsData: ClassSessionType[] = []

    sessions?.forEach(sessionData => {
        const classData = classes?.find(c => c.id === sessionData.class_id)
        if (!classData) return

        // Get teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classData.id)
            .map(ct => ct.teacher_id) || []

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Get students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || []

        const students: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        classSessionsData.push({
            class_id: classData.id,
            session_id: sessionData.id,
            title: classData.title,
            description: classData.description || null,
            subject: classData.subject,
            start_date: sessionData.start_date,
            end_date: sessionData.end_date,
            status: sessionData.status,
            class_link: classData.class_link || null,
            teachers: teachers,
            students: students
        })
    })

    return classSessionsData
}

export async function getTeacherSessionsToday(teacherId: string): Promise<ClassSessionType[]> {
    const supabase = createClient();

    // Get today's date range in ISO format (local time)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Get class IDs for this teacher
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId);

    const classIds = teacherClasses?.map(tc => tc.class_id) || [];
    if (classIds.length === 0) return [];

    // 2. Get sessions for these classes that are today
    const { data: sessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString());

    if (!sessions || sessions.length === 0) return [];

    // 3. Get class details for these sessions
    const sessionClassIds = [...new Set(sessions.map(s => s.class_id))];
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', sessionClassIds);

    // 4. Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', sessionClassIds);

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])];
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds);

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds);

    // 5. Get students for these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', sessionClassIds);

    // 6. Get student data from students table
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])];
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds);

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds);

    // 7. Build the result
    const result: ClassSessionType[] = sessions.map(session => {
        const classData = classes?.find(c => c.id === session.class_id);

        // Teachers for this class
        const teachers = (classTeachers
            ?.filter(ct => ct.class_id === session.class_id)
            .map(ct => {
                const teacherProfile = teacherProfiles?.find(tp => tp.id === ct.teacher_id);
                return {
                    teacher_id: teacherProfile?.id,
                    first_name: teacherProfile?.first_name,
                    last_name: teacherProfile?.last_name,
                    gender: teacherProfile?.gender,
                    country: teacherProfile?.country,
                    language: teacherProfile?.language,
                    email: teacherProfile?.email || null,
                    phone: teacherProfile?.phone || null,
                    status: teacherProfile?.status,
                    role: teacherProfile?.role,
                    avatar_url: teacherProfile?.avatar_url,
                    specialization: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.specialization || null,
                    hourly_rate: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.hourly_rate || null,
                    notes: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.notes || null,
                    created_at: teacherProfile?.created_at,
                    updated_at: teacherProfile?.updated_at || null,
                    is_admin: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.is_admin ?? false,
                }
            }) || []).filter(Boolean);

        // Students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === session.class_id)
            .map(cs => cs.student_id) || [];

        const enrolledStudents: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[];

        return {
            class_id: session.class_id,
            session_id: session.id,
            title: classData?.title || null,
            description: classData?.description || null,
            subject: classData?.subject || null,
            start_date: session.start_date,
            end_date: session.end_date,
            status: session.status,
            class_link: classData?.class_link || null,
            teachers: teachers,
            students: enrolledStudents
        };
    });

    return result;
}

export async function getStudentSessionsToday(studentId: string): Promise<ClassSessionType[]> {
    const supabase = createClient();

    // Get today's date range in ISO format (local time)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Get class IDs for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId);

    const classIds = studentClasses?.map(sc => sc.class_id) || [];
    if (classIds.length === 0) return [];

    // 2. Get sessions for these classes that are today
    const { data: sessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString());

    if (!sessions || sessions.length === 0) return [];

    // 3. Get class details for these sessions
    const sessionClassIds = [...new Set(sessions.map(s => s.class_id))];
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', sessionClassIds);

    // 4. Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', sessionClassIds);

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])];
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds);

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds);

    // 5. Get students for these classes
    const { data: classStudentsAll } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', sessionClassIds);

    // 6. Get student data from students table
    const studentIds = [...new Set(classStudentsAll?.map(cs => cs.student_id) || [])];
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds);

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds);

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds);

    // 7. Build the result
    const result: ClassSessionType[] = sessions.map(session => {
        const classData = classes?.find(c => c.id === session.class_id);

        // Teachers for this class
        const teachers = (classTeachers
            ?.filter(ct => ct.class_id === session.class_id)
            .map(ct => {
                const teacherProfile = teacherProfiles?.find(tp => tp.id === ct.teacher_id);
                return {
                    teacher_id: teacherProfile?.id,
                    first_name: teacherProfile?.first_name,
                    last_name: teacherProfile?.last_name,
                    gender: teacherProfile?.gender,
                    country: teacherProfile?.country,
                    language: teacherProfile?.language,
                    email: teacherProfile?.email || null,
                    phone: teacherProfile?.phone || null,
                    status: teacherProfile?.status,
                    role: teacherProfile?.role,
                    avatar_url: teacherProfile?.avatar_url,
                    specialization: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.specialization || null,
                    hourly_rate: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.hourly_rate || null,
                    notes: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.notes || null,
                    created_at: teacherProfile?.created_at,
                    updated_at: teacherProfile?.updated_at || null,
                    is_admin: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.is_admin ?? false,
                }
            }) || []).filter(Boolean);

        // Students for this class
        const classStudentIds = classStudentsAll
            ?.filter(cs => cs.class_id === session.class_id)
            .map(cs => cs.student_id) || [];

        const enrolledStudents: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[];

        return {
            class_id: session.class_id,
            session_id: session.id,
            title: classData?.title || null,
            description: classData?.description || null,
            subject: classData?.subject || null,
            start_date: session.start_date,
            end_date: session.end_date,
            status: session.status,
            class_link: classData?.class_link || null,
            teachers: teachers,
            students: enrolledStudents
        };
    });

    return result;
}

export async function getSessionsByStudentId(studentId: string): Promise<ClassSessionType[]> {
    const supabase = createClient()

    // Get class IDs for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId)

    const classIds = studentClasses?.map(sc => sc.class_id) || []

    // Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)

    // Get sessions for these classes
    const { data: sessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)

    // Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    // Get teacher profiles
    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // Get students for these classes
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    // Get student data from students table
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // Combine class and session data to match ClassSessionType
    const classSessionsData: ClassSessionType[] = []

    sessions?.forEach(sessionData => {
        const classData = classes?.find(c => c.id === sessionData.class_id)
        if (!classData) return

        // Get teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classData.id)
            .map(ct => ct.teacher_id) || []

        const teachers: TeacherType[] = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Get students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || []

        const students: StudentType[] = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        classSessionsData.push({
            class_id: classData.id,
            session_id: sessionData.id,
            title: classData.title,
            description: classData.description || null,
            subject: classData.subject,
            start_date: sessionData.start_date,
            end_date: sessionData.end_date,
            status: sessionData.status,
            class_link: classData.class_link || null,
            teachers: teachers,
            students: students
        })
    })

    return classSessionsData
}

export async function getTeacherClassCount(teacherId: string) {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('class_teachers')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)

    if (error) {
        console.error('Error fetching teacher classes count:', error)
        return 0
    }

    return count
}

export async function getStudentClassCount(studentId: string) {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)

    if (error) {
        console.error('Error fetching student classes count:', error)
        return 0
    }

    return count
}

export async function getWeeklySessionsCount() {
    const supabase = createClient()

    // Get current date
    const now = new Date()

    // Get start of current week (Monday)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
    startOfWeek.setHours(0, 0, 0, 0)

    // Get end of current week (Sunday)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Query class sessions within the current week
    const { count, error } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', startOfWeek.toISOString())
        .lte('start_date', endOfWeek.toISOString())

    if (error) {
        console.error('Error fetching weekly class sessions count:', error)
        return 0
    }

    return count
}

export async function getSessionsCountByStatus(status: string) {
    const supabase = createClient()

    // Get today's date range in ISO format
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const { count, error } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString())

    if (error) {
        console.error('Error fetching class sessions count by status:', error)
        return 0
    }

    return count
}

export async function getClassStudentCount(classId: string) {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)

    if (error) {
        console.error('Error fetching class student count:', error)
        return 0
    }

    return count
}

export async function getParentStudentsSessionsToday(parentId: string): Promise<ClassSessionType[]> {
    const supabase = createClient()

    // 1. Get all students of this parent through child_profiles
    const { data: parentChildProfiles } = await supabase
        .from('child_profiles')
        .select('student_id')
        .eq('parent_profile_id', parentId)

    if (!parentChildProfiles || parentChildProfiles.length === 0) return []

    const parentStudentIds = parentChildProfiles.map(cp => cp.student_id)

    // 2. Get all classes that these students are enrolled in
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id')
        .in('student_id', parentStudentIds)

    if (!classStudents || classStudents.length === 0) return []

    const classIds = [...new Set(classStudents.map(cs => cs.class_id))]

    // 3. Get today's sessions for these classes
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: sessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)
        .gte('start_date', startOfDay.toISOString())
        .lte('start_date', endOfDay.toISOString())

    if (!sessions || sessions.length === 0) return []

    const sessionClassIds = sessions.map(s => s.class_id)

    // 4. Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', sessionClassIds)

    // 5. Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', sessionClassIds)

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // 6. Get all students for these classes
    const { data: classStudentsAll } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', sessionClassIds)

    const studentIds = [...new Set(classStudentsAll?.map(cs => cs.student_id) || [])]

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // 7. Build the result
    const result: ClassSessionType[] = sessions.map(session => {
        const classData = classes?.find(c => c.id === session.class_id)

        // Teachers for this class
        const teachers = (classTeachers
            ?.filter(ct => ct.class_id === session.class_id)
            .map(ct => {
                const teacherProfile = teacherProfiles?.find(tp => tp.id === ct.teacher_id)
                return {
                    teacher_id: teacherProfile?.id,
                    first_name: teacherProfile?.first_name,
                    last_name: teacherProfile?.last_name,
                    gender: teacherProfile?.gender,
                    country: teacherProfile?.country,
                    language: teacherProfile?.language,
                    email: teacherProfile?.email || null,
                    phone: teacherProfile?.phone || null,
                    status: teacherProfile?.status,
                    role: teacherProfile?.role,
                    avatar_url: teacherProfile?.avatar_url,
                    specialization: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.specialization || null,
                    hourly_rate: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.hourly_rate || null,
                    notes: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.notes || null,
                    created_at: teacherProfile?.created_at,
                    updated_at: teacherProfile?.updated_at || null,
                    is_admin: teacherData?.find(t => t.profile_id === teacherProfile?.id)?.is_admin ?? false,
                }
            }) || []).filter(Boolean)

        // Students for this class
        const classStudentIds = classStudentsAll
            ?.filter(cs => cs.class_id === session.class_id)
            .map(cs => cs.student_id) || []

        const enrolledStudents = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], childProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        return {
            class_id: session.class_id,
            session_id: session.id,
            title: classData?.title || null,
            description: classData?.description || null,
            subject: classData?.subject || null,
            start_date: session.start_date,
            end_date: session.end_date,
            status: session.status,
            class_link: classData?.class_link || null,
            teachers: teachers,
            students: enrolledStudents
        }
    })

    return result
}

export async function getClassesByParentId(parentId: string): Promise<ClassType[]> {
    const supabase = createClient()

    // 1. Get all students of this parent through child_profiles
    const { data: parentChildProfiles } = await supabase
        .from('child_profiles')
        .select('student_id')
        .eq('parent_profile_id', parentId)

    if (!parentChildProfiles || parentChildProfiles.length === 0) return []

    const parentStudentIds = parentChildProfiles.map(cp => cp.student_id)

    // 2. Get all classes that these students are enrolled in
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('class_id')
        .in('student_id', parentStudentIds)

    if (!classStudents || classStudents.length === 0) return []

    const classIds = [...new Set(classStudents.map(cs => cs.class_id))]

    // 3. Get class details
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)

    if (!classes || classes.length === 0) return []

    // 4. Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('class_id, teacher_id')
        .in('class_id', classIds)

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', teacherIds)

    const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .in('profile_id', teacherIds)

    // 5. Get all students for these classes
    const { data: classStudentsAll } = await supabase
        .from('class_students')
        .select('class_id, student_id')
        .in('class_id', classIds)

    const studentIds = [...new Set(classStudentsAll?.map(cs => cs.student_id) || [])]

    // Get student data from students table
    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('id', studentIds)

    // Get profiles for independent students
    const independentStudentIds = studentData?.filter(s => s.student_type === 'independent' && s.profile_id).map(s => s.profile_id) || []
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', independentStudentIds)

    // Get child profiles for dependent students
    const { data: classChildProfiles } = await supabase
        .from('child_profiles')
        .select('*')
        .in('student_id', studentIds)

    // 6. Get sessions for these classes
    const { data: classSessions } = await supabase
        .from('class_sessions')
        .select('*')
        .in('class_id', classIds)

    // 7. Build the result
    const result: ClassType[] = classes.map(classData => {
        // Teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classData.id)
            .map(ct => ct.teacher_id) || []

        const teachers = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                teacher_id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                gender: teacher.gender,
                country: teacher.country,
                language: teacher.language,
                email: teacher.email,
                phone: teacher.phone || null,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null,
                is_admin: teacherData?.find(t => t.profile_id === teacher.id)?.is_admin ?? false,
            })) || []

        // Students for this class
        const classStudentIds = classStudentsAll
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || []

        const students = classStudentIds
            .map(studentId => {
                const student = studentData?.find(s => s.id === studentId)
                if (!student) return null
                return mapStudentToStudentType(student, studentProfiles || [], classChildProfiles || [])
            })
            .filter(Boolean) as StudentType[]

        // Sessions for this class
        const sessions = classSessions
            ?.filter(session => session.class_id === classData.id)
            .map(session => ({
                session_id: session.id,
                start_date: session.start_date,
                end_date: session.end_date,
                status: session.status,
                created_at: session.created_at,
                updated_at: session.updated_at || null
            })) || []

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classData.days_repeated
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim())
        }

        return {
            class_id: classData.id,
            title: classData.title,
            description: classData.description || null,
            subject: classData.subject,
            start_date: classData.start_date,
            end_date: classData.end_date,
            days_repeated: daysRepeated,
            class_link: classData.class_link || null,
            status: classData.status,
            created_at: classData.created_at,
            updated_at: classData.updated_at || null,
            teachers: teachers,
            students: students,
            sessions: sessions
        }
    })

    return result
}

export async function getSessionAttendance(sessionId: string): Promise<StudentAttendanceType[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('session_id', sessionId)

    if (error) {
        console.error('Error fetching session attendance:', error)
        return []
    }

    return data || []
}

export async function getSessionCountByTeacherId(teacherId: string) {
    const supabase = createClient()

    // Get class IDs for this teacher
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId)

    if (!teacherClasses || teacherClasses.length === 0) return 0

    const classIds = teacherClasses.map(tc => tc.class_id)

    // Get count of active sessions for these classes
    const { count, error } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)
        .in('status', ['scheduled', 'pending', 'running'])

    if (error) {
        console.error('Error fetching teacher session count:', error)
        return 0
    }

    return count || 0
}

export async function getSessionCountByStudentId(studentId: string) {
    const supabase = createClient()

    // Get class IDs for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId)

    if (!studentClasses || studentClasses.length === 0) return 0

    const classIds = studentClasses.map(sc => sc.class_id)

    // Get count of active sessions for these classes
    const { count, error } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)
        .in('status', ['scheduled', 'pending', 'running'])

    if (error) {
        console.error('Error fetching student session count:', error)
        return 0
    }

    return count || 0
}

export async function getActiveClassesCount() {
    const supabase = createClient()

    const { count, error } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

    if (error) {
        console.error('Error fetching active classes count:', error)
        return 0
    }

    return count || 0
}

export async function getSessionAttendanceForAll(sessionId: string): Promise<{
    teacherAttendance: TeacherAttendanceType[],
    studentAttendance: StudentAttendanceType[]
}> {
    const supabase = createClient()

    try {
        // Get teacher attendance
        const { data: teacherAttendance, error: teacherError } = await supabase
            .from('teacher_attendance')
            .select('*')
            .eq('session_id', sessionId)

        if (teacherError) {
            console.error('Error fetching teacher attendance:', teacherError)
        }

        // Get student attendance
        const { data: studentAttendance, error: studentError } = await supabase
            .from('student_attendance')
            .select('*')
            .eq('session_id', sessionId)

        if (studentError) {
            console.error('Error fetching student attendance:', studentError)
        }

        return {
            teacherAttendance: teacherAttendance || [],
            studentAttendance: studentAttendance || []
        }
    } catch (error) {
        console.error('Error fetching session attendance for all:', error)
        return {
            teacherAttendance: [],
            studentAttendance: []
        }
    }
}

export async function getClassBySessionId(sessionId: string): Promise<string | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('class_sessions')
        .select('class_id')
        .eq('id', sessionId)
        .single();

    if (error) {
        console.error('Error fetching class by session id:', error);
        return null;
    }

    return data?.class_id || null;
}

export async function getPendingRescheduleRequestsCount(): Promise<number> {
    const supabase = createClient()

    try {
        const { count, error } = await supabase
            .from('class_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('reschedule_status', 'pending')
            .eq('status', 'cancelled')

        if (error) {
            console.error('Error fetching pending reschedule requests count:', error)
            return 0
        }

        return count || 0
    } catch (error) {
        console.error('Error in getPendingRescheduleRequestsCount:', error)
        return 0
    }
}

