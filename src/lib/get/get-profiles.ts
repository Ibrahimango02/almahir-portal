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

export async function getAdminsAndModerators(): Promise<AdminType[]> {
    const supabase = createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'moderator'])

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

export async function getModerators(): Promise<ProfileType[]> {
    const supabase = createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'moderator')

    if (error) {
        throw error
    }

    return profiles
}

export async function getModeratorById(id: string): Promise<(ProfileType & { notes?: string | null; payment_method?: string | null; payment_account?: string | null }) | null> {
    const supabase = createClient()

    // Get the moderator's profile data
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'moderator')
        .single()

    if (profileError || !profile) {
        return null
    }

    // Get the moderator-specific data from moderators table
    const { data: moderator } = await supabase
        .from('moderators')
        .select('notes, payment_method, payment_account')
        .eq('profile_id', id)
        .single()

    // Combine the profile and moderator data
    return {
        ...profile,
        notes: moderator?.notes || null,
        payment_method: moderator?.payment_method || null,
        payment_account: moderator?.payment_account || null,
    }
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

export async function checkIfAdmin(id: string): Promise<boolean> {
    const supabase = createClient();

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single();

    if (error || !profile) {
        return false;
    }

    return profile.role === 'admin';
}

export async function checkIfAdminOrModerator(id: string): Promise<boolean> {
    const supabase = createClient();

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single();

    if (error || !profile) {
        return false;
    }

    return profile.role === 'admin' || profile.role === 'moderator';
}