import { createClient } from '@/utils/supabase/client'
import { ClassType, ClassSessionType, TeacherType, StudentType, SessionType } from '@/types'
import { calculateAge } from '@/lib/utils'

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

    // Get student profile information
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

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
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents: StudentType[] = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || []

        // Find sessions for this class - now using start_date and end_date
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
            enrolled_students: enrolledStudents,
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

    // Get student profile information
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

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
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents: StudentType[] = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || []

        // Get today's sessions for this class
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
            enrolled_students: enrolledStudents,
            created_at: classItem.created_at,
            updated_at: classItem.updated_at || null
        }
    }) || []

    // Only return classes that have sessions today
    return formattedClasses.filter(cls => cls.sessions.length > 0)
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

    // Get student profiles and data
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

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
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents: StudentType[] = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || []

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
            enrolled_students: enrolledStudents,
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
        timezone: teacher.timezone,
        status: teacher.status,
        role: teacher.role,
        avatar_url: teacher.avatar_url,
        specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
        hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
        notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
        created_at: teacher.created_at,
        updated_at: teacher.updated_at || null
    })) || [];

    // Get students for this class
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classData.id);

    const studentIds = classStudents?.map(cs => cs.student_id) || [];

    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds);

    const enrolledStudents: StudentType[] = studentProfiles?.map(student => ({
        student_id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        gender: student.gender,
        country: student.country,
        language: student.language,
        email: student.email || null,
        phone: student.phone || null,
        timezone: student.timezone,
        status: student.status,
        role: student.role,
        avatar_url: student.avatar_url,
        age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
        grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
        notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
        created_at: student.created_at,
        updated_at: student.updated_at || null
    })) || [];

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
        enrolled_students: enrolledStudents,
        created_at: classData.created_at,
        updated_at: classData.updated_at || null
    };
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
        timezone: teacher.timezone,
        status: teacher.status,
        role: teacher.role,
        avatar_url: teacher.avatar_url,
        specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
        hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
        notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
        created_at: teacher.created_at,
        updated_at: teacher.updated_at || null
    })) || []

    // Get students for this class
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classData.id)

    const studentIds = classStudents?.map(cs => cs.student_id) || []

    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

    const students: StudentType[] = studentProfiles?.map(student => ({
        student_id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        gender: student.gender,
        country: student.country,
        language: student.language,
        email: student.email || null,
        phone: student.phone || null,
        timezone: student.timezone,
        status: student.status,
        role: student.role,
        avatar_url: student.avatar_url,
        age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
        grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
        notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
        created_at: student.created_at,
        updated_at: student.updated_at || null
    })) || []

    return {
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
        enrolled_students: students
    }
}

export async function getClassSessions(classId: string): Promise<ClassSessionType[]> {
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
        timezone: teacher.timezone,
        status: teacher.status,
        role: teacher.role,
        avatar_url: teacher.avatar_url,
        specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
        hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
        notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
        created_at: teacher.created_at,
        updated_at: teacher.updated_at || null
    })) || [];

    // Get students for this class
    const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classData.id);

    const studentIds = classStudents?.map(cs => cs.student_id) || [];

    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds);

    const students: StudentType[] = studentProfiles?.map(student => ({
        student_id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        gender: student.gender,
        country: student.country,
        language: student.language,
        email: student.email || null,
        phone: student.phone || null,
        timezone: student.timezone,
        status: student.status,
        role: student.role,
        avatar_url: student.avatar_url,
        age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
        grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
        notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
        created_at: student.created_at,
        updated_at: student.updated_at || null
    })) || [];

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
        class_link: classData.class_link || null,
        teachers: teachers,
        enrolled_students: students
    }));

    return formattedSessions;
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

    // Get student profiles
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds);

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
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || [];

        // Students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || [];

        const students: StudentType[] = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || [];

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classData.days_repeated;
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim());
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
            sessions: [], // Sessions are not included in this function
            class_link: classData.class_link || null,
            teachers: teachers,
            enrolled_students: students,
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

    // Get student profiles
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds);

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
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || [];

        // Students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || [];

        const students: StudentType[] = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || [];

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classData.days_repeated;
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim());
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
            sessions: [], // Sessions are not included in this function
            class_link: classData.class_link || null,
            teachers: teachers,
            enrolled_students: students,
            created_at: classData.created_at,
            updated_at: classData.updated_at || null
        };
    });

    return result;
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

    // Get student profiles
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

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
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || []

        // Get students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || []

        const students: StudentType[] = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || []

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
            enrolled_students: students
        })
    })

    return classSessionsData
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

    // Get student profiles
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .in('profile_id', studentIds)

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
                timezone: teacher.timezone,
                status: teacher.status,
                role: teacher.role,
                avatar_url: teacher.avatar_url,
                specialization: teacherData?.find(t => t.profile_id === teacher.id)?.specialization || null,
                hourly_rate: teacherData?.find(t => t.profile_id === teacher.id)?.hourly_rate || null,
                notes: teacherData?.find(t => t.profile_id === teacher.id)?.notes || null,
                created_at: teacher.created_at,
                updated_at: teacher.updated_at || null
            })) || []

        // Get students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classData.id)
            .map(cs => cs.student_id) || []

        const students: StudentType[] = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                student_id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                gender: student.gender,
                country: student.country,
                language: student.language,
                email: student.email || null,
                phone: student.phone || null,
                timezone: student.timezone,
                status: student.status,
                role: student.role,
                avatar_url: student.avatar_url,
                age: calculateAge(studentData?.find(s => s.profile_id === student.id)?.birth_date),
                grade_level: studentData?.find(s => s.profile_id === student.id)?.grade_level || null,
                notes: studentData?.find(s => s.profile_id === student.id)?.notes || null,
                created_at: student.created_at,
                updated_at: student.updated_at || null
            })) || []

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
            enrolled_students: students
        })
    })

    return classSessionsData
}

export async function getTeacherClassCount(teacherId: string) {
    const supabase = createClient()

    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId)

    const classIds = teacherClasses?.map(tc => tc.class_id) || []

    const { count, error } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds)

    if (error) {
        console.error('Error fetching teacher classes count:', error)
        return 0
    }

    return count
}

export async function getWeeklyClassesCount() {
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

export async function getClassesCountByStatus(status: string) {
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