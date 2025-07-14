import { createClient } from "@/utils/supabase/client"

export async function getUserNameById(userId: string): Promise<string | null> {
    if (!userId) return null

    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', userId)
            .single()

        if (error || !data) {
            console.error('Error fetching user name:', error)
            return null
        }

        return `${data.first_name} ${data.last_name}`
    } catch (error) {
        console.error('Error fetching user name:', error)
        return null
    }
} 