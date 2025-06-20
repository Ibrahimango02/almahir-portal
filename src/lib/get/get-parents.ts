import { createClient } from '@/utils/supabase/client'
import { ParentType } from '@/types'

export async function getParents(): Promise<ParentType[]> {
    const supabase = createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'parent')

    if (!profile) return []

    const parentIds = profile.map(parent => parent.id)

    const { data: parents } = await supabase
        .from('parents')
        .select('*')
        .in('profile_id', parentIds)

    const combinedParents = profile?.map(parentProfile => {
        const parent = parents?.find(p => p.profile_id === parentProfile.id)

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

    const { data: parent } = await supabase
        .from('parents')
        .select('*')
        .eq('profile_id', id)
        .single()

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

export async function getParentStudents(id: string) {
    const supabase = createClient()

    const { data: parentStudents } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('parent_id', id)

    if (!parentStudents) return []

    const studentIds = parentStudents.map(student => student.student_id)


    const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds)

    return students
}
