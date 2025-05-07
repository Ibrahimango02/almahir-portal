import { createClient } from '@/utils/supabase/client'
import { ParentType } from '@/types'

export async function getParents(): Promise<ParentType[]> {
    const supabase = createClient()

    // select profiles of users who are parents
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
        .eq('role', 'parent')

    if (!profile) return []

    // Map the profile data to match ParentType
    const parents: ParentType[] = profile.map(parent => {

        return {
            parent_id: parent.id,
            first_name: parent.first_name,
            last_name: parent.last_name,
            email: parent.email,
            phone: parent.phone,
            status: parent.status,
            created_at: parent.created_at
        }
    })

    return parents
}

export async function getParentById(id: string): Promise<ParentType | null> {
    const supabase = createClient()

    // Get the parent's profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
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
        email: profile.email,
        phone: profile.phone,
        status: profile.status,
        created_at: profile.created_at
    }
}

export async function getParentStudents(id: string) {
    const supabase = createClient()

    const { data } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', id)

    if (!data) return []

    const studentIds = data.map(student => student.student_id)


    const { data: students } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds)

    return students
}
