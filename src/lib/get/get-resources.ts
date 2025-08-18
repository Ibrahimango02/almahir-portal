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

    // Get resources for these classes (including public resources)
    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .or(`class_id.in.(${classIds.join(',')}),is_public.eq.true`)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch student teacher resources: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByParentStudentsTeachers(parentId: string): Promise<ResourceType[]> {
    const supabase = createClient()

    // First, get all students associated with this parent
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('student_id')
        .eq('parent_profile_id', parentId)

    const studentIds = childProfiles?.map(cp => cp.student_id) || []
    if (studentIds.length === 0) return []

    // Get all classes for these students
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .in('student_id', studentIds)

    const classIds = studentClasses?.map(sc => sc.class_id) || []
    if (classIds.length === 0) return []

    // Get resources for these classes (including public resources)
    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .or(`class_id.in.(${classIds.join(',')}),is_public.eq.true`)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch parent students teacher resources: ${error.message}`)
    }

    return data || []
}

export async function getClassesForResourceUpload(): Promise<{ id: string; title: string; subject?: string }[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('classes')
        .select('id, title, subject')
        .eq('status', 'active')
        .order('title', { ascending: true })

    if (error) {
        throw new Error(`Failed to fetch classes: ${error.message}`)
    }

    return data || []
}

export async function getClassesForTeacherResourceUpload(teacherId: string): Promise<{ id: string; title: string; subject?: string }[]> {
    const supabase = createClient()

    // Get class IDs for this teacher
    const { data: teacherClasses } = await supabase
        .from('class_teachers')
        .select('class_id')
        .eq('teacher_id', teacherId)

    const classIds = teacherClasses?.map(tc => tc.class_id) || []
    if (classIds.length === 0) return []

    // Get class details
    const { data, error } = await supabase
        .from('classes')
        .select('id, title, subject')
        .in('id', classIds)
        .eq('status', 'active')
        .order('title', { ascending: true })

    if (error) {
        throw new Error(`Failed to fetch teacher classes: ${error.message}`)
    }

    return data || []
}

export async function getResourcesWithClassInfo(): Promise<(ResourceType & { class?: { title: string; subject?: string } })[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('resources')
        .select(`
            *,
            class:classes(title, subject)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch resources with class info: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByUserWithClassInfo(userId: string): Promise<(ResourceType & { class?: { title: string; subject?: string } })[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('resources')
        .select(`
            *,
            class:classes(title, subject)
        `)
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch user resources with class info: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByStudentTeachersWithClassInfo(studentId: string): Promise<(ResourceType & { class?: { title: string; subject?: string } })[]> {
    const supabase = createClient()

    // First, get all classes for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId)

    const classIds = studentClasses?.map(sc => sc.class_id) || []
    if (classIds.length === 0) return []

    // Get resources for these classes (including public resources) with class info
    const { data, error } = await supabase
        .from('resources')
        .select(`
            *,
            class:classes(title, subject)
        `)
        .or(`class_id.in.(${classIds.join(',')}),is_public.eq.true`)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch student teacher resources: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByParentStudentsTeachersWithClassInfo(parentId: string): Promise<(ResourceType & { class?: { title: string; subject?: string } })[]> {
    const supabase = createClient()

    // First, get all students associated with this parent
    const { data: childProfiles } = await supabase
        .from('child_profiles')
        .select('student_id')
        .eq('parent_profile_id', parentId)

    const studentIds = childProfiles?.map(cp => cp.student_id) || []
    if (studentIds.length === 0) return []

    // Get all classes for these students
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .in('student_id', studentIds)

    const classIds = studentClasses?.map(sc => sc.class_id) || []
    if (classIds.length === 0) return []

    // Get resources for these classes (including public resources) with class info
    const { data, error } = await supabase
        .from('resources')
        .select(`
            *,
            class:classes(title, subject)
        `)
        .or(`class_id.in.(${classIds.join(',')}),is_public.eq.true`)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch parent students teacher resources: ${error.message}`)
    }

    return data || []
}

export async function getResourcesByStudentId(studentId: string): Promise<(ResourceType & { class?: { title: string; subject?: string } })[]> {
    const supabase = createClient()

    // First, get all classes for this student
    const { data: studentClasses } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', studentId)

    const classIds = studentClasses?.map(sc => sc.class_id) || []
    if (classIds.length === 0) return []

    // Get resources for these classes (including public resources) with class info
    const { data, error } = await supabase
        .from('resources')
        .select(`
            *,
            class:classes(title, subject)
        `)
        .or(`class_id.in.(${classIds.join(',')}),is_public.eq.true`)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch student resources: ${error.message}`)
    }

    return data || []
}