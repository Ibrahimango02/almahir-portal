import { createClient } from "@/utils/supabase/client"

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
