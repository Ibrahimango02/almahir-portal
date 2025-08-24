import { createClient } from '@/utils/supabase/client'

export async function getAdminIds(): Promise<string[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .eq('status', 'active')

        if (error) {
            console.error('Supabase error:', error)
            return []
        }

        return data?.map(admin => admin.id) || []
    } catch (error) {
        console.error('Error fetching admin IDs:', error)
        return []
    }
}

export async function getAdminEmails(): Promise<string[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('role', 'admin')
            .eq('status', 'active')

        if (error) {
            console.error('Supabase error:', error)
            return []
        }

        return data?.map(admin => admin.email) || []
    } catch (error) {
        console.error('Error fetching admin emails:', error)
        return []
    }
} 