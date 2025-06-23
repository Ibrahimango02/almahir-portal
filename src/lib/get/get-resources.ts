import { createClient } from '@/utils/supabase/client'
import { ResourceType } from '@/types'

export async function getResources(): Promise<ResourceType[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch resources: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByUser(userId: string): Promise<ResourceType[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch user resources: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByStudentTeachers(studentId: string): Promise<ResourceType[]> {
    const supabase = createClient()

    // First, get all classes for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId)

    const classIds = studentClasses?.map(sc => sc.class_id) || []
    if (classIds.length === 0) return []

    // Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('teacher_id')
        .in('class_id', classIds)

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
    if (teacherIds.length === 0) return []

    // Get resources uploaded by these teachers (including public resources)
    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .in('uploaded_by', teacherIds)
        .or('is_public.eq.true')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch student teacher resources: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByParentStudentsTeachers(parentId: string): Promise<ResourceType[]> {
    const supabase = createClient()

    // First, get all students associated with this parent
    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', parentId)

    const studentIds = parentStudents?.map(ps => ps.student_id) || []
    if (studentIds.length === 0) return []

    // Get all classes for these students
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .in('student_id', studentIds)

    const classIds = studentClasses?.map(sc => sc.class_id) || []
    if (classIds.length === 0) return []

    // Get all teachers for these classes
    const { data: classTeachers } = await supabase
        .from('class_teachers')
        .select('teacher_id')
        .in('class_id', classIds)

    const teacherIds = [...new Set(classTeachers?.map(ct => ct.teacher_id) || [])]
    if (teacherIds.length === 0) return []

    // Get resources uploaded by these teachers (including public resources)
    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .in('uploaded_by', teacherIds)
        .or('is_public.eq.true')
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch parent students teacher resources: ${error.message}`)
    }

    return data || []
}