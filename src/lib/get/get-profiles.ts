import { createClient } from "@/utils/supabase/client"
import { AdminType, ProfileType } from "@/types"


export async function getProfile(): Promise<ProfileType> {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not found')
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        throw error
    }

    return profile
}

export async function getProfileById(id: string): Promise<ProfileType> {
    const supabase = createClient()

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    if (!profile) {
        throw new Error('Profile not found')
    }

    return profile
}

export async function getAdmins(): Promise<AdminType[]> {
    const supabase = createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')

    if (error) {
        throw error
    }

    return profiles.map(profile => ({
        admin_id: profile.id,
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
        created_at: profile.created_at,
        updated_at: profile.updated_at
    }))
}

export async function getAdminById(id: string): Promise<AdminType> {
    const supabase = createClient()

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return profile
}
