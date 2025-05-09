import { createClient } from "@/utils/supabase/client"
import { AdminType } from "@/types"


export async function getProfile() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not found')
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id).single()

    if (error) {
        throw error
    }

    return data
}

export async function getAdmins(): Promise<AdminType[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, status, created_at')
        .eq('role', 'admin')

    if (error) {
        throw error
    }

    return data
}

export async function getAdminById(id: string): Promise<AdminType> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, status, created_at')
        .eq('id', id)
        .single()

    if (error) {
        throw error
    }

    return data
}
