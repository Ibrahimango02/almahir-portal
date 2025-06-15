import { createClient } from "@/utils/supabase/client"

type ProfileUpdateData = {
    first_name?: string
    last_name?: string
    gender?: string
    country?: string
    language?: string
    email?: string
    phone?: string | null
    timezone?: string
    status?: string
    role?: string
    avatar_url?: string | null
}

export async function updateProfile(userId: string, data: ProfileUpdateData) {
    const supabase = createClient()

    try {
        const { error: emailError } = await supabase.auth.updateUser({
            email: data.email
        })

        if (emailError) {
            throw emailError
        }
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (profileError) {
            throw profileError
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating profile:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update profile'
        }
    }
}

export async function updatePassword(userId: string, newPassword: string) {
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (error) {
            throw error
        }

        return { success: true }
    } catch (error) {
        console.error('Error updating password:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update password'
        }
    }
}


