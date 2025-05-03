import { createClient } from '@/utils/supabase/client'

export async function getClasses() {
    const supabase = await createClient()

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
        .select('id, class_id, date, status, start_time, end_time')
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
        .select('id, first_name, last_name')
        .in('id', teacherIds)

    // Get student profile information
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds)

    // Format the data as required
    const formattedClasses = classes?.map(classItem => {
        // Find teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classItem.id)
            .map(ct => ct.teacher_id) || []

        const teachers = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name
            })) || []

        // Find sessions for this class - now including start_time and end_time
        const sessions = classSessions
            ?.filter(session => session.class_id === classItem.id)
            .map(session => ({
                sessionId: session.id,
                classId: session.class_id,
                date: session.date,
                status: session.status,
                start_time: session.start_time,
                end_time: session.end_time
            })) || []

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classItem.days_repeated
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim())
        }

        return {
            classId: classItem.id,
            title: classItem.title,
            description: classItem.description,
            subject: classItem.subject,
            start_date: classItem.start_date,
            end_date: classItem.end_date,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classItem.class_link,
            teachers: teachers,
            enrolled_students: enrolledStudents
        }
    }) || []

    return formattedClasses
}


export async function getClassesToday() {
    const supabase = await createClient()

    // Get today's date in YYYY-MM-DD format (using local timezone)
    const date = new Date()
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

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
        .select('id, class_id, date, status, start_time, end_time')
        .eq('date', today)
        .in('class_id', classIds)

    // Get all unique teacher IDs
    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]

    // Get all unique student IDs
    const studentIds = [...new Set(classStudents?.map(cs => cs.student_id) || [])]

    // Get teacher profile information
    const { data: teacherProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', teacherIds)

    // Get student profile information
    const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds)

    // Format the data as required
    const formattedClasses = classes?.map(classItem => {
        // Find teachers for this class
        const classTeacherIds = classTeachers
            ?.filter(ct => ct.class_id === classItem.id)
            .map(ct => ct.teacher_id) || []

        const teachers = teacherProfiles
            ?.filter(tp => classTeacherIds.includes(tp.id))
            .map(teacher => ({
                id: teacher.id,
                first_name: teacher.first_name,
                last_name: teacher.last_name
            })) || []

        // Find students for this class
        const classStudentIds = classStudents
            ?.filter(cs => cs.class_id === classItem.id)
            .map(cs => cs.student_id) || []

        const enrolledStudents = studentProfiles
            ?.filter(sp => classStudentIds.includes(sp.id))
            .map(student => ({
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name
            })) || []

        // Get today's sessions for this class
        const sessions = classSessions
            ?.filter(session => session.class_id === classItem.id)
            .map(session => ({
                id: session.id,
                class_id: session.class_id,
                date: session.date,
                status: session.status,
                start_time: session.start_time,
                end_time: session.end_time
            })) || []

        // Parse days_repeated to an array if it's a string
        let daysRepeated = classItem.days_repeated
        if (typeof daysRepeated === 'string') {
            daysRepeated = daysRepeated.split(',').map(day => day.trim())
        }

        return {
            id: classItem.id,
            title: classItem.title,
            description: classItem.description,
            subject: classItem.subject,
            start_date: classItem.start_date,
            end_date: classItem.end_date,
            days_repeated: daysRepeated,
            sessions: sessions,
            class_link: classItem.class_link,
            teachers: teachers,
            enrolled_students: enrolledStudents
        }
    }) || []

    // Only return classes that have sessions today
    return formattedClasses.filter(cls => cls.sessions.length > 0)
}

export async function getClassBySessionId(sessionId: string) {
    const supabase = await createClient()

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

    const teachers = teacherProfiles?.map(teacher => ({
        id: teacher.id,
        first_name: teacher.first_name,
        last_name: teacher.last_name
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

    const students = studentProfiles?.map(student => ({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name
    })) || []

    return {
        id: classData.id,
        title: classData.title,
        description: classData.description,
        subject: classData.subject,
        class_link: classData.class_link,
        session: {
            id: sessionData.id,
            date: sessionData.date,
            status: sessionData.status,
            start_time: sessionData.start_time,
            end_time: sessionData.end_time
        },
        teachers,
        enrolled_students: students
    }
}

export async function getClassesByTeacherId(teacherId: string) {
    const supabase = await createClient()

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

    // Combine class and session data
    const classesWithSessions = classes?.map(classData => {
        const classSessions = sessions?.filter(s => s.class_id === classData.id) || []
        return {
            id: classData.id,
            teacher_id: teacherId,
            title: classData.title,
            description: classData.description,
            subject: classData.subject,
            start_time: classSessions[0]?.start_time,
            end_time: classSessions[0]?.end_time,
            status: classSessions[0]?.status || 'scheduled',
            class_link: classData.class_link
        }
    }) || []

    return classesWithSessions
}

export async function getWeeklyClassesCount() {
    const supabase = await createClient()

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

    // Format dates for database query
    const startDate = startOfWeek.toISOString().split('T')[0]
    const endDate = endOfWeek.toISOString().split('T')[0]

    // Query class sessions within the current week
    const { count, error } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) {
        console.error('Error fetching weekly class sessions count:', error)
        return 0
    }

    return count
}

export async function getClassesCountByStatus(status: string) {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)

    if (error) {
        console.error('Error fetching class sessions count by status:', error)
        return 0
    }

    return count
}
