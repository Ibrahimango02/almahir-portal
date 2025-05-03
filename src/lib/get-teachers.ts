import { createClient } from '@/utils/supabase/client'

export async function getTeachers() {
    const supabase = await createClient()

    // select profiles of users who are teachers
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
        .eq('role', 'teacher')

    // select teacher-specific data
    const profileIds = profile?.map(p => p.id) || []


    // After getting the profile    
    const { data: teacher } = await supabase
        .from('teachers')
        .select('profile_id, specialization, hourly_rate')
        .in('profile_id', profileIds)

    // Combine the data into a single array of objects
    const combinedTeachers = profile?.map(profileData => {
        const teacherData = teacher?.find(t => t.profile_id === profileData.id)
        return {
            id: profileData.id,
            email: profileData.email,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone: profileData.phone,
            status: profileData.status,
            created_at: profileData.created_at,
            specialization: teacherData?.specialization || null,
            hourly_rate: teacherData?.hourly_rate || null
        }
    }) || []

    return combinedTeachers
}

export async function getTeachersCount() {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher')

    if (error) {
        console.error('Error fetching teachers count:', error)
        return 0
    }

    return count
}

export async function getTeacherById(id: string) {
    const supabase = await createClient()

    // Get the teacher's profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, status, created_at')
        .eq('id', id)
        .eq('role', 'teacher')
        .single()

    if (!profile) {
        return null
    }

    // Get the teacher-specific data
    const { data: teacher } = await supabase
        .from('teachers')
        .select('specialization, hourly_rate')
        .eq('profile_id', id)
        .single()

    // Combine the profile and teacher data
    return {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        status: profile.status,
        created_at: profile.created_at,
        specialization: teacher?.specialization || null,
        hourly_rate: teacher?.hourly_rate || null
    }
}



